/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { inject, injectable } from "inversify";
import { matchesKeystroke } from '../../utils/keyboard';
import { Bounds, Point, translate } from "../../utils/geometry";
import { TYPES } from "../../base/types";
import { SModelElement, SModelRoot, SModelRootSchema } from "../../base/model/smodel";
import { MouseListener } from "../../base/views/mouse-tool";
import { Action, RequestAction, ResponseAction, generateRequestId } from "../../base/actions/action";
import { CommandExecutionContext, PopupCommand, SystemCommand, CommandReturn, ICommand } from "../../base/commands/command";
import { IActionHandler } from "../../base/actions/action-handler";
import { EMPTY_ROOT } from "../../base/model/smodel-factory";
import { KeyListener } from "../../base/views/key-tool";
import { findParentByFeature, findParent } from "../../base/model/smodel-utils";
import { ViewerOptions } from "../../base/views/viewer-options";
import { getAbsoluteBounds } from '../bounds/model';
import { hasPopupFeature, isHoverable } from "./model";

/**
 * Triggered when the user puts the mouse pointer over an element.
 */
export class HoverFeedbackAction implements Action {
    static readonly KIND = 'hoverFeedback';
    kind = HoverFeedbackAction.KIND;

    constructor(public readonly mouseoverElement: string, public readonly mouseIsOver: boolean) {
    }
}

@injectable()
export class HoverFeedbackCommand extends SystemCommand {
    static readonly KIND = HoverFeedbackAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: HoverFeedbackAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const model: SModelRoot = context.root;
        const modelElement: SModelElement | undefined = model.index.getById(this.action.mouseoverElement);

        if (modelElement) {
            if (isHoverable(modelElement)) {
                modelElement.hoverFeedback = this.action.mouseIsOver;
            }
        }

        return this.redo(context);
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

/**
 * Triggered when the user hovers the mouse pointer over an element to get a popup with details on
 * that element. This action is sent from the client to the model source, e.g. a DiagramServer.
 * The response is a SetPopupModelAction.
 */
export class RequestPopupModelAction implements RequestAction<SetPopupModelAction> {
    static readonly KIND = 'requestPopupModel';
    readonly kind = RequestPopupModelAction.KIND;

    constructor(public readonly elementId: string,
                public readonly bounds: Bounds,
                public readonly requestId = '') {}

    /** Factory function to dispatch a request with the `IActionDispatcher` */
    static create(elementId: string, bounds: Bounds): RequestAction<SetPopupModelAction> {
        return new RequestPopupModelAction(elementId, bounds, generateRequestId());
    }
}

/**
 * Sent from the model source to the client to display a popup in response to a RequestPopupModelAction.
 * This action can also be used to remove any existing popup by choosing EMPTY_ROOT as root element.
 */
export class SetPopupModelAction implements ResponseAction {
    static readonly KIND = 'setPopupModel';
    readonly kind = SetPopupModelAction.KIND;

    constructor(public readonly newRoot: SModelRootSchema,
                public readonly responseId = '') {}
}

@injectable()
export class SetPopupModelCommand extends PopupCommand {
    static readonly KIND = SetPopupModelAction.KIND;

    oldRoot: SModelRoot;
    newRoot: SModelRoot;

    constructor(@inject(TYPES.Action) protected readonly action: SetPopupModelAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.oldRoot = context.root;
        this.newRoot = context.modelFactory.createRoot(this.action.newRoot);

        return this.newRoot;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return this.oldRoot;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.newRoot;
    }
}

export interface HoverState {
    mouseOverTimer: number | undefined
    mouseOutTimer: number | undefined
    popupOpen: boolean
    previousPopupElement: SModelElement | undefined
}

export abstract class AbstractHoverMouseListener extends MouseListener {

    protected mouseIsDown: boolean;

    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;
    @inject(TYPES.HoverState) protected state: HoverState;

    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.mouseIsDown = true;
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.mouseIsDown = false;
        return [];
    }

    protected stopMouseOutTimer(): void {
        if (this.state.mouseOutTimer !== undefined) {
            window.clearTimeout(this.state.mouseOutTimer);
            this.state.mouseOutTimer = undefined;
        }
    }

    protected startMouseOutTimer(): Promise<Action> {
        this.stopMouseOutTimer();
        return new Promise((resolve) => {
            this.state.mouseOutTimer = window.setTimeout(() => {
                this.state.popupOpen = false;
                this.state.previousPopupElement = undefined;
                resolve(new SetPopupModelAction({type: EMPTY_ROOT.type, id: EMPTY_ROOT.id}));
            }, this.options.popupCloseDelay);
        });
    }

    protected stopMouseOverTimer(): void {
        if (this.state.mouseOverTimer !== undefined) {
            window.clearTimeout(this.state.mouseOverTimer);
            this.state.mouseOverTimer = undefined;
        }
    }
}

@injectable()
export class HoverMouseListener extends AbstractHoverMouseListener {

    protected lastHoverFeedbackElementId?: string;

    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;

