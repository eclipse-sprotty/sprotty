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

import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { Action } from "../../base/actions/action";
import { MergeableCommand, ICommand, CommandExecutionContext } from "../../base/commands/command";
import { Animation } from "../../base/animations/animation";
import { isViewport, Viewport } from "./model";
import { injectable, inject } from "inversify";
import { TYPES } from "../../base/types";

export class ViewportAction implements Action {
    kind = ViewportCommand.KIND;

    constructor(public readonly elementId: string,
                public readonly newViewport: Viewport,
                public readonly animate: boolean) {
    }
}

@injectable()
export class ViewportCommand extends MergeableCommand {
    static readonly KIND = 'viewport';

    protected element: SModelElement & Viewport;
    protected oldViewport: Viewport;
    protected newViewport: Viewport;

    constructor(@inject(TYPES.Action) protected action: ViewportAction) {
        super();
        this.newViewport = action.newViewport;
    }

    execute( context: CommandExecutionContext) {
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

    undo(context: CommandExecutionContext) {
        return new ViewportAnimation(this.element, this.newViewport, this.oldViewport, context).start();
    }

    redo(context: CommandExecutionContext) {
        return new ViewportAnimation(this.element, this.oldViewport, this.newViewport, context).start();
    }

    merge(command: ICommand, context: CommandExecutionContext) {
        if (!this.action.animate && command instanceof ViewportCommand && this.element === command.element) {
            this.newViewport = command.newViewport;
            return true;
        }
        return false;
    }
}

export class ViewportAnimation extends Animation {

    protected zoomFactor: number;

    constructor(protected element: SModelElement & Viewport,
                protected oldViewport: Viewport,
                protected newViewport: Viewport,
                protected context: CommandExecutionContext) {
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
