/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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

import { SChildElement, SModelElement } from '../../base/model/smodel';
import { SModelExtension } from '../../base/model/smodel-extension';
import { SEdge, SGraphIndex } from '../../graph/sgraph';
import { Point, Bounds, combine, EMPTY_BOUNDS } from '../../utils/geometry';
import { FluentIterable } from '../../utils/iterable';
import { SShapeElement } from '../bounds/model';
import { deletableFeature } from '../edit/delete';
import { Selectable, selectFeature } from '../select/model';
import { Hoverable, hoverFeedbackFeature } from '../hover/model';
import { moveFeature } from '../move/model';

export abstract class SRoutableElement extends SChildElement {
    routerKind?: string;
    routingPoints: Point[] = [];
    sourceId: string;
    targetId: string;
    sourceAnchorCorrection?: number;
    targetAnchorCorrection?: number;

    get source(): SConnectableElement | undefined {
        return this.index.getById(this.sourceId) as SConnectableElement;
    }

    get target(): SConnectableElement | undefined {
        return this.index.getById(this.targetId) as SConnectableElement;
    }

    get bounds(): Bounds {
        // this should also work for splines, which have the convex hull property
        return this.routingPoints.reduce<Bounds>((bounds, routingPoint) => combine(bounds, {
            x: routingPoint.x,
            y: routingPoint.y,
            width: 0,
            height: 0
        }), EMPTY_BOUNDS);
    }
}

export const connectableFeature = Symbol('connectableFeature');

export interface Connectable extends SModelExtension {
    canConnect(routable: SRoutableElement, role: 'source' | 'target'): boolean;
}

export function isConnectable<T extends SModelElement>(element: T): element is Connectable & T {
    return element.hasFeature(connectableFeature) && (element as any).canConnect;
}

/**
 * A connectable element is one that can have outgoing and incoming edges, i.e. it can be the source
 * or target element of an edge. There are two kinds of connectable elements: nodes (`SNode`) and
 * ports (`SPort`). A node represents a main entity, while a port is a connection point inside a node.
 */
export abstract class SConnectableElement extends SShapeElement implements Connectable {

    anchorKind?: string;

    strokeWidth: number = 0;

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

    canConnect(routable: SRoutableElement, role: 'source' | 'target') {
        return true;
    }
}

export type RoutingHandleKind = 'junction' | 'line' | 'source' | 'target' | 'manhattan-50%';

export class SRoutingHandle extends SChildElement implements Selectable, Hoverable {
    static readonly DEFAULT_FEATURES = [selectFeature, moveFeature, hoverFeedbackFeature];

    /**
     * 'junction' is a point where two line segments meet,
     * 'line' is a volatile handle placed on a line segment,
     * 'source' and 'target' are the respective anchors.
     */
    kind: RoutingHandleKind;
    /** The actual routing point index (junction) or the previous point index (line). */
    pointIndex: number;
    /** Whether the routing point is being dragged. */
    editMode: boolean = false;

    hoverFeedback: boolean = false;
    selected: boolean = false;
    danglingAnchor?: SDanglingAnchor;

    /**
     * SRoutingHandles are created using the constructor, so we hard-wire the
     * default features
     */
    hasFeature(feature: symbol): boolean {
        return SRoutingHandle.DEFAULT_FEATURES.indexOf(feature) !== -1;
    }
}

export class SDanglingAnchor extends SConnectableElement {
    static readonly DEFAULT_FEATURES = [deletableFeature];

    original?: SModelElement;
    type = 'dangling-anchor';

    constructor() {
        super();
        this.size = { width: 0, height: 0 };
    }
}

export const edgeInProgressID = 'edge-in-progress';
export const edgeInProgressTargetHandleID = edgeInProgressID + '-target-anchor';