    protected computePopupBounds(target: SModelElement, mousePosition: Point): Bounds {
        // Default position: below the mouse cursor
        let offset: Point = { x: -5, y: 20 };

        const targetBounds = getAbsoluteBounds(target);
        const canvasBounds = target.root.canvasBounds;
        const boundsInWindow = translate(targetBounds, canvasBounds);
        const distRight = boundsInWindow.x + boundsInWindow.width - mousePosition.x;
        const distBottom = boundsInWindow.y + boundsInWindow.height - mousePosition.y;
        if (distBottom <= distRight && this.allowSidePosition(target, 'below', distBottom)) {
            // Put the popup below the target element
            offset = { x: -5, y: Math.round(distBottom + 5) };
        } else if (distRight <= distBottom && this.allowSidePosition(target, 'right', distRight)) {
            // Put the popup right of the target element
            offset = { x: Math.round(distRight + 5), y: -5 };
        }
        let leftPopupPosition = mousePosition.x + offset.x;
        const canvasRightBorderPosition = canvasBounds.x + canvasBounds.width;
        if (leftPopupPosition > canvasRightBorderPosition) {
            leftPopupPosition = canvasRightBorderPosition;
        }
        let topPopupPosition = mousePosition.y + offset.y;
        const canvasBottomBorderPosition = canvasBounds.y + canvasBounds.height;
        if (topPopupPosition > canvasBottomBorderPosition) {
            topPopupPosition = canvasBottomBorderPosition;
        }
        return { x: leftPopupPosition, y: topPopupPosition, width: -1, height: -1 };
    }

    protected allowSidePosition(target: SModelElement, side: 'above' | 'below' | 'left' | 'right', distance: number): boolean {
        return !(target instanceof SModelRoot) && distance <= 150;
    }

    protected startMouseOverTimer(target: SModelElement, event: MouseEvent): Promise<Action> {
        this.stopMouseOverTimer();
        return new Promise((resolve) => {
            this.state.mouseOverTimer = window.setTimeout(() => {
                const popupBounds = this.computePopupBounds(target, {x: event.pageX, y: event.pageY});
                resolve(new RequestPopupModelAction(target.id, popupBounds));

                this.state.popupOpen = true;
                this.state.previousPopupElement = target;
            }, this.options.popupOpenDelay);
        });
    }

    mouseOver(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: (Action | Promise<Action>)[] = [];
        if (!this.mouseIsDown) {
            const popupTarget = findParent(target, hasPopupFeature);
            if (this.state.popupOpen && (popupTarget === undefined ||
                this.state.previousPopupElement !== undefined && this.state.previousPopupElement.id !== popupTarget.id)) {
                result.push(this.startMouseOutTimer());
            } else {
                this.stopMouseOverTimer();
                this.stopMouseOutTimer();
            }
            if (popupTarget !== undefined &&
                (this.state.previousPopupElement === undefined || this.state.previousPopupElement.id !== popupTarget.id)) {
                result.push(this.startMouseOverTimer(popupTarget, event));
            }
            if (this.lastHoverFeedbackElementId) {
                result.push(new HoverFeedbackAction(this.lastHoverFeedbackElementId, false));
                this.lastHoverFeedbackElementId = undefined;
            }
            const hoverTarget = findParentByFeature(target, isHoverable);
            if (hoverTarget !== undefined) {
                result.push(new HoverFeedbackAction(hoverTarget.id, true));
                this.lastHoverFeedbackElementId = hoverTarget.id;
            }
        }
        return result;
    }

    mouseOut(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: (Action | Promise<Action>)[] = [];
        if (!this.mouseIsDown) {
            const elementUnderMouse = document.elementFromPoint(event.x, event.y);
            if (!this.isSprottyPopup(elementUnderMouse)) {
                if (this.state.popupOpen) {
                    const popupTarget = findParent(target, hasPopupFeature);
                    if (this.state.previousPopupElement !== undefined && popupTarget !== undefined
                        && this.state.previousPopupElement.id === popupTarget.id)
                        result.push(this.startMouseOutTimer());
                }
                this.stopMouseOverTimer();
                const hoverTarget = findParentByFeature(target, isHoverable);
                if (hoverTarget !== undefined) {
                    result.push(new HoverFeedbackAction(hoverTarget.id, false));
                    this.lastHoverFeedbackElementId = undefined;
                }
            }
        }
        return result;
    }

    protected isSprottyPopup(element: Element | null): boolean {
        return element
            ? (element.id === this.options.popupDiv
                || (!!element.parentElement && this.isSprottyPopup(element.parentElement)))
            : false;
    }

    mouseMove(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: (Action | Promise<Action>)[] = [];

        if (!this.mouseIsDown) {
            if (this.state.previousPopupElement !== undefined && this.closeOnMouseMove(this.state.previousPopupElement, event)) {
                result.push(this.startMouseOutTimer());
            }

            const popupTarget = findParent(target, hasPopupFeature);
            if (popupTarget !== undefined && (this.state.previousPopupElement === undefined
                || this.state.previousPopupElement.id !== popupTarget.id)) {
                result.push(this.startMouseOverTimer(popupTarget, event));
            }
        }

        return result;
    }

    protected closeOnMouseMove(target: SModelElement, event: MouseEvent): boolean {
        return target instanceof SModelRoot;
    }

}

@injectable()
export class PopupHoverMouseListener extends AbstractHoverMouseListener {

    mouseOut(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        return [this.startMouseOutTimer()];
    }

    mouseOver(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.stopMouseOutTimer();
        this.stopMouseOverTimer();
        return [];
    }
}

export class HoverKeyListener extends KeyListener {
    keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Escape')) {
            return [new SetPopupModelAction({type: EMPTY_ROOT.type, id: EMPTY_ROOT.id})];
        }
        return [];
    }
}

@injectable()
export class ClosePopupActionHandler implements IActionHandler {
    protected popupOpen: boolean = false;

    handle(action: Action): void | ICommand | Action {
        if (action.kind === SetPopupModelCommand.KIND) {
            this.popupOpen = (action as SetPopupModelAction).newRoot.type !== EMPTY_ROOT.type;
        } else if (this.popupOpen) {
            return new SetPopupModelAction({id: EMPTY_ROOT.id, type: EMPTY_ROOT.type});
        }
    }
}
