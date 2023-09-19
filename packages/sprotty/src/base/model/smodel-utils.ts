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

import { interfaces } from "inversify";
import { Bounds, Point } from "sprotty-protocol/lib/utils/geometry";
import { TYPES } from "../types";
import { SChildElementImpl, SModelElementImpl, SModelRootImpl, SParentElementImpl } from "./smodel";
import { SModelElementRegistration, CustomFeatures } from "./smodel-factory";

/**
 * Register a model element constructor for an element type.
 */
export function registerModelElement(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
        type: string, constr: new () => SModelElementImpl, features?: CustomFeatures): void {
    context.bind<SModelElementRegistration>(TYPES.SModelElementRegistration).toConstantValue({
        type, constr, features
    });
}

/**
 * Find a parent element that satisfies the given predicate.
 */
export function findParent(element: SModelElementImpl, predicate: (e: SModelElementImpl) => boolean): SModelElementImpl | undefined {
    let current: SModelElementImpl | undefined = element;
    while (current !== undefined) {
        if (predicate(current))
            return current;
        else if (current instanceof SChildElementImpl)
            current = current.parent;
        else
            current = undefined;
    }
    return current;
}

/**
 * Find a parent element that implements the feature identified with the given predicate.
 */
export function findParentByFeature<T>(element: SModelElementImpl, predicate: (t: SModelElementImpl) => t is SModelElementImpl & T): SModelElementImpl & T | undefined {
    let current: SModelElementImpl | undefined = element;
    while (current !== undefined) {
        if (predicate(current))
            return current;
        else if (current instanceof SChildElementImpl)
            current = current.parent;
        else
            current = undefined;
    }
    return current;
}

/**
 * Translate a point from the coordinate system of the source element to the coordinate system
 * of the target element.
 */
export function translatePoint(point: Point, source: SModelElementImpl, target: SModelElementImpl): Point {
    if (source !== target) {
        // Translate from the source to the root element
        while (source instanceof SChildElementImpl) {
            point = source.localToParent(point);
            source = source.parent;
            if (source === target)
                return point;
        }
        // Translate from the root to the target element
        const targetTrace = [];
        while (target instanceof SChildElementImpl) {
            targetTrace.push(target);
            target = target.parent;
        }
        if (source !== target)
            throw new Error("Incompatible source and target: " + source.id + ", " + target.id);
        for (let i = targetTrace.length - 1; i >= 0; i--) {
            point = targetTrace[i].parentToLocal(point);
        }
    }
    return point;
}

/**
 * Translate some bounds from the coordinate system of the source element to the coordinate system
 * of the target element.
 */
export function translateBounds(bounds: Bounds, source: SModelElementImpl, target: SModelElementImpl): Bounds {
    const upperLeft = translatePoint(bounds, source, target);
    const lowerRight = translatePoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, source, target);
    return {
        x: upperLeft.x,
        y: upperLeft.y,
        width: lowerRight.x - upperLeft.x,
        height: lowerRight.y - upperLeft.y
    };
}

/**
 * Tests if the given model contains an id of then given element or one of its descendants.
 */
export function containsSome(root: SModelRootImpl, element: SChildElementImpl): boolean {
    const test = (el: SChildElementImpl) => root.index.getById(el.id) !== undefined;
    const find = (elements: readonly SChildElementImpl[]): boolean => elements.some(el => test(el) || find(el.children));
    return find([element]);
}

/**
 * Transforms the local bounds all the way up to the root.
 */
export function  transformToRootBounds(parent: SParentElementImpl, bounds: Bounds) {
    while (parent instanceof SChildElementImpl) {
        bounds = parent.localToParent(bounds);
        parent = parent.parent;
    }
    return bounds;
}
