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

import { Bounds, Point, Dimension } from './utils/geometry';
import { hasOwnProperty } from './utils/object';

/**
 * Base type for all elements of the diagram model.
 * Each model element must have a unique ID and a type that is used to look up its view.
 */
export interface SModelElement {
    type: string
    id: string
    children?: SModelElement[]
    cssClasses?: string[]
}

/**
 * Base type for the root element of the diagram model tree.
 */
export interface SModelRoot extends SModelElement {
    canvasBounds?: Bounds
    revision?: number
}

/**
 * Model elements that implement this interface have a position and a size.
 */
export interface BoundsAware {
    position: Point
    size: Dimension
}

/**
 * Used to adjust elements whose bounding box is not at the origin, e.g. labels
 * or pre-rendered SVG figures.
 */
export interface Alignable {
    alignment: Point
}

/**
 * A viewport has a scroll position and a zoom factor. Usually these properties are
 * applied to the root element to enable navigating through the diagram.
 */
export interface Viewport extends Scrollable, Zoomable {
}

/**
 * Usually the root of a model is also a viewport.
 */
export interface ViewportRootElement extends SModelRoot {
    scroll?: Point
    zoom?: number
    position?: Point
    size?: Dimension
}

/**
 * A scrollable element has a scroll position, which indicates the top left corner of the
 * visible area.
 */
export interface Scrollable {
    scroll: Point
}

export function isScrollable(element: SModelElement | Scrollable): element is Scrollable {
    return hasOwnProperty(element, 'scroll');
}

/**
 * A zoomable element can be scaled so it appears smaller or larger than its actual size.
 * The zoom value 1 is the default scale where the content is drawn with its actual size.
 */
export interface Zoomable {
    zoom: number
}

export function isZoomable(element: SModelElement | Zoomable): element is Zoomable {
    return hasOwnProperty(element, 'zoom');
}

/**
 * Root element for graph-like models.
 */
export interface SGraph extends SModelRoot {
    children: SModelElement[]
    bounds?: Bounds
    scroll?: Point
    zoom?: number
    layoutOptions?: ModelLayoutOptions
}

/**
 * Options to control the "micro layout" of a model element, i.e. the arrangement of its content
 * using simple algorithms such as horizontal or vertical box layout.
 */
export type ModelLayoutOptions = { [key: string]: string | number | boolean };

export interface SShapeElement extends SModelElement {
    position?: Point
    size?: Dimension
    layoutOptions?: ModelLayoutOptions
}

/**
 * Model element class for nodes, which are the main entities in a graph. A node can be connected to
 * another node via an SEdge. Such a connection can be direct, i.e. the node is the source or target of
 * the edge, or indirect through a port, i.e. it contains an SPort which is the source or target of the edge.
 */
export interface SNode extends SShapeElement {
    layout?: string
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
    anchorKind?: string
}

/**
 * A port is a connection point for edges. It should always be contained in an SNode.
 */
export interface SPort extends SShapeElement {
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
    anchorKind?: string
}

/**
 * Model element class for edges, which are the connectors in a graph. An edge has a source and a target,
 * each of which can be either a node or a port. The source and target elements are referenced via their ids.
 */
export interface SEdge extends SModelElement {
    sourceId: string
    targetId: string
    routerKind?: string
    routingPoints?: Point[]
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
}

/**
 * A label can be attached to a node, edge, or port, and contains some text to be rendered in its view.
 */
export interface SLabel extends SShapeElement {
    text: string
    selected?: boolean
}

/**
 * A compartment is used to group multiple child elements such as labels of a node. Usually a `vbox`
 * or `hbox` layout is used to arrange these children.
 */
export interface SCompartment extends SShapeElement {
    layout?: string
}

/**
 * Root model element class for HTML content. Usually this is rendered with a `div` DOM element.
 */
export interface HtmlRoot extends SModelRoot {
    classes?: string[]
}

/**
 * Pre-rendered elements contain HTML or SVG code to be transferred to the DOM. This can be useful to
 * render complex figures or to compute the view on the server instead of the client code.
 */
export interface PreRenderedElement extends SModelElement {
    code: string
}

/**
 * Same as PreRenderedElement, but with a position and a size.
 */
export interface ShapedPreRenderedElement extends PreRenderedElement {
    position?: Point
    size?: Dimension
}

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
export interface ForeignObjectElement extends ShapedPreRenderedElement {
    /** The namespace to be assigned to the elements inside of the `foreignObject`. */
    namespace: string
}
