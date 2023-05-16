/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
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

import { SModelElement as SModelElementSchema, SModelRoot as SModelRootSchema } from 'sprotty-protocol/lib/model';
import { Bounds, Dimension, Point } from "sprotty-protocol/lib/utils/geometry";
import { SModelRootImpl, SChildElementImpl } from "../base/model/smodel";
import { BoundsAware, boundsFeature, Alignable, alignFeature, isBoundsAware } from "../features/bounds/model";
import { Locateable, moveFeature } from "../features/move/model";
import { Selectable, selectFeature } from "../features/select/model";
import { SNodeImpl, SPortImpl } from '../graph/sgraph';
import { RECTANGULAR_ANCHOR_KIND, DIAMOND_ANCHOR_KIND, ELLIPTIC_ANCHOR_KIND } from "../features/routing/anchor";

/**
 * A node that is represented by a circle.
 */
export class CircularNode extends SNodeImpl {
    override get anchorKind() {
        return ELLIPTIC_ANCHOR_KIND;
    }
}

/**
 * A node that is represented by a rectangle.
 */
export class RectangularNode extends SNodeImpl {
    override get anchorKind() {
        return RECTANGULAR_ANCHOR_KIND;
    }
}

/**
 * A node that is represented by a diamond.
 */
export class DiamondNode extends SNodeImpl {
    override get anchorKind() {
        return DIAMOND_ANCHOR_KIND;
    }
}

/**
 * A port that is represented by a circle.
 */
export class CircularPort extends SPortImpl {
    override get anchorKind() {
        return ELLIPTIC_ANCHOR_KIND;
    }
}

/**
 * A port that is represented by a rectangle.
 */
export class RectangularPort extends SPortImpl {
    override get anchorKind() {
        return RECTANGULAR_ANCHOR_KIND;
    }
}

/**
 * Serializable schema for HtmlRoot.
 *
 * @deprecated Use `HtmlRoot` from `sprotty-protocol` instead.
 */
export interface HtmlRootSchema extends SModelRootSchema {
    classes?: string[]
}

/**
 * Root model element class for HTML content. Usually this is rendered with a `div` DOM element.
 */
export class HtmlRootImpl extends SModelRootImpl {
    classes: string[] = [];
}

/** @deprecated Use `HtmlRootImpl` instead. */
export const HtmlRoot = HtmlRootImpl;

/**
 * Serializable schema for PreRenderedElement.
 *
 * @deprecated Use `PreRenderedElement` from `sprotty-protocol` instead.
 */
export interface PreRenderedElementSchema extends SModelElementSchema {
    code: string
}

/**
 * Pre-rendered elements contain HTML or SVG code to be transferred to the DOM. This can be useful to
 * render complex figures or to compute the view on the server instead of the client code.
 */
export class PreRenderedElementImpl extends SChildElementImpl {
    code: string;
}

/** @deprecated Use `PreRenderedElementImpl` instead. */
export const PreRenderedElement = PreRenderedElementImpl;

/**
 * Serializable schema for ShapedPreRenderedElement.
 *
 * @deprecated Use `ShapedPreRenderedElement` from `sprotty-protocol` instead.
 */
export interface ShapedPreRenderedElementSchema extends PreRenderedElementSchema {
    position?: Point
    size?: Dimension
}

/**
 * Same as PreRenderedElement, but with a position and a size.
 */
export class ShapedPreRenderedElementImpl extends PreRenderedElementImpl implements BoundsAware, Locateable, Selectable, Alignable {
    static readonly DEFAULT_FEATURES = [moveFeature, boundsFeature, selectFeature, alignFeature];

    position: Point = Point.ORIGIN;
    size: Dimension = Dimension.EMPTY;
    selected: boolean = false;
    alignment: Point = Point.ORIGIN;

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

}

/** @deprecated Use `ShapedPreRenderedElementImpl` instead. */
export const ShapedPreRenderedElement = ShapedPreRenderedElementImpl;

/**
 * A `foreignObject` element to be transferred to the DOM within the SVG.
 *
 * This can be useful to to benefit from e.g. HTML rendering features, such as line wrapping, inside of
 * the SVG diagram.  Note that `foreignObject` is not supported by all browsers and SVG viewers may not
 * support rendering the `foreignObject` content.
 *
 * If no dimensions are specified in the schema element, this element will obtain the dimension of
 * its parent to fill the entire available room. Thus, this element requires specified bounds itself
 * or bounds to be available for its parent.
 */
export class ForeignObjectElementImpl extends ShapedPreRenderedElementImpl {
    namespace: string;
    override get bounds(): Bounds {
        if (Dimension.isValid(this.size)) {
            return {
                x: this.position.x,
                y: this.position.y,
                width: this.size.width,
                height: this.size.height
            };
        } else if (isBoundsAware(this.parent)) {
            return {
                x: this.position.x,
                y: this.position.y,
                width: this.parent.bounds.width,
                height: this.parent.bounds.height
            };
        }
        return Bounds.EMPTY;
    }
}

/** @deprecated Use `ForeignObjectElementImpl` instead. */
export const ForeignObjectElement = ForeignObjectElementImpl;

/**
 * Serializable schema for ForeignObjectElement.
 *
 * @deprecated Use `ForeignObjectElement` from `sprotty-protocol` instead.
 */
export interface ForeignObjectElementSchema extends ShapedPreRenderedElementSchema {
    /** The namespace to be assigned to the elements inside of the `foreignObject`. */
    namespace: string
}
