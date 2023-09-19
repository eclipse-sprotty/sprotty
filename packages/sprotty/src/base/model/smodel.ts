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

import { SModelElement } from 'sprotty-protocol/lib/model';
import { Bounds, isBounds, Point } from 'sprotty-protocol/lib/utils/geometry';
import { FluentIterable, mapIterable } from '../../utils/iterable';

/**
 * Base class for all elements of the internal diagram model.
 * Each model element must have a unique ID and a type that is used to look up its view.
 */
export class SModelElementImpl {
    type: string;
    id: string;
    features?: FeatureSet;
    cssClasses?: string[];

    get root(): SModelRootImpl {
        let current: SModelElementImpl | undefined = this;
        while (current) {
            if (current instanceof SModelRootImpl)
                return current;
            else if (current instanceof SChildElementImpl)
                current = current.parent;
            else
                current = undefined;
        }
        throw new Error('Element has no root');
    }

    get index(): ModelIndexImpl {
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

export function isParent(element: SModelElement | SModelElementImpl):
        element is SModelElement & { children: SModelElement[] } {
    const children = (element as any).children;
    return children !== undefined && children.constructor === Array;
}

/**
 * A parent element may contain child elements, thus the diagram model forms a tree.
 */
export class SParentElementImpl extends SModelElementImpl {
    readonly children: ReadonlyArray<SChildElementImpl> = [];

    add(child: SChildElementImpl, index?: number) {
        const children = this.children as SChildElementImpl[];
        if (index === undefined) {
            children.push(child);
        } else {
            if (index < 0 || index > this.children.length) {
                throw new Error(`Child index ${index} out of bounds (0..${children.length})`);
            }
            children.splice(index, 0, child);
        }
        (child as {parent: SParentElementImpl}).parent = this;
        this.index.add(child);
    }

    remove(child: SChildElementImpl) {
        const children = this.children as SChildElementImpl[];
        const i = children.indexOf(child);
        if (i < 0) {
            throw new Error(`No such child ${child.id}`);
        }
        children.splice(i, 1);
        this.index.remove(child);
    }

    removeAll(filter?: (e: SChildElementImpl) => boolean) {
        const children = this.children as SChildElementImpl[];
        if (filter !== undefined) {
            for (let i = children.length - 1; i >= 0; i--) {
                if (filter(children[i])) {
                    const child = children.splice(i, 1)[0];
                    this.index.remove(child);
                }
            }
        } else {
            children.forEach(child => {
                this.index.remove(child);
            });
            children.splice(0, children.length);
        }
    }

    move(child: SChildElementImpl, newIndex: number) {
        const children = this.children as SChildElementImpl[];
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
export class SChildElementImpl extends SParentElementImpl {
    readonly parent: SParentElementImpl;
}


/**
 * Base class for the root element of the diagram model tree.
 */
export class SModelRootImpl extends SParentElementImpl {
    revision?: number;

    canvasBounds: Bounds = Bounds.EMPTY;

    constructor(index = new ModelIndexImpl()) {
        super();
          // Override the index property from SModelElement, which has a getter, with a data property
          Object.defineProperty(this, 'index', {
            value: index,
            writable: false
        });
    }
}

const ID_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
export function createRandomId(length: number = 8): string {
    let id = '';
    for (let i = 0; i < length; i++) {
        id += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
    }
    return id;
}


/**
 * Used to speed up model element lookup by id.
 */
 export interface IModelIndex {
    add(element: SModelElement): void
    remove(element: SModelElement): void
    contains(element: SModelElement): boolean
    getById(id: string): SModelElement | undefined
}

/**
 * This index implementation is for the _internal model_ that is used for rendering.
 */
export class ModelIndexImpl implements IModelIndex {

    private readonly id2element: Map<string, SModelElementImpl> = new Map();

    add(element: SModelElementImpl): void {
        if (!element.id) {
            do {
                element.id = createRandomId();
            } while (this.contains(element));
        } else if (this.contains(element)) {
            throw new Error('Duplicate ID in model: ' + element.id);
        }
        this.id2element.set(element.id, element);
        if (element instanceof SParentElementImpl) {
            for (const child of element.children) {
                this.add(child as any);
            }
        }
    }

    remove(element: SModelElementImpl): void {
        this.id2element.delete(element.id);
        if (element instanceof SParentElementImpl) {
            for (const child of element.children) {
                this.remove(child as any);
            }
        }
    }

    contains(element: SModelElementImpl): boolean {
        return this.id2element.has(element.id);
    }

    getById(id: string): SModelElementImpl | undefined {
        return this.id2element.get(id);
    }

    getAttachedElements(element: SModelElementImpl): FluentIterable<SModelElementImpl> {
        return [];
    }

    all(): FluentIterable<SModelElementImpl> {
        return mapIterable(this.id2element, ([key, value]: [string, SModelElementImpl]) => value);
    }
}
