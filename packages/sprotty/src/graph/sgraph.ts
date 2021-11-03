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

import { SChildElement, SModelElement, SModelElementSchema, SModelIndex, SModelRootSchema } from '../base/model/smodel';
import { Alignable, alignFeature, BoundsAware, boundsFeature, layoutableChildFeature, layoutContainerFeature,
    ModelLayoutOptions, SShapeElement, SShapeElementSchema } from '../features/bounds/model';
import { edgeLayoutFeature, EdgePlacement } from '../features/edge-layout/model';
import { deletableFeature } from '../features/edit/delete';
import { editFeature } from '../features/edit/model';
import { Fadeable, fadeFeature } from '../features/fade/model';
import { Hoverable, hoverFeedbackFeature, popupFeature } from '../features/hover/model';
import { moveFeature } from '../features/move/model';
import { connectableFeature, SConnectableElement, SRoutableElement } from '../features/routing/model';
import { Selectable, selectFeature } from '../features/select/model';
import { ViewportRootElement } from '../features/viewport/viewport-root';
import { Bounds, ORIGIN_POINT, Point } from '../utils/geometry';
import { FluentIterable, FluentIterableImpl } from '../utils/iterable';

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
 * Serializable schema for SNode.
 */
export interface SNodeSchema extends SShapeElementSchema {
    layout?: string
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
    anchorKind?: string
}

/**
 * Model element class for nodes, which are the main entities in a graph. A node can be connected to
 * another node via an SEdge. Such a connection can be direct, i.e. the node is the source or target of
 * the edge, or indirect through a port, i.e. it contains an SPort which is the source or target of the edge.
 */
export class SNode extends SConnectableElement implements Selectable, Fadeable, Hoverable {
    static readonly DEFAULT_FEATURES = [connectableFeature, deletableFeature, selectFeature, boundsFeature,
        moveFeature, layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];

    children: SChildElement[];
    layout?: string;
    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

    canConnect(routable: SRoutableElement, role: string) {
        return this.children.find(c => c instanceof SPort) === undefined;
    }

}

/**
 * Serializable schema for SPort.
 */
export interface SPortSchema extends SShapeElementSchema {
    selected?: boolean
    hoverFeedback?: boolean
    opacity?: number
    anchorKind?: string;
}

/**
 * A port is a connection point for edges. It should always be contained in an SNode.
 */
export class SPort extends SConnectableElement implements Selectable, Fadeable, Hoverable {
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature, boundsFeature, fadeFeature,
        hoverFeedbackFeature];

    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

}

/**
 * Serializable schema for SEdge.
 */
export interface SEdgeSchema extends SModelElementSchema {
    sourceId: string
    targetId: string
    routerKind?: string;
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
export class SEdge extends SRoutableElement implements Fadeable, Selectable, Hoverable, BoundsAware {
    static readonly DEFAULT_FEATURES = [editFeature, deletableFeature, selectFeature, fadeFeature,
        hoverFeedbackFeature];

    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

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
    static readonly DEFAULT_FEATURES = [boundsFeature, alignFeature, layoutableChildFeature,
        edgeLayoutFeature, fadeFeature];

    text: string;
    selected: boolean = false;
    alignment: Point = ORIGIN_POINT;
    opacity = 1;
    edgePlacement?: EdgePlacement;

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
    static readonly DEFAULT_FEATURES = [boundsFeature, layoutContainerFeature, layoutableChildFeature,
        fadeFeature];

    children: SChildElement[];
    layout?: string;
    layoutOptions?: {[key: string]: string | number | boolean};
    opacity = 1;

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

