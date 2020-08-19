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

import { Bounds, EMPTY_BOUNDS, Point, isBounds } from "../../utils/geometry";
import { mapIterable, FluentIterable } from "../../utils/iterable";

/**
 * The schema of an SModelElement describes its serializable form. The actual model is created from
 * its schema with an IModelFactory.
 * Each model element must have a unique ID and a type that is used to look up its view.
 */
export interface SModelElementSchema {
    type: string
    id: string
    children?: SModelElementSchema[]
    cssClasses?: string[]
}

/**
 * Serializable schema for the root element of the model tree.
 */
export interface SModelRootSchema extends SModelElementSchema {
    canvasBounds?: Bounds
    revision?: number
}

/**
 * Base class for all elements of the diagram model.
 * Each model element must have a unique ID and a type that is used to look up its view.
 */
export class SModelElement {
    type: string;
    id: string;
    features?: FeatureSet;
    cssClasses?: string[];

    get root(): SModelRoot {
        let current: SModelElement | undefined = this;
        while (current) {
            if (current instanceof SModelRoot)
                return current;
            else if (current instanceof SChildElement)
                current = current.parent;
            else
                current = undefined;
        }
        throw new Error("Element has no root");
    }

    get index(): SModelIndex<SModelElement> {
        return this.root.index;
    }

    /**
     * A feature is a symbol identifying some functionality that can be enabled or disabled for
     * a model element. The set of supported features is determined by the `features` property.
     */
    hasFeature(feature: symbol): boolean {
        return this.features !== undefined && this.features.has(feature);
    }
}

export interface FeatureSet {
    has(feature: symbol): boolean
}

export function isParent(element: SModelElementSchema | SModelElement):
        element is SModelElementSchema & { children: SModelElementSchema[] } {
    const children = (element as any).children;
    return children !== undefined && children.constructor === Array;
}

/**
 * A parent element may contain child elements, thus the diagram model forms a tree.
 */
export class SParentElement extends SModelElement {
    readonly children: ReadonlyArray<SChildElement> = [];

    add(child: SChildElement, index?: number) {
        const children = this.children as SChildElement[];
        if (index === undefined) {
            children.push(child);
        } else {
            if (index < 0 || index > this.children.length) {
                throw new Error(`Child index ${index} out of bounds (0..${children.length})`);
            }
            children.splice(index, 0, child);
        }
        (child as {parent: SParentElement}).parent = this;
        this.index.add(child);
    }

    remove(child: SChildElement) {
        const children = this.children as SChildElement[];
        const i = children.indexOf(child);
        if (i < 0) {
            throw new Error(`No such child ${child.id}`);
        }
        children.splice(i, 1);
        delete (child as {parent: SParentElement}).parent;
        this.index.remove(child);
    }

    removeAll(filter?: (e: SChildElement) => boolean) {
        const children = this.children as SChildElement[];
        if (filter !== undefined) {
            for (let i = children.length - 1; i >= 0; i--) {
                if (filter(children[i])) {
                    const child = children.splice(i, 1)[0];
                    delete (child as {parent: SParentElement}).parent;
                    this.index.remove(child);
                }
            }
        } else {
            children.forEach(child => {
                delete (child as {parent: SParentElement}).parent;
                this.index.remove(child);
            });
            children.splice(0, children.length);
        }
    }

    move(child: SChildElement, newIndex: number) {
        const children = this.children as SChildElement[];
        const i = children.indexOf(child);
        if (i === -1) {
            throw new Error(`No such child ${child.id}`);
        } else {
            if (newIndex < 0 || newIndex > children.length - 1) {
                throw new Error(`Child index ${newIndex} out of bounds (0..${children.length})`);
            }
            children.splice(i, 1);
            children.splice(newIndex, 0, child);
        }
    }

    /**
     * Transform the given bounds from the local coordinate system of this element to the coordinate
     * system of its parent. This function should consider any transformation that is applied to the
     * view of this element and its contents.
     * The base implementation assumes that this element does not define a local coordinate system,
     * so it leaves the bounds unchanged.
     */
    localToParent(point: Point | Bounds): Bounds {
        return isBounds(point) ? point : { x: point.x, y: point.y, width: -1, height: -1 };
    }

