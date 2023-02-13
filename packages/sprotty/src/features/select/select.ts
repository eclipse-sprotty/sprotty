/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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

import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import {
    Action, BringToFrontAction, generateRequestId, RequestAction, ResponseAction, SelectAction as ProtocolSelectAction,
    SelectAllAction as ProtocolSelectAllActon
} from 'sprotty-protocol/lib/actions';
import { Command, CommandExecutionContext } from '../../base/commands/command';
import { ModelRequestCommand } from '../../base/commands/request-command';
import { SChildElement, SModelElement, SModelRoot, SParentElement } from '../../base/model/smodel';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { TYPES } from '../../base/types';
import { KeyListener } from '../../base/views/key-tool';
import { MouseListener } from '../../base/views/mouse-tool';
import { setClass } from '../../base/views/vnode-utils';
import { isCtrlOrCmd } from '../../utils/browser';
import { toArray } from '../../utils/iterable';
import { matchesKeystroke } from '../../utils/keyboard';
import { ButtonHandlerRegistry } from '../button/button-handler';
import { SButton } from '../button/model';
import { SwitchEditModeAction } from '../edit/edit-routing';
import { SRoutingHandle } from '../routing/model';
import { SRoutableElement } from '../routing/model';
import { findViewportScrollbar } from '../viewport/scroll';
import { isSelectable, Selectable } from './model';

/**
 * Triggered when the user changes the selection, e.g. by clicking on a selectable element. The resulting
 * SelectCommand changes the `selected` state accordingly, so the elements can be rendered differently.
 * This action is also forwarded to the diagram server, if present, so it may react on the selection change.
 * Furthermore, the server can send such an action to the client in order to change the selection programmatically.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class SelectAction implements Action, ProtocolSelectAction {
    static readonly KIND = 'elementSelected';
    readonly kind = SelectAction.KIND;

    constructor(public readonly selectedElementsIDs: string[] = [],
        public readonly deselectedElementsIDs: string[] = []) {
    }
}

/**
 * Programmatic action for selecting or deselecting all elements.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class SelectAllAction implements Action, ProtocolSelectAllActon {
    static readonly KIND = 'allSelected';
    readonly kind = SelectAllAction.KIND;

    /**
     * If `select` is true, all elements are selected, otherwise they are deselected.
     */
    constructor(public readonly select: boolean = true) {
    }
}

/**
 * Request action for retrieving the current selection.
 */
export interface GetSelectionAction extends RequestAction<SelectionResult> {
    kind: typeof GetSelectionAction.KIND
}
export namespace GetSelectionAction {
    export const KIND = 'getSelection';

    export function create(): GetSelectionAction {
        return {
            kind: KIND,
            requestId: generateRequestId()
        };
    }
}

export interface SelectionResult extends ResponseAction {
    kind: typeof SelectionResult.KIND
    selectedElementsIDs: string[]
}
export namespace SelectionResult {
    export const KIND = 'selectionResult';

    export function create(selectedElementsIDs: string[], requestId: string): SelectionResult {
        return {
            kind: KIND,
            selectedElementsIDs,
            responseId: requestId
        };
    }
}

@injectable()
export class SelectCommand extends Command {
    static readonly KIND = ProtocolSelectAction.KIND;

    protected selected: (SChildElement & Selectable)[] = [];
    protected deselected: (SChildElement & Selectable)[] = [];

    constructor(@inject(TYPES.Action) public action: ProtocolSelectAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const model = context.root;
        this.action.selectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElement && isSelectable(element)) {
                this.selected.push(element);
            }
        });
        this.action.deselectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElement && isSelectable(element)) {
                this.deselected.push(element);
            }
        });
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): SModelRoot {
        for (const element of this.selected) {
            element.selected = false;
        }
        for (const element of this.deselected) {
            element.selected = true;
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        for (const element of this.deselected) {
            element.selected = false;
        }
        for (const element of this.selected) {
            element.selected = true;
        }
        return context.root;
    }
}

@injectable()
export class SelectAllCommand extends Command {
    static readonly KIND = ProtocolSelectAllActon.KIND;

    protected previousSelection: Record<string, boolean> = {};

    constructor(@inject(TYPES.Action) protected readonly action: ProtocolSelectAllActon) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        this.selectAll(context.root, this.action.select);
        return context.root;
    }

    protected selectAll(element: SParentElement, newState: boolean): void {
        if (isSelectable(element)) {
            this.previousSelection[element.id] = element.selected;
            element.selected = newState;
        }
        for (const child of element.children) {
            this.selectAll(child, newState);
        }
    }

    undo(context: CommandExecutionContext): SModelRoot {
        const index = context.root.index;
        Object.keys(this.previousSelection).forEach(id => {
            const element = index.getById(id);
            if (element !== undefined && isSelectable(element))
                element.selected = this.previousSelection[id];
        });
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        this.selectAll(context.root, this.action.select);
        return context.root;
    }
}

export class SelectMouseListener extends MouseListener {

    @inject(ButtonHandlerRegistry) @optional() protected buttonHandlerRegistry: ButtonHandlerRegistry;

