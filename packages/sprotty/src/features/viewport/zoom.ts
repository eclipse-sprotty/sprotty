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

import { inject } from 'inversify';
import { Action, SetViewportAction } from 'sprotty-protocol/lib/actions';
import { Viewport } from 'sprotty-protocol/lib/model';
import { almostEquals, Point } from 'sprotty-protocol/lib/utils/geometry';
import { SModelElementImpl, SModelRootImpl } from '../../base/model/smodel';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { TYPES } from '../../base/types';
import { MouseListener } from '../../base/views/mouse-tool';
import { ViewerOptions } from '../../base/views/viewer-options';
import { getWindowScroll } from '../../utils/browser';
import { isViewport } from './model';

export function getZoom(label: SModelElementImpl) {
    let zoom = 1;
    const viewport = findParentByFeature(label, isViewport);
    if (viewport) {
        zoom = viewport.zoom;
    }
    return zoom;
}

export class ZoomMouseListener extends MouseListener {

    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;

    override wheel(target: SModelElementImpl, event: WheelEvent): Action[] {
        const viewport = findParentByFeature(target, isViewport);
        if (!viewport) {
            return [];
        }
        const newViewport = this.isScrollMode(event) ? this.processScroll(viewport, event) : this.processZoom(viewport, target, event);
        if (newViewport) {
            return [SetViewportAction.create(viewport.id, newViewport, { animate: false })];
        }
        return [];
    }

    protected isScrollMode(event: WheelEvent) {
        return event.altKey;
    }

    protected processScroll(viewport: Viewport, event: WheelEvent): Viewport {
        return {
            scroll: {
                x: viewport.scroll.x + event.deltaX,
                y: viewport.scroll.y + event.deltaY
            },
            zoom: viewport.zoom
        };
    }

    protected processZoom(viewport: Viewport, target: SModelElementImpl, event: WheelEvent): Viewport | undefined {
        const zoomFactor = this.getZoomFactor(event);
        if (zoomFactor > 1 && almostEquals(viewport.zoom, this.viewerOptions.zoomLimits.max)
            || zoomFactor < 1 && almostEquals(viewport.zoom, this.viewerOptions.zoomLimits.min)) {
            return;
        }
        const zoom = viewport.zoom * zoomFactor;
        const viewportOffset = this.getViewportOffset(target.root, event);
        const offsetFactor = 1.0 / zoom - 1.0 / viewport.zoom;
        return {
            scroll: {
                x: viewport.scroll.x - offsetFactor * viewportOffset.x,
                y: viewport.scroll.y - offsetFactor * viewportOffset.y
            },
            zoom
        };
    }

    protected getViewportOffset(root: SModelRootImpl, event: WheelEvent): Point {
        const canvasBounds = root.canvasBounds;
        const windowScroll = getWindowScroll();
        return {
            x: event.clientX + windowScroll.x - canvasBounds.x,
            y: event.clientY + windowScroll.y - canvasBounds.y
        };
    }

    protected getZoomFactor(event: WheelEvent): number {
        if (event.deltaMode === event.DOM_DELTA_PAGE)
            return Math.exp(-event.deltaY * 0.5);
        else if (event.deltaMode === event.DOM_DELTA_LINE)
            return Math.exp(-event.deltaY * 0.05);
        else // deltaMode === DOM_DELTA_PIXEL
            return Math.exp(-event.deltaY * 0.005);
    }

}
