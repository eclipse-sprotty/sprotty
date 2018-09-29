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

import { FluentIterable, FluentIterableImpl } from '../utils/iterable';
import {
    SChildElement, SModelElementSchema, SModelRootSchema, SModelIndex, SModelElement, SParentElement
} from '../base/model/smodel';
import {
    boundsFeature, layoutContainerFeature, layoutableChildFeature, Alignable, alignFeature, ModelLayoutOptions
} from '../features/bounds/model';
import { Fadeable, fadeFeature } from '../features/fade/model';
import { Hoverable, hoverFeedbackFeature, popupFeature } from '../features/hover/model';
import { moveFeature } from '../features/move/model';
import { Selectable, selectFeature } from '../features/select/model';
import { ViewportRootElement } from '../features/viewport/viewport-root';
import { Bounds, ORIGIN_POINT, Point, center } from '../utils/geometry';
import { SShapeElement, SShapeElementSchema } from '../features/bounds/model';
import { editFeature, Routable, filterEditModeHandles } from '../features/edit/model';
import { translatePoint } from '../base/model/smodel-utils';
import { RoutedPoint, LinearEdgeRouter, IEdgeRouter } from './routing';

/**
 * Serializable schema for graph-like models.
 */
export interface SGraphSchema extends SModelRootSchema {
    children: SModelElementSchema[]
    bounds?: Bounds
    scroll?: Point
    zoom?: number
    layoutOptions?: ModelLayoutOptions
}

/**
 * Root element for graph-like models.
 */
export class SGraph extends ViewportRootElement {
    layoutOptions?: ModelLayoutOptions;

    constructor(index = new SGraphIndex()) {
        super(index);
    }
}

/**
 * A connectable element is one that can have outgoing and incoming edges, i.e. it can be the source
 * or target element of an edge. There are two kinds of connectable elements: nodes (`SNode`) and
 * ports (`SPort`). A node represents a main entity, while a port is a connection point inside a node.
 */
export abstract class SConnectableElement extends SShapeElement {

    /**
     * The incoming edges of this connectable element. They are resolved by the index, which must
     * be an `SGraphIndex`.
     */
    get incomingEdges(): FluentIterable<SEdge> {
        return (this.index as SGraphIndex).getIncomingEdges(this);
    }

    /**
     * The outgoing edges of this connectable element. They are resolved by the index, which must
     * be an `SGraphIndex`.
     */
    get outgoingEdges(): FluentIterable<SEdge> {
        return (this.index as SGraphIndex).getOutgoingEdges(this);
    }

    /**
     * Compute an anchor position for routing an edge towards this element.
     *
     * The default implementation returns the element's center point. If edges should be connected
     * differently, e.g. to some point on the boundary of the element's view, the according computation
     * should be implemented in a subclass by overriding this method.
     *
     * @param referencePoint The point from which the edge is routed towards this element
     * @param offset An optional offset value to be considered in the anchor computation;
     *               positive values should shift the anchor away from this element, negative values
     *               should shift the anchor more to the inside.
     */
    getAnchor(referencePoint: Point, offset?: number): Point {
        return center(this.bounds);
    }

    /**
     * Compute an anchor position for routing an edge towards this element and correct any mismatch
     * of the coordinate systems.
     *
     * @param refPoint The point from which the edge is routed towards this element
     * @param refContainer The parent element that defines the coordinate system for `refPoint`
     * @param edge The edge for which the anchor is computed
     * @param offset An optional offset value (see `getAnchor`)
     */
    getTranslatedAnchor(refPoint: Point, refContainer: SParentElement, edge: SEdge, offset?: number): Point {
        const translatedRefPoint = translatePoint(refPoint, refContainer, this.parent);
        const anchor = this.getAnchor(translatedRefPoint, offset);
        return translatePoint(anchor, this.parent, edge.parent);
    }
}

/**
 * Serializable schema for SNode.
 */
export interface SNodeSchema extends SShapeElementSchema {
    layout?: string
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
}

/**
 * Model element class for nodes, which are the main entities in a graph. A node can be connected to
 * another node via an SEdge. Such a connection can be direct, i.e. the node is the source or target of
 * the edge, or indirect through a port, i.e. it contains an SPort which is the source or target of the edge.
 */
export class SNode extends SConnectableElement implements Selectable, Fadeable, Hoverable {
    children: SChildElement[];
    layout?: string;
    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || feature === moveFeature || feature === boundsFeature
            || feature === layoutContainerFeature || feature === fadeFeature || feature === hoverFeedbackFeature
            || feature === popupFeature;
    }
}

/**
 * Serializable schema for SPort.
 */
export interface SPortSchema extends SShapeElementSchema {
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
}

/**
 * A port is a connection point for edges. It should always be contained in an SNode.
 */
export class SPort extends SConnectableElement implements Selectable, Fadeable, Hoverable {
    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || feature === boundsFeature || feature === fadeFeature
            || feature === hoverFeedbackFeature;
    }
}

/**
 * Serializable schema for SEdge.
 */
export interface SEdgeSchema extends SModelElementSchema {
    sourceId: string
    targetId: string
    routingPoints?: Point[]
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
}

/**
 * Model element class for edges, which are the connectors in a graph. An edge has a source and a target,
 * each of which can be either a node or a port. The source and target elements are referenced via their
 * ids and can be resolved with the index stored in the root element.
 */
