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

import { Bounds, Dimension } from 'sprotty-protocol';
import { Viewport } from 'sprotty-protocol/lib/model';
import { SModelElementImpl, SModelRootImpl } from '../../base/model/smodel';
import { limit, Limits } from '../../utils/geometry';

export const viewportFeature = Symbol('viewportFeature');

/**
 * Determine whether the given model element has a viewport.
 */
export function isViewport(element: SModelElementImpl): element is SModelRootImpl & Viewport {
    return element instanceof SModelRootImpl
        && element.hasFeature(viewportFeature)
        && 'zoom' in element
        && 'scroll' in element;
}

/**
 * Apply limits to the given viewport.
 */
export function limitViewport(viewport: Viewport,
    canvasBounds: Bounds | undefined,
    horizontalScrollLimits: Limits | undefined,
    verticalScrollLimits: Limits | undefined,
    zoomLimits: Limits | undefined): Viewport {
    if (canvasBounds && !Dimension.isValid(canvasBounds)) {
        canvasBounds = undefined;
    }
    // Limit the zoom factor
    let zoom = zoomLimits ? limit(viewport.zoom, zoomLimits) : viewport.zoom;
    if (canvasBounds && horizontalScrollLimits) {
        const minZoom = canvasBounds.width / (horizontalScrollLimits.max - horizontalScrollLimits.min);
        if (zoom < minZoom) {
            zoom = minZoom;
        }
    }
    if (canvasBounds && verticalScrollLimits) {
        const minZoom = canvasBounds.height / (verticalScrollLimits.max - verticalScrollLimits.min);
        if (zoom < minZoom) {
            zoom = minZoom;
        }
    }
    // Limit the horizontal scroll position
    let scrollX: number;
    if (horizontalScrollLimits) {
        const min = horizontalScrollLimits.min;
        const max = canvasBounds ? horizontalScrollLimits.max - canvasBounds.width / zoom : horizontalScrollLimits.max;
        scrollX = limit(viewport.scroll.x, { min, max });
    } else {
        scrollX = viewport.scroll.x;
    }
    // Limit the vertical scroll position
    let scrollY: number;
    if (verticalScrollLimits) {
        const min = verticalScrollLimits.min;
        const max = canvasBounds ? verticalScrollLimits.max - canvasBounds.height / zoom : verticalScrollLimits.max;
        scrollY = limit(viewport.scroll.y, { min, max });
    } else {
        scrollY = viewport.scroll.y;
    }
    return { scroll: { x: scrollX, y: scrollY }, zoom };
}
