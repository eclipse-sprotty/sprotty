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

import { Alignable, BoundsAware, SModelElement, SModelRoot } from '../model';
import { ComputedBoundsAction } from '../actions';

/**
 * Clone a given model. This function requires that the model is serializable, so it's
 * free of cycles and functions.
 */
export function cloneModel<T extends SModelElement>(model: T): T {
    return JSON.parse(JSON.stringify(model));
}

/**
 * Apply the computed bounds to the given model. This ensures that the model has complete
 * information about positions and sizes derived from its actual rendering in the frontend.
 */
export function applyBounds(root: SModelRoot, action: ComputedBoundsAction) {
    const index = new SModelIndex();
    index.add(root);
    for (const b of action.bounds) {
        const element = index.getById(b.elementId);
        if (element) {
            const bae = element as SModelElement & BoundsAware;
            if (b.newPosition) {
                bae.position = { x: b.newPosition.x, y: b.newPosition.y };
            }
            if (b.newSize) {
                bae.size = { width: b.newSize.width, height: b.newSize.height };
            }
        }
    }
    if (action.alignments) {
        for (const a of action.alignments) {
            const element = index.getById(a.elementId);
            if (element) {
                const alignable = element as SModelElement & Alignable;
                alignable.alignment = { x: a.newAlignment.x, y: a.newAlignment.y };
            }
        }
    }
}

/**
 * Model element types can include a colon to separate the basic type and a sub-type. This function
 * extracts the basic type of a model element.
 */
export function getBasicType(element: { type: string }): string {
    if (!element.type) {
        return '';
    }
    const colonIndex = element.type.indexOf(':');
    return colonIndex >= 0 ? element.type.substring(0, colonIndex) : element.type;
}

/**
 * Model element types can include a colon to separate the basic type and a sub-type. This function
 * extracts the sub-type of a model element.
 */
export function getSubType(schema: { type: string }): string {
    if (!schema.type) {
        return '';
    }
    const colonIndex = schema.type.indexOf(':');
    return colonIndex >= 0 ? schema.type.substring(colonIndex + 1) : schema.type;
}

/**
 * Find the element with the given identifier. If you need to find multiple elements, using an
 * `SModelIndex` might be more effective.
 */
export function findElement(parent: SModelElement, elementId: string): SModelElement | undefined {
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
 * Used to speed up model element lookup by id.
 * This index implementation is for the serializable _external model_ defined in `sprotty-protocol`.
 */
export class SModelIndex {

    private readonly id2element: Map<string, SModelElement> = new Map();
    private id2parent: Map<string, SModelElement> = new Map();

    add(element: SModelElement): void {
        if (!element.id) {
            throw new Error("Model element has no ID.");
        } else if (this.contains(element)) {
            throw new Error("Duplicate ID in model: " + element.id);
        }
        this.id2element.set(element.id, element);
        if (Array.isArray(element.children)) {
            for (const child of element.children) {
                this.add(child as any);
                this.id2parent.set(child.id, element);
            }
        }
    }

    remove(element: SModelElement): void {
        this.id2element.delete(element.id);
        if (Array.isArray(element.children)) {
            for (const child of element.children) {
                this.id2parent.delete(child.id);
                this.remove(child as any);
            }
        }
    }

    contains(element: SModelElement): boolean {
        return this.id2element.has(element.id);
    }

    getById(id: string): SModelElement | undefined {
        return this.id2element.get(id);
    }

    getParent(id: string): SModelElement | undefined {
        return this.id2parent.get(id);
    }

    getRoot(element: SModelElement): SModelRoot {
        let current: SModelElement | undefined = element;
        while (current) {
            const parent = this.id2parent.get(current.id);
            if (parent === undefined) {
                return current;
            }
            current = parent;
        }
        throw new Error("Element has no root");
    }

}