export class SEdge extends SChildElement implements Fadeable, Selectable, Routable, Hoverable {
    sourceId: string;
    targetId: string;
    routingPoints: Point[] = [];
    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;
    sourceAnchorCorrection?: number;
    targetAnchorCorrection?: number;
    router?: IEdgeRouter;

    get source(): SConnectableElement | undefined {
        return this.index.getById(this.sourceId) as SConnectableElement;
    }

    get target(): SConnectableElement | undefined {
        return this.index.getById(this.targetId) as SConnectableElement;
    }

    route(): RoutedPoint[] {
        if (this.router === undefined)
            this.router = new LinearEdgeRouter();
        const route = this.router.route(this);
        return filterEditModeHandles(route, this);
    }

    hasFeature(feature: symbol): boolean {
        return feature === fadeFeature || feature === selectFeature ||
            feature === editFeature || feature === hoverFeedbackFeature;
    }
}

/**
 * Serializable schema for SLabel.
 */
export interface SLabelSchema extends SShapeElementSchema {
    text: string
    selected?: boolean
}

/**
 * A label can be attached to a node, edge, or port, and contains some text to be rendered in its view.
 */
export class SLabel extends SShapeElement implements Selectable, Alignable, Fadeable {
    text: string;
    selected: boolean = false;
    alignment: Point = ORIGIN_POINT;
    opacity = 1;

    hasFeature(feature: symbol) {
        return feature === boundsFeature || feature === alignFeature || feature === fadeFeature || feature === layoutableChildFeature;
    }
}

/**
 * Serializable schema for SCompartment.
 */
export interface SCompartmentSchema extends SShapeElementSchema {
    layout?: string
}

/**
 * A compartment is used to group multiple child elements such as labels of a node. Usually a `vbox`
 * or `hbox` layout is used to arrange these children.
 */
export class SCompartment extends SShapeElement implements Fadeable {
    children: SChildElement[];
    layout?: string;
    layoutOptions?: {[key: string]: string | number | boolean};
    opacity = 1;

    hasFeature(feature: symbol) {
        return feature === boundsFeature || feature === layoutContainerFeature || feature === layoutableChildFeature || feature === fadeFeature;
    }
}

/**
 * A specialized model index that tracks outgoing and incoming edges.
 */
export class SGraphIndex extends SModelIndex<SModelElement> {

    private outgoing: Map<string, SEdge[]> = new Map;
    private incoming: Map<string, SEdge[]> = new Map;

    add(element: SModelElement): void {
        super.add(element);
        if (element instanceof SEdge) {
            // Register the edge in the outgoing map
            if (element.sourceId) {
                const sourceArr = this.outgoing.get(element.sourceId);
                if (sourceArr === undefined)
                    this.outgoing.set(element.sourceId, [element]);
                else
                    sourceArr.push(element);
            }
            // Register the edge in the incoming map
            if (element.targetId) {
                const targetArr = this.incoming.get(element.targetId);
                if (targetArr === undefined)
                    this.incoming.set(element.targetId, [element]);
                else
                    targetArr.push(element);
            }
        }
    }

    remove(element: SModelElement): void {
        super.remove(element);
        if (element instanceof SEdge) {
            // Remove the edge from the outgoing map
            const sourceArr = this.outgoing.get(element.sourceId);
            if (sourceArr !== undefined) {
                const index = sourceArr.indexOf(element);
                if (index >= 0) {
                    if (sourceArr.length === 1)
                        this.outgoing.delete(element.sourceId);
                    else
                        sourceArr.splice(index, 1);
                }
            }
            // Remove the edge from the incoming map
            const targetArr = this.incoming.get(element.targetId);
            if (targetArr !== undefined) {
                const index = targetArr.indexOf(element);
                if (index >= 0) {
                    if (targetArr.length === 1)
                        this.incoming.delete(element.targetId);
                    else
                        targetArr.splice(index, 1);
                }
            }
        }
    }

    getAttachedElements(element: SModelElement): FluentIterable<SModelElement> {
        return new FluentIterableImpl(
            () => ({
                outgoing: this.outgoing.get(element.id),
                incoming: this.incoming.get(element.id),
                nextOutgoingIndex: 0,
                nextIncomingIndex: 0
            }),
            (state) => {
                let index = state.nextOutgoingIndex;
                if (state.outgoing !== undefined && index < state.outgoing.length) {
                    state.nextOutgoingIndex = index + 1;
                    return { done: false, value: state.outgoing[index] };
                }
                index = state.nextIncomingIndex;
                if (state.incoming !== undefined) {
                    // Filter out self-loops: edges that are both outgoing and incoming
                    while (index < state.incoming.length) {
                        const edge = state.incoming[index];
                        if (edge.sourceId !== edge.targetId) {
                            state.nextIncomingIndex = index + 1;
                            return { done: false, value: edge };
                        }
                        index++;
                    }
                }
                return { done: true, value: undefined as any };
            }
        );
    }

    getIncomingEdges(element: SConnectableElement): FluentIterable<SEdge> {
        return this.incoming.get(element.id) || [];
    }

    getOutgoingEdges(element: SConnectableElement): FluentIterable<SEdge> {
        return this.outgoing.get(element.id) || [];
    }

}
