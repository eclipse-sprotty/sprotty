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
import { TYPES } from "../types";
import { Point, Bounds } from "../../utils/geometry";
import { SChildElement, SModelElement, SModelElementSchema } from "./smodel";
import { SModelElementRegistration, CustomFeatures } from "./smodel-factory";

/**
 * Register a model element constructor for an element type.
 */
export function registerModelElement(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
        type: string, constr: new () => SModelElement, features?: CustomFeatures): void {
    context.bind<SModelElementRegistration>(TYPES.SModelElementRegistration).toConstantValue({
        type, constr, features
    });
}

/**
 * Model element types can include a colon to separate the basic type and a sub-type. This function
 * extracts the basic type of a model element.
 */
export function getBasicType(schema: SModelElementSchema | SModelElement): string {
    if (!schema.type)
        return '';
    const colonIndex = schema.type.indexOf(':');
    if (colonIndex >= 0)
        return schema.type.substring(0, colonIndex);
    else
        return schema.type;
}

/**
 * Model element types can include a colon to separate the basic type and a sub-type. This function
 * extracts the sub-type of a model element.
 */
export function getSubType(schema: SModelElementSchema | SModelElement): string {
    if (!schema.type)
        return '';
    const colonIndex = schema.type.indexOf(':');
    if (colonIndex >= 0)
        return schema.type.substring(colonIndex + 1);
    else
        return schema.type;
}

/**
 * Find the element with the given identifier. If you need to find multiple elements, using an
 * SModelIndex might be more effective.
 */
export function findElement(parent: SModelElementSchema, elementId: string): SModelElementSchema | undefined {
    if (parent.id === elementId)
        return parent;
    if (parent.children !== undefined) {
        for (const child of parent.children) {
            const result = findElement(child, elementId);
            if (result !== undefined)
                return result;
        }
    }
    return undefined;
}

/**
 * Find a parent element that satisfies the given predicate.
 */
export function findParent(element: SModelElement, predicate: (e: SModelElement) => boolean): SModelElement | undefined {
    let current: SModelElement | undefined = element;
    while (current !== undefined) {
        if (predicate(current))
            return current;
        else if (current instanceof SChildElement)
            current = current.parent;
        else
            current = undefined;
    }
    return current;
}

/**
 * Find a parent element that implements the feature identified with the given predicate.
 */
export function findParentByFeature<T>(element: SModelElement, predicate: (t: SModelElement) => t is SModelElement & T): SModelElement & T | undefined {
    let current: SModelElement | undefined = element;
    while (current !== undefined) {
        if (predicate(current))
            return current;
        else if (current instanceof SChildElement)
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
export function translatePoint(point: Point, source: SModelElement, target: SModelElement): Point {
    if (source !== target) {
        // Translate from the source to the root element
        while (source instanceof SChildElement) {
            point = source.localToParent(point);
            source = source.parent;
            if (source === target)
                return point;
        }
        // Translate from the root to the target element
        const targetTrace = [];
        while (target instanceof SChildElement) {
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
export function translateBounds(bounds: Bounds, source: SModelElement, target: SModelElement): Bounds {
    const upperLeft = translatePoint(bounds, source, target);
    const lowerRight = translatePoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, source, target);
    return {
        x: upperLeft.x,
        y: upperLeft.y,
        width: lowerRight.x - upperLeft.x,
        height: lowerRight.y - upperLeft.y
    };
}
