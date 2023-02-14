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

import { Action, SetViewportAction } from "sprotty-protocol/lib/actions";
import { Viewport } from "sprotty-protocol/lib/model";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { SModelExtension } from "../../base/model/smodel-extension";
import { findParentByFeature } from "../../base/model/smodel-utils";
import { MouseListener } from "../../base/views/mouse-tool";
import { getWindowScroll } from "../../utils/browser";
import { isViewport } from "./model";

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export interface Zoomable extends SModelExtension {
    zoom: number
}

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export function isZoomable(element: SModelElement | Zoomable): element is Zoomable {
    return 'zoom' in element;
}

export function getZoom(label: SModelElement) {
    let zoom = 1;
    const viewport = findParentByFeature(label, isViewport);
    if (viewport) {
        zoom = viewport.zoom;
    }
    return zoom;
}

export class ZoomMouseListener extends MouseListener {

    override wheel(target: SModelElement, event: WheelEvent): Action[] {
        const viewport = findParentByFeature(target, isViewport);
        if (!viewport) {
            return [];
        }
        const newViewport = this.isScrollMode(event) ? this.processScroll(viewport, event) : this.processZoom(viewport, target, event);
        return [SetViewportAction.create(viewport.id, newViewport, { animate: false })];
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

    protected processZoom(viewport: Viewport, target: SModelElement, event: WheelEvent): Viewport {
        const newZoom = this.getZoomFactor(event);
        const viewportOffset = this.getViewportOffset(target.root, event);
        const offsetFactor = 1.0 / (newZoom * viewport.zoom) - 1.0 / viewport.zoom;
        return {
            scroll: {
                x: viewport.scroll.x - offsetFactor * viewportOffset.x,
                y: viewport.scroll.y - offsetFactor * viewportOffset.y
            },
            zoom: viewport.zoom * newZoom
        };
    }

    protected getViewportOffset(root: SModelRoot, event: WheelEvent): Point {
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
