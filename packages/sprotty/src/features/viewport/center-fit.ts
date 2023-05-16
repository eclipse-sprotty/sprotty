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

import { Action, CenterAction as ProtocolCenterAction, FitToScreenAction as ProtocolFitToScreenAction} from "sprotty-protocol/lib/actions";
import { Viewport } from "sprotty-protocol/lib/model";
import { Bounds, Dimension } from "sprotty-protocol/lib/utils/geometry";
import { matchesKeystroke } from "../../utils/keyboard";
import { SChildElementImpl } from '../../base/model/smodel';
import { Command, CommandExecutionContext, CommandReturn } from "../../base/commands/command";
import { SModelElementImpl, SModelRootImpl } from "../../base/model/smodel";
import { KeyListener } from "../../base/views/key-tool";
import { isBoundsAware } from "../bounds/model";
import { isSelectable } from "../select/model";
import { ViewportAnimation } from "./viewport";
import { isViewport } from "./model";
import { injectable, inject } from "inversify";
import { TYPES } from "../../base/types";

/**
 * Triggered when the user requests the viewer to center on the current model. The resulting
 * CenterCommand changes the scroll setting of the viewport accordingly.
 * It also resets the zoom to its default if retainZoom is false.
 * This action can also be sent from the model source to the client in order to perform such a
 * viewport change programmatically.
 *
 * @deprecated Use the declaration in `sprotty-protocol` instead.
 */
export class CenterAction implements Action, ProtocolCenterAction {
    static readonly KIND = 'center';
    readonly kind = CenterAction.KIND;

    constructor(public readonly elementIds: string[],
                public readonly animate: boolean = true,
                public readonly retainZoom: boolean = false,
                public readonly zoomScale?: number) {
    }
}

/**
 * Triggered when the user requests the viewer to fit its content to the available drawing area.
 * The resulting FitToScreenCommand changes the zoom and scroll settings of the viewport so the model
 * can be shown completely. This action can also be sent from the model source to the client in order
 * to perform such a viewport change programmatically.
 *
 * @deprecated Use the declaration in `sprotty-protocol` instead.
 */
export class FitToScreenAction implements Action, ProtocolFitToScreenAction {
    static readonly KIND = 'fit';
    readonly kind = FitToScreenAction.KIND;

    constructor(public readonly elementIds: string[],
                public readonly padding?: number,
                public readonly maxZoom?: number,
                public readonly animate: boolean = true) {
    }
}

@injectable()
export abstract class BoundsAwareViewportCommand extends Command {

    oldViewport: Viewport;
    newViewport?: Viewport;

    constructor(protected readonly animate: boolean) {
        super();
    }

    protected initialize(model: SModelRootImpl) {
        if (isViewport(model)) {
            this.oldViewport = {
                scroll: model.scroll,
                zoom: model.zoom
            };
            const allBounds: Bounds[] = [];
            this.getElementIds().forEach(
                id => {
                    const element = model.index.getById(id);
                    if (element && isBoundsAware(element))
                        allBounds.push(this.boundsInViewport(element, element.bounds, model));
                }
            );
            if (allBounds.length === 0) {
                model.index.all().forEach(
                    element => {
                        if (isSelectable(element) && element.selected && isBoundsAware(element))
                            allBounds.push(this.boundsInViewport(element, element.bounds, model));
                    }
                );
            }
            if (allBounds.length === 0) {
                model.index.all().forEach(
                    element => {
                        if (isBoundsAware(element))
                            allBounds.push(this.boundsInViewport(element, element.bounds, model));
                    }
                );
            }
            if (allBounds.length !== 0) {
                const bounds = allBounds.reduce((b0, b1) => Bounds.combine(b0, b1));
                if (Dimension.isValid(bounds))
                    this.newViewport = this.getNewViewport(bounds, model);
            }
        }
    }

