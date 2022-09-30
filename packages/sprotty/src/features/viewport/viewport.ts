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

import { injectable, inject } from "inversify";
import { Action, generateRequestId, RequestAction, ResponseAction, SetViewportAction as ProtocolSetViewPortAction} from "sprotty-protocol/lib/actions";
import { Viewport } from "sprotty-protocol/lib/model";
import { Bounds, Point } from "sprotty-protocol/lib/utils/geometry";
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { MergeableCommand, ICommand, CommandExecutionContext, CommandReturn } from "../../base/commands/command";
import { Animation } from "../../base/animations/animation";
import { isViewport } from "./model";
import { TYPES } from "../../base/types";
import { ModelRequestCommand } from "../../base/commands/request-command";

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class SetViewportAction implements Action, ProtocolSetViewPortAction {
    static readonly KIND = 'viewport';
    readonly kind = SetViewportAction.KIND;

    constructor(public readonly elementId: string,
                public readonly newViewport: Viewport,
                public readonly animate: boolean) {
    }
}

/**
 * Request action for retrieving the current viewport and canvas bounds.
 */
export interface GetViewportAction extends RequestAction<ViewportResult> {
    kind: typeof GetViewportAction.KIND;
}
export namespace GetViewportAction {
    export const KIND = 'getViewport';

    export function create(): GetViewportAction {
        return {
            kind: KIND,
            requestId: generateRequestId()
        };
    }
}

export interface ViewportResult extends ResponseAction {
    kind: typeof ViewportResult.KIND;
    viewport: Viewport
    canvasBounds: Bounds
}
export namespace ViewportResult {
    export const KIND = 'viewportResult';

    export function create(viewport: Viewport, canvasBounds: Bounds, requestId: string): ViewportResult {
        return {
            kind: KIND,
            viewport,
            canvasBounds,
            responseId: requestId
        };
    }
}

@injectable()
export class SetViewportCommand extends MergeableCommand {
    static readonly KIND = ProtocolSetViewPortAction.KIND;

    protected element: SModelElement & Viewport;
    protected oldViewport: Viewport;
    protected newViewport: Viewport;

    constructor(@inject(TYPES.Action) protected readonly action: ProtocolSetViewPortAction) {
        super();
        this.newViewport = action.newViewport;
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const model = context.root;
        const element = model.index.getById(this.action.elementId);
        if (element && isViewport(element)) {
            this.element = element;
            this.oldViewport = {
                scroll: this.element.scroll,
                zoom: this.element.zoom,
            };
            if (this.action.animate)
                return new ViewportAnimation(this.element, this.oldViewport, this.newViewport, context).start();
            else {
                this.element.scroll = this.newViewport.scroll;
                this.element.zoom = this.newViewport.zoom;
            }
        }
        return model;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return new ViewportAnimation(this.element, this.newViewport, this.oldViewport, context).start();
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return new ViewportAnimation(this.element, this.oldViewport, this.newViewport, context).start();
    }

    override merge(command: ICommand, context: CommandExecutionContext): boolean {
        if (!this.action.animate && command instanceof SetViewportCommand && this.element === command.element) {
            this.newViewport = command.newViewport;
            return true;
        }
        return false;
    }
}

export class GetViewportCommand extends ModelRequestCommand {
    static readonly KIND = GetViewportAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: GetViewportAction) {
        super();
    }

    protected retrieveResult(context: CommandExecutionContext): ResponseAction {
        const elem = context.root;
        let viewport: Viewport;
        if (isViewport(elem)) {
            viewport = { scroll: elem.scroll, zoom: elem.zoom };
        } else {
            viewport = { scroll: Point.ORIGIN, zoom: 1 };
        }
        return ViewportResult.create(viewport, elem.canvasBounds, this.action.requestId);
    }
}

export class ViewportAnimation extends Animation {

    protected zoomFactor: number;

    constructor(protected element: SModelElement & Viewport,
                protected oldViewport: Viewport,
                protected newViewport: Viewport,
                protected override context: CommandExecutionContext) {
        super(context);
        this.zoomFactor = Math.log(newViewport.zoom / oldViewport.zoom);
    }

    tween(t: number, context: CommandExecutionContext): SModelRoot {
        this.element.scroll = {
            x: (1 - t) * this.oldViewport.scroll.x + t * this.newViewport.scroll.x,
            y: (1 - t) * this.oldViewport.scroll.y + t * this.newViewport.scroll.y
        };
        this.element.zoom = this.oldViewport.zoom * Math.exp(t * this.zoomFactor);
        return context.root;
    }
}