    /**
     * Transform the given bounds from the coordinate system of this element's parent to its local
     * coordinate system. This function should consider any transformation that is applied to the
     * view of this element and its contents.
     * The base implementation assumes that this element does not define a local coordinate system,
     * so it leaves the bounds unchanged.
     */
    parentToLocal(point: Point | Bounds): Bounds {
        return isBounds(point) ? point : { x: point.x, y: point.y, width: -1, height: -1 };
    }
}

/**
 * A child element is contained in a parent element. All elements except the model root are child
 * elements. In order to keep the model class hierarchy simple, every child element is also a
 * parent element, although for many elements the array of children is empty (i.e. they are
 * leafs in the model element tree).
 */
export class SChildElement extends SParentElement {
    readonly parent: SParentElement;
}

/**
 * Base class for the root element of the diagram model tree.
 */
export class SModelRoot extends SParentElement {
    readonly index: SModelIndex<SModelElement>;
    revision?: number;

    canvasBounds: Bounds = EMPTY_BOUNDS;

    constructor(index = new SModelIndex<SModelElement>()) {
        super();
        // Override the index property from SModelElement, which has a getter, with a data property
        Object.defineProperty(this, 'index', {
            value: index,
            writable: false
        });
    }
}

const ID_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
export function createRandomId(length: number = 8): string {
    let id = "";
    for (let i = 0; i < length; i++) {
        id += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
    }
    return id;
}

/**
 * Used to speed up model element lookup by id.
 */
export class SModelIndex<E extends SModelElementSchema> {

    private readonly id2element: Map<string, E> = new Map();
    private id2parent?: Map<string, E>;

    add(element: E): void {
        if (!element.id) {
            do {
                element.id = createRandomId();
            } while (this.contains(element));
        } else if (this.contains(element)) {
            throw new Error("Duplicate ID in model: " + element.id);
        }
        this.id2element.set(element.id, element);
        if (element.children !== undefined && element.children.constructor === Array) {
            for (const child of element.children) {
                this.add(child as any);
                if (!(child instanceof SChildElement)) {
                    if (this.id2parent === undefined) {
                        this.id2parent = new Map();
                    }
                    this.id2parent.set(child.id, element);
                }
            }
        }
    }

    remove(element: E): void {
        this.id2element.delete(element.id);
        if (element.children !== undefined && element.children.constructor === Array) {
            for (const child of element.children) {
                if (!(child instanceof SChildElement)) {
                    if (this.id2parent === undefined) {
                        this.id2parent = new Map();
                    }
                    this.id2parent.delete(child.id);
                }
                this.remove(child as any);
            }
        }
    }

    contains(element: E): boolean {
        return this.id2element.has(element.id);
    }

    getById(id: string): E | undefined {
        return this.id2element.get(id);
    }

    /**
     * This utility method is for SModelElementSchema. For SChildElements, simply
     * use the `parent` property.
     */
    getParent(id: string): E | undefined {
        if (this.id2parent !== undefined) {
            return this.id2parent.get(id);
        }
        const element = this.getById(id);
        if (element instanceof SChildElement) {
            return element.parent as any;
        }
        return undefined;
    }

    /**
     * This utility method is for SModelElementSchema. For SModelElements, simply
     * use the `root` property.
     */
    getRoot(element: E): E extends SModelElement ? SModelRoot : SModelRootSchema {
        if (this.id2parent !== undefined) {
            let current: SModelElementSchema | undefined = element;
            while (current) {
                const parent = this.id2parent.get(current.id);
                if (parent === undefined) {
                    return current as any;
                }
                current = parent;
            }
        }
        if (element instanceof SChildElement) {
            return element.root as any;
        }
        throw new Error("Element has no root");
    }

    getAttachedElements(element: E): FluentIterable<E> {
        return [];
    }

    all(): FluentIterable<E> {
        return mapIterable(this.id2element, ([key, value]: [string, E]) => value);
    }
}
