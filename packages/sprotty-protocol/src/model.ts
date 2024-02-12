/********************************************************************************
 * Copyright (c) 2021-2023 TypeFox and others.
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
 * Usually the root of a model is also a viewport.
 */
export interface ViewportRootElement extends SModelRoot, Partial<Viewport>, Partial<BoundsAware> {
}

/**
 * Root element for graph-like models.
 */
export interface SGraph extends ViewportRootElement, Partial<LayoutableChild> {
    children: SModelElement[]

    /** @deprecated Use `position` and `size` instead. */
    bounds?: Bounds
}

export interface SShapeElement extends SModelElement, Partial<LayoutableChild> {
}

/**
 * Model element class for nodes, which are the main entities in a graph. A node can be connected to
 * another node via an SEdge. Such a connection can be direct, i.e. the node is the source or target of
 * the edge, or indirect through a port, i.e. it contains an SPort which is the source or target of the edge.
 */
export interface SNode extends SShapeElement, Partial<LayoutContainer>, Partial<Selectable>, Partial<Hoverable>, Partial<Fadeable> {
    anchorKind?: string
}

/**
 * A port is a connection point for edges. It should always be contained in an SNode.
 */
export interface SPort extends SShapeElement, Partial<Selectable>, Partial<Hoverable>, Partial<Fadeable> {
    anchorKind?: string
}

/**
 * Model element class for edges, which are the connectors in a graph. An edge has a source and a target,
 * each of which can be either a node or a port. The source and target elements are referenced via their ids.
 */
export interface SEdge extends SModelElement, Partial<Selectable>, Partial<Hoverable>, Partial<Fadeable> {
    sourceId: string
    targetId: string
    routerKind?: string
    routingPoints?: Point[]
}

/**
 * A label can be attached to a node, edge, or port, and contains some text to be rendered in its view.
 */
export interface SLabel extends SShapeElement, Partial<Selectable>, Partial<Alignable> {
    text: string
}

/**
 * A compartment is used to group multiple child elements such as labels of a node. Usually a `vbox`
 * or `hbox` layout is used to arrange these children.
 */
export interface SCompartment extends SShapeElement, Partial<LayoutContainer> {
}

/**
 * A viewport has a scroll position and a zoom factor. Usually these properties are
 * applied to the root element to enable navigating through the diagram.
 */
export interface Viewport extends Scrollable, Zoomable {
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
 * An element that can be placed at a specific location using its position property.
 * Feature extension interface for `moveFeature`.
 */
export interface Locateable {
    position: Point
}

/**
 * Model elements that implement this interface have a position and a size.
 */
export interface BoundsAware extends Locateable {
    size: Dimension
}

/**
 * Feature extension interface for `layoutableChildFeature`. This is used when the parent
 * element has a `layout` property (meaning it's a `LayoutContainer`).
*/
export interface LayoutableChild extends BoundsAware {
    layoutOptions?: ModelLayoutOptions
}

/**
 * Layout options of a `LayoutableChild`.
 */
export interface ModelLayoutOptions {
    hAlign?: HAlignment
    hGap?: number
    vAlign?: VAlignment
    vGap?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingFactor?: number
    minWidth?: number
    minHeight?: number
    resizeContainer?: boolean
    [key: string]: string | number | boolean | undefined
};

export type HAlignment = 'left' | 'center' | 'right';
export type VAlignment = 'top' | 'center' | 'bottom';

/**
 * Used to identify model elements that specify a layout to apply to their children.
 */
export interface LayoutContainer extends LayoutableChild {
    layout: LayoutKind
}

/**
 * Type for the layout property of a `LayoutContainer`.
 */
export type LayoutKind = 'stack' | 'vbox' | 'hbox' | (string & {});

/**
 * Feature extension interface for `alignFeature`.
 * Used to adjust elements whose bounding box is not at the origin, e.g. labels
 * or pre-rendered SVG figures.
 */
export interface Alignable {
    alignment: Point
}

/**
 * Feature extension interface for `selectFeature`. The selection status is often considered
 * in the frontend views, e.g. by switching CSS classes.
 */
export interface Selectable {
    selected: boolean
}

/**
 * Feature extension interface for `hoverFeedbackFeature`. The hover feedback status is often
 * considered in the frontend views, e.g. by switching CSS classes.
 */
export interface Hoverable {
    hoverFeedback: boolean
}

/**
 * Feature extension interface for `fadeFeature`. Fading is mostly used to animate when an element
 * appears or disappears.
 */
export interface Fadeable {
    opacity: number
}

/**
 * Feature extension interface for `expandFeature`.
 * Model elements that implement this interface can be expanded and collapsed.
 */
export interface Expandable {
    expanded: boolean
}

/**
 * Model elements implementing this interface can be displayed on a projection bar.
 * _Note:_ If set, the projectedBounds property will be prefered over the model element bounds.
 * Otherwise model elements also have to be `BoundsAware` so their projections can be shown.
 */
export interface Projectable {
    projectionCssClasses: string[],
    projectedBounds?: Bounds,
}

/**
 * Feature extension interface for `edgeLayoutFeature`. This is often applied to
 * {@link SLabel} elements to specify their placement along the containing edge.
 */
export interface EdgeLayoutable {
    edgePlacement: EdgePlacement
}

export type EdgeSide = 'left' | 'right' | 'top' | 'bottom' | 'on';

/**
 * Each label attached to an edge can be placed on the edge in different ways.
 * With this interface the placement of such a single label is defined.
 */
export interface EdgePlacement {
    /**
     * true, if the label should be rotated to touch the edge tangentially
     */
    rotate: boolean;

    /**
     * where is the label relative to the line's direction
     */
    side: EdgeSide;

    /**
     * between 0 (source anchor) and 1 (target anchor)
     */
    position: number;

    /**
     * space between label and edge/connected nodes
     */
    offset: number;

    /**
     * where should the label be moved when move feature is enabled.
     * 'edge' means the label is moved along the edge, 'free' means the label is moved freely, 'none' means the label can not be moved.
     * Default is 'edge'.
     */
    moveMode?: 'edge' | 'free' | 'none';
}

/**
 * Buttons are elements that can react to clicks. A button handler can be registered in the frontend.
 */
export interface SButton extends SShapeElement {
    pressed: boolean
    enabled: boolean
}

/**
 * An issue marker is used to display a symbol about an error or a warning attached to another model element.
 */
export interface SIssueMarker extends SShapeElement {
    issues: SIssue[]
}

export type SIssueSeverity = 'error' | 'warning' | 'info';

export interface SIssue {
    message: string
    severity: SIssueSeverity
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
