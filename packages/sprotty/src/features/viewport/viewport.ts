/********************************************************************************
 * Copyright (c) 2017-2023 TypeFox and others.
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

import { injectable, inject } from 'inversify';
import { GetViewportAction, ResponseAction, SetViewportAction, ViewportResult } from 'sprotty-protocol/lib/actions';
import { Viewport } from 'sprotty-protocol/lib/model';
import { Point } from 'sprotty-protocol/lib/utils/geometry';
import { SModelElementImpl, SModelRootImpl } from '../../base/model/smodel';
import { MergeableCommand, ICommand, CommandExecutionContext, CommandReturn } from '../../base/commands/command';
import { Animation } from '../../base/animations/animation';
import { isViewport, limitViewport } from './model';
import { TYPES } from '../../base/types';
import { ModelRequestCommand } from '../../base/commands/request-command';
import { ViewerOptions } from '../../base/views/viewer-options';

@injectable()
export class SetViewportCommand extends MergeableCommand {
    static readonly KIND = SetViewportAction.KIND;

    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;
    protected element: SModelElementImpl & Viewport;
    protected oldViewport: Viewport;
    protected newViewport: Viewport;

    constructor(@inject(TYPES.Action) protected readonly action: SetViewportAction) {
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
            const { zoomLimits, horizontalScrollLimits, verticalScrollLimits } = this.viewerOptions;
            this.newViewport = limitViewport(this.newViewport, model.canvasBounds, horizontalScrollLimits, verticalScrollLimits, zoomLimits);
            return this.setViewport(element, this.oldViewport, this.newViewport, context);
        }
        return context.root;
    }

    protected setViewport(element: SModelElementImpl, oldViewport: Viewport, newViewport: Viewport, context: CommandExecutionContext): CommandReturn {
        if (element && isViewport(element)) {
            if (this.action.animate) {
                return new ViewportAnimation(element, oldViewport, newViewport, context).start();
            } else {
                element.scroll = newViewport.scroll;
                element.zoom = newViewport.zoom;
            }
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return this.setViewport(this.element, this.newViewport, this.oldViewport, context);
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.setViewport(this.element, this.oldViewport, this.newViewport, context);
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

    constructor(protected element: SModelElementImpl & Viewport,
                protected oldViewport: Viewport,
                protected newViewport: Viewport,
                protected override context: CommandExecutionContext) {
        super(context);
        this.zoomFactor = Math.log(newViewport.zoom / oldViewport.zoom);
    }

    tween(t: number, context: CommandExecutionContext): SModelRootImpl {
        const newZoom = this.newViewport.zoom;
        const oldZoom = this.oldViewport.zoom;
        const oldX = this.oldViewport.scroll.x;
        const oldY = this.oldViewport.scroll.y;
        const newX = this.newViewport.scroll.x;
        const newY = this.newViewport.scroll.y;

        const tweenZoom = oldZoom * (newZoom / oldZoom) ** t;
        this.element.zoom = tweenZoom;

        // The between scroll values need to satisfy this equation for a smooth zoom:
        // offset_left_tween / offset_left_total = offset_right_tween / offset_right_total
        // where the total offset is the offset between the old and new viewport, and the tween offset is the goal offset to be calculated for the between value.
        // A similar equation holds for the top/bottom offsets.
        // Given the exponential behavior of the zoom between values, the actual width and height of the viewport, which we do not have available here,
        // cancel out when simplifying and solving the equation by the between value for x and y. This results in this calculation.
        const interimZoomDiff = 1 - oldZoom / tweenZoom;
        const zoomDiff = 1 - oldZoom / newZoom;

        this.element.scroll = {
            x: oldX + (interimZoomDiff * (newX - oldX)) / zoomDiff,
            y: oldY + (interimZoomDiff * (newY - oldY)) / zoomDiff,
        };
        return context.root;
    }
}