    wasSelected = false;
    hasDragged = false;

    override mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (event.button !== 0) {
            return [];
        }
        const buttonHandled = this.handleButton(target, event);
        if (buttonHandled) {
            return buttonHandled;
        }
        const selectableTarget = findParentByFeature(target, isSelectable);
        if (selectableTarget !== undefined || target instanceof SModelRoot) {
            this.hasDragged = false;
        }
        if (selectableTarget !== undefined) {
            let deselectedElements: SModelElement[] = [];
            // multi-selection?
            if (!isCtrlOrCmd(event)) {
                deselectedElements = this.collectElementsToDeselect(target, selectableTarget);
            }
            if (selectableTarget !== undefined) {
                if (!selectableTarget.selected) {
                    this.wasSelected = false;
                    return this.handleSelectTarget(selectableTarget, deselectedElements, event);
                } else if (isCtrlOrCmd(event)) {
                    this.wasSelected = false;
                    return this.handleDeselectTarget(selectableTarget, event);
                } else {
                    this.wasSelected = true;
                }
            } else {
                return this.handleDeselectAll(deselectedElements, event);
            }
        }
        return [];
    }

    protected collectElementsToDeselect(target: SModelElement, selectableTarget: (SModelElement & Selectable) | undefined): SModelElement[] {
        return toArray(target.root.index.all()
        .filter(element => isSelectable(element) && element.selected
            && !(selectableTarget instanceof SRoutingHandle && element === selectableTarget.parent as SModelElement)));
    }

    protected handleButton(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] | undefined {
        if (this.buttonHandlerRegistry !== undefined && target instanceof SButton && target.enabled) {
            const buttonHandler = this.buttonHandlerRegistry.get(target.type);
            if (buttonHandler !== undefined) {
                return buttonHandler.buttonPressed(target);
            }
        }
        return undefined;
    }

    protected handleSelectTarget(selectableTarget: SModelElement & Selectable, deselectedElements: SModelElement[], event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(new SelectAction([selectableTarget.id], deselectedElements.map(e => e.id)));
        result.push(BringToFrontAction.create([selectableTarget.id]));
        const routableDeselect = deselectedElements.filter(e => e instanceof SRoutableElement).map(e => e.id);
        if (selectableTarget instanceof SRoutableElement) {
            result.push(SwitchEditModeAction.create({ elementsToActivate: [selectableTarget.id], elementsToDeactivate: routableDeselect }));
        } else if (routableDeselect.length > 0) {
            result.push(SwitchEditModeAction.create({ elementsToDeactivate: routableDeselect }));
        }
        return result;
    }

    protected handleDeselectTarget(selectableTarget: SModelElement & Selectable, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(new SelectAction([], [selectableTarget.id]));
        if (selectableTarget instanceof SRoutableElement) {
            result.push(SwitchEditModeAction.create({ elementsToDeactivate: [selectableTarget.id] }));
        }
        return result;
    }

    protected handleDeselectAll(deselectedElements: SModelElement[], event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(new SelectAction([], deselectedElements.map(e => e.id)));
        const routableDeselect = deselectedElements.filter(e => e instanceof SRoutableElement).map(e => e.id);
        if (routableDeselect.length > 0) {
            result.push(SwitchEditModeAction.create({ elementsToDeactivate: routableDeselect }));
        }
        return result;
    }

    override mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        this.hasDragged = true;
        return [];
    }

    override mouseUp(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (event.button === 0) {
            if (!this.hasDragged) {
                const selectableTarget = findParentByFeature(target, isSelectable);
                if (selectableTarget !== undefined) {
                    if (this.wasSelected) {
                        return [new SelectAction([selectableTarget.id], [])];
                    }
                } else if (target instanceof SModelRoot && !findViewportScrollbar(event)) {
                    // Mouse up on root but not over ViewPort's scroll bars > deselect all
                    return this.handleDeselectAll(this.collectElementsToDeselect(target, undefined), event);
                }
            }
        }
        this.hasDragged = false;
        return [];
    }

    override decorate(vnode: VNode, element: SModelElement): VNode {
        const selectableTarget = findParentByFeature(element, isSelectable);
        if (selectableTarget !== undefined) {
            setClass(vnode, 'selected', selectableTarget.selected);
        }
        return vnode;
    }
}

@injectable()
export class GetSelectionCommand extends ModelRequestCommand {
    static readonly KIND = GetSelectionAction.KIND;

    protected previousSelection: Record<string, boolean> = {};

    constructor(@inject(TYPES.Action) protected readonly action: GetSelectionAction) {
        super();
    }

    protected retrieveResult(context: CommandExecutionContext): ResponseAction {
        const selection = context.root.index.all()
            .filter(e => isSelectable(e) && e.selected)
            .map(e => e.id);
        return SelectionResult.create(toArray(selection), this.action.requestId);
    }

}

export class SelectKeyboardListener extends KeyListener {
    override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyA', 'ctrlCmd')) {
            return [new SelectAllAction()];
        }
        return [];
    }
}
