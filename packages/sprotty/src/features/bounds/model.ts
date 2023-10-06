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

import { Bounds, Dimension, isBounds, Point } from 'sprotty-protocol/lib/utils/geometry';
import { SChildElementImpl, SModelElementImpl, SModelRootImpl, SParentElementImpl } from '../../base/model/smodel';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { DOMHelper } from '../../base/views/dom-helper';
import { ViewerOptions } from '../../base/views/viewer-options';
import { getWindowScroll } from '../../utils/browser';
import type { Locateable } from '../move/model';

export const boundsFeature = Symbol('boundsFeature');
export const layoutContainerFeature = Symbol('layoutContainerFeature');
export const layoutableChildFeature = Symbol('layoutableChildFeature');
export const alignFeature = Symbol('alignFeature');

/**
 * Model elements that implement this interface have a position and a size.
 * Note that this definition differs from the one in `sprotty-protocol` because this is
 * used in the _internal model_, while the other is used in the _external model_.
 *
 * Feature extension interface for {@link boundsFeature}.
 */
export interface BoundsAware {
    bounds: Bounds
}

/**
 * Used to identify model elements that specify a layout to apply to their children.
 */
export interface LayoutContainer extends LayoutableChild {
    layout: string
}

export type ModelLayoutOptions = { [key: string]: string | number | boolean };

/**
 * Feature extension interface for {@link layoutableChildFeature}.
 */
export interface LayoutableChild extends BoundsAware {
    layoutOptions?: ModelLayoutOptions
}

/**
 * Used to adjust elements whose bounding box is not at the origin, e.g.
 * labels, or pre-rendered SVG figures.
 *
 * Feature extension interface for {@link alignFeature}.
 */
export interface Alignable {
    alignment: Point
}

export function isBoundsAware(element: SModelElementImpl): element is SModelElementImpl & BoundsAware {
    return 'bounds' in element;
}

export function isLayoutContainer(element: SModelElementImpl): element is SParentElementImpl & LayoutContainer {
    return isBoundsAware(element)
        && element.hasFeature(layoutContainerFeature)
        && 'layout' in element;
}

export function isLayoutableChild(element: SModelElementImpl): element is SChildElementImpl & LayoutableChild {
    return isBoundsAware(element)
        && element.hasFeature(layoutableChildFeature);
}

export function isSizeable(element: SModelElementImpl): element is SModelElementImpl & BoundsAware {
    return element.hasFeature(boundsFeature) && isBoundsAware(element);
}

export function isAlignable(element: SModelElementImpl): element is SModelElementImpl & Alignable {
    return element.hasFeature(alignFeature)
        && 'alignment' in element;
}

export function getAbsoluteBounds(element: SModelElementImpl): Bounds {
    const boundsAware = findParentByFeature(element, isBoundsAware);
    if (boundsAware !== undefined) {
        let bounds = boundsAware.bounds;
        let current: SModelElementImpl = boundsAware;
        while (current instanceof SChildElementImpl) {
            const parent = current.parent;
            bounds = parent.localToParent(bounds);
            current = parent;
        }
        return bounds;
    } else if (element instanceof SModelRootImpl) {
        const canvasBounds = element.canvasBounds;
        return { x: 0, y: 0, width: canvasBounds.width, height: canvasBounds.height };
    } else {
        return Bounds.EMPTY;
    }
}

/**
 * Returns the "client-absolute" bounds of the specified `element`.
 *
 * The client-absolute bounds are relative to the entire browser page.
 *
 * @param element The element to get the bounds for.
 * @param domHelper The dom helper to obtain the SVG element's id.
 * @param viewerOptions The viewer options to obtain sprotty's container div id.
 */
export function getAbsoluteClientBounds(element: SModelElementImpl, domHelper: DOMHelper, viewerOptions: ViewerOptions): Bounds {
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;

    const svgElementId = domHelper.createUniqueDOMElementId(element);
    const svgElement = document.getElementById(svgElementId);
    if (svgElement) {
        const rect = svgElement.getBoundingClientRect();
        const scroll = getWindowScroll();
        x = rect.left + scroll.x;
        y = rect.top + scroll.y;
        width = rect.width;
        height = rect.height;
    }

    let container = document.getElementById(viewerOptions.baseDiv);
    if (container) {
        while (container.offsetParent instanceof HTMLElement
            && (container = <HTMLElement>container.offsetParent)) {
            x -= container.offsetLeft;
            y -= container.offsetTop;
        }
    }

    return { x, y, width, height };
}

export function findChildrenAtPosition(parent: SParentElementImpl, point: Point): SModelElementImpl[] {
    const matches: SModelElementImpl[] = [];
    doFindChildrenAtPosition(parent, point, matches);
    return matches;
}

function doFindChildrenAtPosition(parent: SParentElementImpl, point: Point, matches: SModelElementImpl[]) {
    parent.children.forEach(child => {
        if (isBoundsAware(child) && Bounds.includes(child.bounds, point))
            matches.push(child);
        if (child instanceof SParentElementImpl) {
            const newPoint = child.parentToLocal(point);
            doFindChildrenAtPosition(child, newPoint, matches);
        }
    });
}

/**
 * Abstract class for elements with a position and a size.
 */
export abstract class SShapeElementImpl extends SChildElementImpl implements BoundsAware, Locateable, LayoutableChild {

    position: Point = Point.ORIGIN;
    size: Dimension = Dimension.EMPTY;
    layoutOptions?: ModelLayoutOptions;

    get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.size.width,
            height: this.size.height
        };
    }

    set bounds(newBounds: Bounds) {
        this.position = {
            x: newBounds.x,
            y: newBounds.y
        };
        this.size = {
            width: newBounds.width,
            height: newBounds.height
        };
    }

    override localToParent(point: Point | Bounds): Bounds {
        const result = {
            x: point.x + this.position.x,
            y: point.y + this.position.y,
            width: -1,
            height: -1
        };
        if (isBounds(point)) {
            result.width = point.width;
            result.height = point.height;
        }
        return result;
    }

    override parentToLocal(point: Point | Bounds): Bounds {
        const result = {
            x: point.x - this.position.x,
            y: point.y - this.position.y,
            width: -1,
            height: -1
        };
        if (isBounds(point)) {
            result.width = point.width;
            result.height = point.height;
        }
        return result;
    }

}
