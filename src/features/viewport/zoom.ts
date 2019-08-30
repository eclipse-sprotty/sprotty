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

import { SModelElement } from "../../base/model/smodel";
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
        const viewport = findParentByFeature(target, isViewport);
        if (viewport) {
            const newZoom = Math.exp(-event.deltaY * 0.005);
            const factor = 1. / (newZoom * viewport.zoom) - 1. / viewport.zoom;
            const newViewport: Viewport = {
                scroll: {
                    x: -(factor * event.offsetX - viewport.scroll.x),
                    y: -(factor * event.offsetY - viewport.scroll.y)
                },
                zoom: viewport.zoom * newZoom
            };
            return [new SetViewportAction(viewport.id, newViewport, false)];
        }
        return [];
    }
}
