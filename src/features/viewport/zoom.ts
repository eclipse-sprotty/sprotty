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

import { Point } from "../../utils/geometry";
import { getWindowScroll } from "../../utils/browser";
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { MouseListener } from "../../base/views/mouse-tool";
import { Action } from "../../base/actions/action";
import { SModelExtension } from "../../base/model/smodel-extension";
import { findParentByFeature } from "../../base/model/smodel-utils";
import { SetViewportAction } from "./viewport";
import { isViewport, Viewport } from "./model";

export interface Zoomable extends SModelExtension {
    zoom: number
}

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

    wheel(target: SModelElement, event: WheelEvent): Action[] {
        return this.wheels([target], [event]);
    }

    wheels(targets: SModelElement[], events: WheelEvent[]): Action[] {
        let vpx, vpy, vpz, newZoom, offsetFactor, i = 0;
        let viewport;
        let viewportOffset;
        do {
            viewport = findParentByFeature(targets[i], isViewport);
            i++;
        } while (!viewport && i < events.length);
        if (!viewport) return [];
        vpx = viewport.scroll.x;
        vpy = viewport.scroll.y;
        vpz = viewport.zoom;
        for (i = 0; i < events.length; i++) {
            newZoom = this.getZoomFactor(events[i]);
            viewportOffset = this.getViewportOffset(targets[i].root, events[i]);
            offsetFactor = 1.0 / (newZoom * vpz) - 1.0 / vpz;
            vpx = vpx - offsetFactor * viewportOffset.x;
            vpy = vpy - offsetFactor * viewportOffset.y;
            vpz = vpz * newZoom;
        }
        const newViewport: Viewport = {
            scroll: {
                x: vpx,
                y: vpy
            },
            zoom: vpz
        };

        return [new SetViewportAction(viewport.id, newViewport, false)];
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
