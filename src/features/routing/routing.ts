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

import { Point } from "../../utils/geometry";
import { SRoutableElement, SConnectableElement } from "./model";
import { InstanceRegistry } from "../../utils/registry";
import { PolylineEdgeRouter } from "./polyline-edge-router";
import { injectable, multiInject } from "inversify";
import { ResolvedHandleMove } from "../move/move";
import { SRoutingHandle } from "../routing/model";
import { TYPES } from "../../base/types";

export interface RoutedPoint extends Point {
    kind: 'source' | 'target' | 'linear'
    pointIndex?: number
}

export interface EdgeSnapshot {
    routingHandles: SRoutingHandle[]
    routingPoints: Point[]
    router: IEdgeRouter
    source?: SConnectableElement
    target?: SConnectableElement
}

export interface EdgeMemento {
    edge: SRoutableElement
    before: EdgeSnapshot
    after: EdgeSnapshot
}

export interface IEdgeRouter {

    readonly kind: string;

    /**
     * Calculates the route of the given edge.
     *
     * @param edge
     */
    route(edge: SRoutableElement): RoutedPoint[]

    /**
     * Calculates a point on the edge
     *
     * @param edge
     * @param t a value between 0 (sourceAnchor) and 1 (targetAnchor)
     * @returns the point or undefined if t is out of bounds or it cannot be computed
     */
    pointAt(edge: SRoutableElement, t: number): Point | undefined

    /**
     * Calculates the derivative at a point on the edge.
     *
     * @param edge
     * @param t a value between 0 (sourceAnchor) and 1 (targetAnchor)
     * @returns the point or undefined if t is out of bounds or it cannot be computed
     */
    derivativeAt(edge: SRoutableElement, t: number): Point | undefined

    /**
     * Retuns the position of the given handle based on the routing points of the edge.
     *
     * @param edge
     * @param handle
     */
    getHandlePosition(edge: SRoutableElement, route: RoutedPoint[], handle: SRoutingHandle): Point | undefined

    /**
     * Creates the routing handles for the given target.
     *
     * @param edge
     */
    createRoutingHandles(edge: SRoutableElement): void

    /**
     * Updates the routing points and handles of the given edge with regard to the given moves.
     *
     * @param edge
     */
    applyHandleMoves(edge: SRoutableElement, moves: ResolvedHandleMove[]): void

    /**
     * Updates the routing points and handles of the given edge with regard to the given moves.
     *
     * @param edge
     */
    applyReconnect(edge: SRoutableElement, newSourceId?: string, newTargetId?: string): void

    /**
     * Creates a snapshot of the given edge, storing all the data needed to restore it to
     * its current state.
     *
     * @param edge
     */
    takeSnapshot(edge: SRoutableElement): EdgeSnapshot;

    /**
     * Applies a snapshot to the current edge.
     *
     * @param edge
     */
    applySnapshot(edge: SRoutableElement, edgeSnapshot: EdgeSnapshot): void;
}


@injectable()
export class EdgeRouterRegistry extends InstanceRegistry<IEdgeRouter> {

    constructor(@multiInject(TYPES.IEdgeRouter) edgeRouters: IEdgeRouter[]) {
        super();
        edgeRouters.forEach(router => this.register(router.kind, router));
    }

    protected get defaultKind() {
        return PolylineEdgeRouter.KIND;
    }

    get(kind: string | undefined): IEdgeRouter {
        return super.get(kind || this.defaultKind);
    }
}
