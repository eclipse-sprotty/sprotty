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

import { SChildElement, SModelElement, SModelElementSchema, SModelRoot, SParentElement } from "../../base/model/smodel";
import { SModelExtension } from "../../base/model/smodel-extension";
import { findParentByFeature } from '../../base/model/smodel-utils';
import { DOMHelper } from "../../base/views/dom-helper";
import { ViewerOptions } from "../../base/views/viewer-options";
import {
    Bounds, Dimension, EMPTY_BOUNDS, EMPTY_DIMENSION, includes, isBounds, ORIGIN_POINT, Point
} from "../../utils/geometry";
import { Locateable } from '../move/model';
import { getWindowScroll } from "../../utils/browser";

export const boundsFeature = Symbol('boundsFeature');
export const layoutContainerFeature = Symbol('layoutContainerFeature');
export const layoutableChildFeature = Symbol('layoutableChildFeature');
export const alignFeature = Symbol('alignFeature');

/**
 * Model elements that implement this interface have a position and a size.
 */
export interface BoundsAware extends SModelExtension {
    bounds: Bounds
}

/**
 * Used to identify model elements that specify a layout to apply to their children.
 */
export interface LayoutContainer extends LayoutableChild {
    layout: string
}

export type ModelLayoutOptions = { [key: string]: string | number | boolean };

export interface LayoutableChild extends SModelExtension, BoundsAware {
    layoutOptions?: ModelLayoutOptions
}

/**
 * Used to adjust elements whose bounding box is not at the origin, e.g.
 * labels, or pre-rendered SVG figures.
 */
export interface Alignable extends SModelExtension {
    alignment: Point
}

export function isBoundsAware(element: SModelElement): element is SModelElement & BoundsAware {
    return 'bounds' in element;
}

export function isLayoutContainer(element: SModelElement): element is SParentElement & LayoutContainer {
    return isBoundsAware(element)
        && element.hasFeature(layoutContainerFeature)
        && 'layout' in element;
}

export function isLayoutableChild(element: SModelElement): element is SChildElement & LayoutableChild {
    return isBoundsAware(element)
        && element.hasFeature(layoutableChildFeature);
}

export function isSizeable(element: SModelElement): element is SModelElement & BoundsAware {
    return element.hasFeature(boundsFeature) && isBoundsAware(element);
}

export function isAlignable(element: SModelElement): element is SModelElement & Alignable {
    return element.hasFeature(alignFeature)
        && 'alignment' in element;
}

export function getAbsoluteBounds(element: SModelElement): Bounds {
    const boundsAware = findParentByFeature(element, isBoundsAware);
    if (boundsAware !== undefined) {
        let bounds = boundsAware.bounds;
        let current: SModelElement = boundsAware;
        while (current instanceof SChildElement) {
            const parent = current.parent;
            bounds = parent.localToParent(bounds);
            current = parent;
        }
        return bounds;
    } else if (element instanceof SModelRoot) {
        const canvasBounds = element.canvasBounds;
        return { x: 0, y: 0, width: canvasBounds.width, height: canvasBounds.height };
    } else {
        return EMPTY_BOUNDS;
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
export function getAbsoluteClientBounds(element: SModelElement, domHelper: DOMHelper, viewerOptions: ViewerOptions): Bounds {
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

export function findChildrenAtPosition(parent: SParentElement, point: Point): SModelElement[] {
    const matches: SModelElement[] = [];
    doFindChildrenAtPosition(parent, point, matches);
    return matches;
}

function doFindChildrenAtPosition(parent: SParentElement, point: Point, matches: SModelElement[]) {
    parent.children.forEach(child => {
        if (isBoundsAware(child) && includes(child.bounds, point))
            matches.push(child);
        if (child instanceof SParentElement) {
            const newPoint = child.parentToLocal(point);
            doFindChildrenAtPosition(child, newPoint, matches);
        }
    });
}

/**
 * Serializable schema for SShapeElement.
 */
export interface SShapeElementSchema extends SModelElementSchema {
    position?: Point
    size?: Dimension
    children?: SModelElementSchema[]
    layoutOptions?: ModelLayoutOptions
}

/**
 * Abstract class for elements with a position and a size.
 */
export abstract class SShapeElement extends SChildElement implements BoundsAware, Locateable, LayoutableChild {
    position: Point = ORIGIN_POINT;
    size: Dimension = EMPTY_DIMENSION;
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

    localToParent(point: Point | Bounds): Bounds {
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

    parentToLocal(point: Point | Bounds): Bounds {
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