    protected boundsInViewport(element: SModelElementImpl, bounds: Bounds, viewport: SModelRootImpl & Viewport): Bounds {
        if (element instanceof SChildElementImpl && element.parent !== viewport)
            return this.boundsInViewport(element.parent, element.parent.localToParent(bounds) as Bounds, viewport);
        else
            return bounds;
    }

    protected abstract getNewViewport(bounds: Bounds, model: SModelRootImpl): Viewport | undefined;

    protected abstract getElementIds(): string[];

    execute(context: CommandExecutionContext): CommandReturn {
        this.initialize(context.root);
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const model = context.root;
        if (isViewport(model) && this.newViewport !== undefined && !this.equal(this.newViewport, this.oldViewport)) {
            if (this.animate)
                return new ViewportAnimation(model, this.newViewport, this.oldViewport, context).start();
            else {
                model.scroll = this.oldViewport.scroll;
                model.zoom = this.oldViewport.zoom;
            }
        }
        return model;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        const model = context.root;
        if (isViewport(model) && this.newViewport !== undefined && !this.equal(this.newViewport, this.oldViewport)) {
            if (this.animate) {
               return new ViewportAnimation(model, this.oldViewport, this.newViewport, context).start();
            } else {
                model.scroll = this.newViewport.scroll;
                model.zoom = this.newViewport.zoom;
            }
        }
        return model;
    }

    protected equal(vp1: Viewport, vp2: Viewport): boolean {
        return vp1.zoom === vp2.zoom && vp1.scroll.x === vp2.scroll.x && vp1.scroll.y === vp2.scroll.y;
    }
}

export class CenterCommand extends BoundsAwareViewportCommand {
    static readonly KIND = ProtocolCenterAction.KIND;

    constructor(@inject(TYPES.Action) protected action: ProtocolCenterAction) {
        super(action.animate);
    }

    getElementIds() {
        return this.action.elementIds;
    }

    getNewViewport(bounds: Bounds, model: SModelRootImpl): Viewport | undefined {
        if (!Dimension.isValid(model.canvasBounds)) {
            return undefined;
        }
        let zoom = 1;
        if (this.action.retainZoom && isViewport(model)) {
            zoom = model.zoom;
        } else if (this.action.zoomScale) {
            zoom = this.action.zoomScale;
        }
        const c = Bounds.center(bounds);
        return {
            scroll: {
                x: c.x - 0.5 * model.canvasBounds.width / zoom,
                y: c.y - 0.5 * model.canvasBounds.height / zoom
            },
            zoom: zoom
        };
    }
}

export class FitToScreenCommand extends BoundsAwareViewportCommand {
    static readonly KIND = ProtocolFitToScreenAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: ProtocolFitToScreenAction) {
        super(action.animate);
    }

    getElementIds() {
        return this.action.elementIds;
    }

    getNewViewport(bounds: Bounds, model: SModelRootImpl): Viewport | undefined {
        if (!Dimension.isValid(model.canvasBounds)) {
            return undefined;
        }
        const c = Bounds.center(bounds);
        const delta = this.action.padding === undefined
            ? 0
            : 2 *  this.action.padding;
        let zoom = Math.min(
            model.canvasBounds.width / (bounds.width + delta),
            model.canvasBounds.height / (bounds.height + delta));
        if (this.action.maxZoom !== undefined)
           zoom = Math.min(zoom, this.action.maxZoom);
        if (zoom === Infinity) {
            zoom = 1;
        }
        return {
            scroll: {
                x: c.x - 0.5 * model.canvasBounds.width / zoom,
                y: c.y - 0.5 * model.canvasBounds.height / zoom
            },
            zoom: zoom
        };
    }
}

export class CenterKeyboardListener extends KeyListener {
    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyC', 'ctrlCmd', 'shift'))
            return [ProtocolCenterAction.create([])];
        if (matchesKeystroke(event, 'KeyF', 'ctrlCmd', 'shift'))
            return [ProtocolFitToScreenAction.create([])];
        return [];
    }
}
