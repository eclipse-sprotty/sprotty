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

import { Point } from 'sprotty-protocol/lib/utils/geometry';
import { ModelIndexImpl, SChildElementImpl, SModelElementImpl } from '../base/model/smodel';
import {
    Alignable, alignFeature, BoundsAware, boundsFeature, layoutableChildFeature, layoutContainerFeature,
    ModelLayoutOptions, SShapeElementImpl
} from '../features/bounds/model';
import { edgeLayoutFeature, EdgePlacement } from '../features/edge-layout/model';
import { deletableFeature } from '../features/edit/delete';
import { editFeature } from '../features/edit/model';
import { Fadeable, fadeFeature } from '../features/fade/model';
import { Hoverable, hoverFeedbackFeature, popupFeature } from '../features/hover/model';
import { moveFeature } from '../features/move/model';
import { connectableFeature, SConnectableElementImpl, SRoutableElementImpl } from '../features/routing/model';
import { Selectable, selectFeature } from '../features/select/model';
import { ViewportRootElementImpl } from '../features/viewport/viewport-root';
import { FluentIterable, FluentIterableImpl } from '../utils/iterable';

/**
 * Root element for graph-like models.
 */
export class SGraphImpl extends ViewportRootElementImpl {
    layoutOptions?: ModelLayoutOptions;

    constructor(index = new SGraphIndex()) {
        super(index);
    }
}

/**
 * Model element class for nodes, which are the main entities in a graph. A node can be connected to
 * another node via an SEdge. Such a connection can be direct, i.e. the node is the source or target of
 * the edge, or indirect through a port, i.e. it contains an SPort which is the source or target of the edge.
 */
export class SNodeImpl extends SConnectableElementImpl implements Selectable, Fadeable, Hoverable {
    static readonly DEFAULT_FEATURES = [connectableFeature, deletableFeature, selectFeature, boundsFeature,
        moveFeature, layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];

    override children: SChildElementImpl[];
    layout?: string;
    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

    override canConnect(routable: SRoutableElementImpl, role: string) {
        return this.children.find(c => c instanceof SPortImpl) === undefined;
    }

    override get incomingEdges(): FluentIterable<SEdgeImpl> {
        const index = this.index;
        if (index instanceof SGraphIndex) {
            return index.getIncomingEdges(this);
        }
        const allEdges = this.index.all().filter(e => e instanceof SEdgeImpl) as FluentIterable<SEdgeImpl>;
        return allEdges.filter(e => e.targetId === this.id);
    }

    override get outgoingEdges(): FluentIterable<SEdgeImpl> {
        const index = this.index;
        if (index instanceof SGraphIndex) {
            return index.getOutgoingEdges(this);
        }
        const allEdges = this.index.all().filter(e => e instanceof SEdgeImpl) as FluentIterable<SEdgeImpl>;
        return allEdges.filter(e => e.sourceId === this.id);
    }

}

/**
 * A port is a connection point for edges. It should always be contained in an SNode.
 */
export class SPortImpl extends SConnectableElementImpl implements Selectable, Fadeable, Hoverable {
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature, boundsFeature, fadeFeature,
        hoverFeedbackFeature];

    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

    override get incomingEdges(): FluentIterable<SEdgeImpl> {
        const index = this.index;
        if (index instanceof SGraphIndex) {
            return index.getIncomingEdges(this);
        }
        return super.incomingEdges.filter(e => e instanceof SEdgeImpl) as FluentIterable<SEdgeImpl>;
    }

    override get outgoingEdges(): FluentIterable<SEdgeImpl> {
        const index = this.index;
        if (index instanceof SGraphIndex) {
            return index.getOutgoingEdges(this);
        }
        return super.outgoingEdges.filter(e => e instanceof SEdgeImpl) as FluentIterable<SEdgeImpl>;
    }

}



/**
 * Model element class for edges, which are the connectors in a graph. An edge has a source and a target,
 * each of which can be either a node or a port. The source and target elements are referenced via their
 * ids and can be resolved with the index stored in the root element.
 */
export class SEdgeImpl extends SRoutableElementImpl implements Fadeable, Selectable, Hoverable, BoundsAware {
    static readonly DEFAULT_FEATURES = [editFeature, deletableFeature, selectFeature, fadeFeature,
        hoverFeedbackFeature];

    selected: boolean = false;
    hoverFeedback: boolean = false;
    opacity: number = 1;

}

/**
 * A label can be attached to a node, edge, or port, and contains some text to be rendered in its view.
 */
export class SLabelImpl extends SShapeElementImpl implements Selectable, Alignable, Fadeable {
    static readonly DEFAULT_FEATURES = [boundsFeature, alignFeature, layoutableChildFeature,
        edgeLayoutFeature, fadeFeature];

    text: string;
    selected: boolean = false;
    alignment: Point = Point.ORIGIN;
    opacity = 1;
    edgePlacement?: EdgePlacement;

}

/**
 * A compartment is used to group multiple child elements such as labels of a node. Usually a `vbox`
 * or `hbox` layout is used to arrange these children.
 */
export class SCompartmentImpl extends SShapeElementImpl implements Fadeable {
    static readonly DEFAULT_FEATURES = [boundsFeature, layoutContainerFeature, layoutableChildFeature,
        fadeFeature];

    override children: SChildElementImpl[];
    layout?: string;
    override layoutOptions?: {[key: string]: string | number | boolean};
    opacity = 1;

}



/**
 * A specialized model index that tracks outgoing and incoming edges.
 */
export class SGraphIndex extends ModelIndexImpl {

    private outgoing: Map<string, SEdgeImpl[]> = new Map;
    private incoming: Map<string, SEdgeImpl[]> = new Map;

    override add(element: SModelElementImpl): void {
        super.add(element);
        if (element instanceof SEdgeImpl) {
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

    override remove(element: SModelElementImpl): void {
        super.remove(element);
        if (element instanceof SEdgeImpl) {
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

    override getAttachedElements(element: SModelElementImpl): FluentIterable<SModelElementImpl> {
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

    getIncomingEdges(element: SConnectableElementImpl): FluentIterable<SEdgeImpl> {
        return this.incoming.get(element.id) || [];
    }

    getOutgoingEdges(element: SConnectableElementImpl): FluentIterable<SEdgeImpl> {
        return this.outgoing.get(element.id) || [];
    }
}
