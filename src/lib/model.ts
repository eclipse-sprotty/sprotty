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

import { SModelRoot, SModelRootSchema, SChildElement, SModelElementSchema } from "../base/model/smodel";
import { Point, Dimension, ORIGIN_POINT, EMPTY_DIMENSION, Bounds } from "../utils/geometry";
import { BoundsAware, boundsFeature, Alignable, alignFeature } from "../features/bounds/model";
import { Locateable, moveFeature } from "../features/move/model";
import { Selectable, selectFeature } from "../features/select/model";
import { SNode, SPort } from '../graph/sgraph';
import { RECTANGULAR_ANCHOR_KIND, DIAMOND_ANCHOR_KIND, ELLIPTIC_ANCHOR_KIND } from "../features/routing/anchor";

/**
 * A node that is represented by a circle.
 */
export class CircularNode extends SNode {
    get anchorKind() {
        return ELLIPTIC_ANCHOR_KIND;
    }
}

/**
 * A node that is represented by a rectangle.
 */
export class RectangularNode extends SNode {
    get anchorKind() {
        return RECTANGULAR_ANCHOR_KIND;
    }
}

/**
 * A node that is represented by a diamond.
 */
export class DiamondNode extends SNode {
    get anchorKind() {
        return DIAMOND_ANCHOR_KIND;
    }
}

/**
 * A port that is represented by a circle.
 */
export class CircularPort extends SPort {
    get anchorKind() {
        return ELLIPTIC_ANCHOR_KIND;
    }
}

/**
 * A port that is represented by a rectangle.
 */
export class RectangularPort extends SPort {
    get anchorKind() {
        return RECTANGULAR_ANCHOR_KIND;
    }
}

/**
 * Serializable schema for HtmlRoot.
 */
export interface HtmlRootSchema extends SModelRootSchema {
    classes?: string[]
}

/**
 * Root model element class for HTML content. Usually this is rendered with a `div` DOM element.
 */
export class HtmlRoot extends SModelRoot {
    classes: string[] = [];
}

/**
 * Serializable schema for PreRenderedElement.
 */
export interface PreRenderedElementSchema extends SModelElementSchema {
    code: string
}

/**
 * Pre-rendered elements contain HTML or SVG code to be transferred to the DOM. This can be useful to
 * render complex figures or to compute the view on the server instead of the client code.
 */
export class PreRenderedElement extends SChildElement {
    code: string;
}

/**
 * Serializable schema for ShapedPreRenderedElement.
 */
export interface ShapedPreRenderedElementSchema extends PreRenderedElementSchema {
    position?: Point
    size?: Dimension
}

/**
 * Same as PreRenderedElement, but with a position and a size.
 */
export class ShapedPreRenderedElement extends PreRenderedElement implements BoundsAware, Locateable, Selectable, Alignable {
    position: Point = ORIGIN_POINT;
    size: Dimension = EMPTY_DIMENSION;
    selected: boolean = false;
    alignment: Point = ORIGIN_POINT;

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

    hasFeature(feature: symbol): boolean {
        return feature === moveFeature || feature === boundsFeature || feature === selectFeature || feature === alignFeature;
    }
}
