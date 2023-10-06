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

import { Bounds, Point } from 'sprotty-protocol/lib/utils/geometry';
import { SChildElementImpl, SModelElementImpl } from '../../base/model/smodel';
import { FluentIterable } from '../../utils/iterable';
import { SShapeElementImpl } from '../bounds/model';
import { deletableFeature } from '../edit/delete';
import { Selectable, selectFeature } from '../select/model';
import { Hoverable, hoverFeedbackFeature } from '../hover/model';
import { moveFeature } from '../move/model';

export abstract class SRoutableElementImpl extends SChildElementImpl {

    routerKind?: string;
    routingPoints: Point[] = [];
    sourceId: string;
    targetId: string;
    sourceAnchorCorrection?: number;
    targetAnchorCorrection?: number;

    get source(): SConnectableElementImpl | undefined {
        return this.index.getById(this.sourceId) as SConnectableElementImpl;
    }

    get target(): SConnectableElementImpl | undefined {
        return this.index.getById(this.targetId) as SConnectableElementImpl;
    }

    get bounds(): Bounds {
        // this should also work for splines, which have the convex hull property
        return this.routingPoints.reduce<Bounds>((bounds, routingPoint) => Bounds.combine(bounds, {
            x: routingPoint.x,
            y: routingPoint.y,
            width: 0,
            height: 0
        }), Bounds.EMPTY);
    }
}

export const connectableFeature = Symbol('connectableFeature');

/**
 * Feature extension interface for {@link connectableFeature}.
 */
export interface Connectable {
    canConnect(routable: SRoutableElementImpl, role: 'source' | 'target'): boolean;
}

export function isConnectable<T extends SModelElementImpl>(element: T): element is Connectable & T {
    return element.hasFeature(connectableFeature) && (element as any).canConnect;
}

export function getAbsoluteRouteBounds(model: Readonly<SRoutableElementImpl>, route: Point[] = model.routingPoints): Bounds {
    let bounds = getRouteBounds(route);
    let current: SModelElementImpl = model;
    while (current instanceof SChildElementImpl) {
        const parent = current.parent;
        bounds = parent.localToParent(bounds);
        current = parent;
    }
    return bounds;
}

export function getRouteBounds(route: Point[]): Bounds {
    const bounds = { x: NaN, y: NaN, width: 0, height: 0 };
    for (const point of route) {
        if (isNaN(bounds.x)) {
            bounds.x = point.x;
            bounds.y = point.y;
        } else {
            if (point.x < bounds.x) {
                bounds.width += bounds.x - point.x;
                bounds.x = point.x;
            } else if (point.x > bounds.x + bounds.width) {
                bounds.width = point.x - bounds.x;
            }
            if (point.y < bounds.y) {
                bounds.height += bounds.y - point.y;
                bounds.y = point.y;
            } else if (point.y > bounds.y + bounds.height) {
                bounds.height = point.y - bounds.y;
            }
        }
    }
    return bounds;
}

/**
 * A connectable element is one that can have outgoing and incoming edges, i.e. it can be the source
 * or target element of an edge. There are two kinds of connectable elements: nodes (`SNode`) and
 * ports (`SPort`). A node represents a main entity, while a port is a connection point inside a node.
 */
export abstract class SConnectableElementImpl extends SShapeElementImpl implements Connectable {

    get anchorKind(): string | undefined {
        return undefined;
    }

    strokeWidth: number = 0;

    /**
     * The incoming edges of this connectable element. They are resolved by the index, which must
     * be an `SGraphIndex` for efficient lookup.
     */
    get incomingEdges(): FluentIterable<SRoutableElementImpl> {
        const allEdges = this.index.all().filter(e => e instanceof SRoutableElementImpl) as FluentIterable<SRoutableElementImpl>;
        return allEdges.filter(e => e.targetId === this.id);
    }

    /**
     * The outgoing edges of this connectable element. They are resolved by the index, which must
     * be an `SGraphIndex` for efficient lookup.
     */
    get outgoingEdges(): FluentIterable<SRoutableElementImpl> {
        const allEdges = this.index.all().filter(e => e instanceof SRoutableElementImpl) as FluentIterable<SRoutableElementImpl>;
        return allEdges.filter(e => e.sourceId === this.id);
    }

    canConnect(routable: SRoutableElementImpl, role: 'source' | 'target') {
        return true;
    }
}


export type RoutingHandleKind = 'junction' | 'line' | 'source' | 'target' | 'manhattan-50%' |
    'bezier-control-after' | 'bezier-control-before' | 'bezier-junction' | 'bezier-add' | 'bezier-remove';

export class SRoutingHandleImpl extends SChildElementImpl implements Selectable, Hoverable {
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
    danglingAnchor?: SDanglingAnchorImpl;

    /**
     * SRoutingHandles are created using the constructor, so we hard-wire the
     * default features
     */
    override hasFeature(feature: symbol): boolean {
        return SRoutingHandleImpl.DEFAULT_FEATURES.indexOf(feature) !== -1;
    }
}

export class SDanglingAnchorImpl extends SConnectableElementImpl {
    static readonly DEFAULT_FEATURES = [deletableFeature];

    original?: SModelElementImpl;
    override type = 'dangling-anchor';

    constructor() {
        super();
        this.size = { width: 0, height: 0 };
    }
}

export const edgeInProgressID = 'edge-in-progress';
export const edgeInProgressTargetHandleID = edgeInProgressID + '-target-anchor';
