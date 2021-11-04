/********************************************************************************
 * Copyright (c) 2021 TypeFox and others.
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

import { SChildElement, SModelRoot, SParentElement } from '../../base/model/smodel';
import { SModelExtension } from '../../base/model/smodel-extension';
import { Bounds, isValidDimension } from '../../utils/geometry';
import { hasOwnProperty } from '../../utils/object';
import { BoundsAware, isBoundsAware } from '../bounds/model';
import { Viewport } from '../viewport/model';

/**
 * Model elements implementing this interface can be displayed on a projection bar.
 * _Note:_ Model elements also have to be `BoundsAware` so their projections can be shown.
 */
export interface Projectable extends SModelExtension {
    projectionCssClasses: string[]
}

export function isProjectable(arg: unknown): arg is Projectable {
    return hasOwnProperty(arg, 'projectionCssClasses');
}

/**
 * A projection can be shown in a horizontal or vertical bar to display an overview of the diagram.
 */
export interface ViewProjection {
    elementId: string;
    projectedBounds: Bounds;
    cssClasses: string[];
}

/**
 * Gather all projections of elements contained in the given parent element.
 */
export function getProjections(parent: Readonly<SParentElement>): ViewProjection[] | undefined {
    let result: ViewProjection[] | undefined;
    for (const child of parent.children) {
        if (isProjectable(child) && isBoundsAware(child) && child.projectionCssClasses.length > 0) {
            const projection: ViewProjection = {
                elementId: child.id,
                projectedBounds: getProjectedBounds(child),
                cssClasses: child.projectionCssClasses
            };
            if (result) {
                result.push(projection);
            } else {
                result = [projection];
            }
        }
        if (child.children.length > 0) {
            const childProj = getProjections(child);
            if (childProj) {
                if (result) {
                    result.push(...childProj);
                } else {
                    result = childProj;
                }
            }
        }
    }
    return result;
}

/**
 * Compute the projected bounds of the given model element, that is the absolute position in the diagram.
 */
export function getProjectedBounds(model: Readonly<SChildElement & BoundsAware>): Bounds {
    let bounds = model.bounds;
    let parent = model.parent;
    while (parent instanceof SChildElement) {
        bounds = parent.localToParent(bounds);
        parent = parent.parent;
    }
    return bounds;
}

const MAX_COORD = 1_000_000_000;

/**
 * Determine the total bounds of a model; this takes the viewport into consideration
 * so it can be shown in the projections.
 */
export function getModelBounds(model: SModelRoot & Viewport): Bounds | undefined {
    let minX = MAX_COORD;
    let minY = MAX_COORD;
    let maxX = -MAX_COORD;
    let maxY = -MAX_COORD;

    const bounds = isBoundsAware(model) ? model.bounds : undefined;
    if (bounds && isValidDimension(bounds)) {
        // Get the bounds directly from the model if it returns a valid size
        minX = bounds.x;
        minY = bounds.y;
        maxX = minX + bounds.width;
        maxY = minY + bounds.height;
    } else {
        // Determine the min. / max coordinates of top-level model elements
        // Note that this approach is slower, so provide valid bounds to speed up the process.
        for (const element of model.children) {
            if (isBoundsAware(element)) {
                const b = element.bounds;
                minX = Math.min(minX, b.x);
                minY = Math.min(minY, b.y);
                maxX = Math.max(maxX, b.x + b.width);
                maxY = Math.max(maxY, b.y + b.height);
            }
        }
    }

    // Enlarge the bounds by the current viewport to ensure it always fits into the projection
    minX = Math.min(minX, model.scroll.x);
    minY = Math.min(minY, model.scroll.y);
    maxX = Math.max(maxX, model.scroll.x + model.canvasBounds.width / model.zoom);
    maxY = Math.max(maxY, model.scroll.y + model.canvasBounds.height / model.zoom);

    if (minX < maxX && minY < maxY) {
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    return undefined;
}
