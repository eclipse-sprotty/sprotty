/********************************************************************************
 * Copyright (c) 2018-2021 TypeFox and others.
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

import { injectable, multiInject, optional } from "inversify";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { SParentElementImpl } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { findArgValue, IViewArgs } from "../../base/views/view";
import { InstanceRegistry } from "../../utils/registry";
import { ResolvedHandleMove } from "../move/move";
import { SRoutingHandleImpl } from "../routing/model";
import { SConnectableElementImpl, SRoutableElementImpl } from "./model";
import { PolylineEdgeRouter } from "./polyline-edge-router";

/**
 * A point describing the shape of an edge.
 *
 * The <code>RoutedPoints</code> of an edge are derived from the <code>routingPoints</code>
 * which plain <code>Points</code> stored in the SModel by the <code>IEdgeRouter</code>.
 * As opposed to the originals, they also contain the source and target anchor points.
 * The router may also add or remove points in order to satisfy the constraints
 * the constraints of the routing algorithm or in order to to filter out points which are
 * obsolete, e.g. to close to each other.
 */
export interface RoutedPoint extends Point {
    kind: 'source' | 'target' | 'linear' | 'bezier-control-before' | 'bezier-junction' | 'bezier-control-after'
    pointIndex?: number
}

/**
 * Stores the state of an edge at a specific time.
 */
export interface EdgeSnapshot {
    routingHandles: SRoutingHandleImpl[]
    routingPoints: Point[]
    routedPoints: RoutedPoint[]
    router: IEdgeRouter
    source?: SConnectableElementImpl
    target?: SConnectableElementImpl
}

export interface EdgeMemento {
    edge: SRoutableElementImpl
    before: EdgeSnapshot
    after: EdgeSnapshot
}

/**
 * Encapsulates the logic of how the actual shape of an edge is derived from its routing points,
 * and how the user can modify it.
 */
export interface IEdgeRouter {

    readonly kind: string;

    /**
     * Calculates the route of the given edge.
     */
    route(edge: SRoutableElementImpl): RoutedPoint[]

    /**
     * Finds the orthogonal intersection point between an edge and a given point in 2D space.
     *
     * @param edge - The edge to find the intersection point on.
     * @param point - The point to find the intersection with.
     * @returns The intersection point and its derivative on the respective edge segment.
     */
    findOrthogonalIntersection(edge: SRoutableElementImpl, point: Point): {point: Point, derivative: Point} | undefined

    /**
     * Calculates a point on the edge
     *
     * @param t a value between 0 (sourceAnchor) and 1 (targetAnchor)
     * @returns the point or undefined if t is out of bounds or it cannot be computed
     */
    pointAt(edge: SRoutableElementImpl, t: number): Point | undefined

    /**
     * Calculates the derivative at a point on the edge.
     *
     * @param t a value between 0 (sourceAnchor) and 1 (targetAnchor)
     * @returns the point or undefined if t is out of bounds or it cannot be computed
     */
    derivativeAt(edge: SRoutableElementImpl, t: number): Point | undefined

    /**
     * Retuns the position of the given handle based on the routing points of the edge.
     */
    getHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl): Point | undefined

    /**
     * Creates the routing handles for the given target.
     */
    createRoutingHandles(edge: SRoutableElementImpl): void

    /**
     * Updates the routing points and handles of the given edge with regard to the given moves.
     */
    applyHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void

    /**
     * Updates the routing points and handles of the given edge with regard to the given moves.
     */
    applyReconnect(edge: SRoutableElementImpl, newSourceId?: string, newTargetId?: string): void

    /**
     * Remove/add points in order to keep routing constraints consistent, or reset RPs on reconnect.
     */
    cleanupRoutingPoints(edge: SRoutableElementImpl, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean): void;
    /**
     * Creates a snapshot of the given edge, storing all the data needed to restore it to
     * its current state.
     */
    takeSnapshot(edge: SRoutableElementImpl): EdgeSnapshot;

    /**
     * Applies a snapshot to the current edge.
     */
    applySnapshot(edge: SRoutableElementImpl, edgeSnapshot: EdgeSnapshot): void;
}

export interface IMultipleEdgesRouter extends IEdgeRouter {
    routeAll(
        edges: SRoutableElementImpl[],
        parent: Readonly<SParentElementImpl>
    ): EdgeRouting;
}

function isMultipleEdgesRouter(
    router: IEdgeRouter | IMultipleEdgesRouter
): router is IMultipleEdgesRouter {
    return (router as IMultipleEdgesRouter).routeAll !== undefined;
}

/** A postprocessor that is applied to all routes, once they are computed. */
export interface IEdgeRoutePostprocessor {
    apply(routing: EdgeRouting): void;
}

@injectable()
export class EdgeRouterRegistry extends InstanceRegistry<IEdgeRouter> {

    @multiInject(TYPES.IEdgeRoutePostprocessor) @optional()
    protected postProcessors: IEdgeRoutePostprocessor[];

    constructor(@multiInject(TYPES.IEdgeRouter) edgeRouters: IEdgeRouter[]) {
        super();
        edgeRouters.forEach(router => this.register(router.kind, router));
    }

    protected get defaultKind() {
        return PolylineEdgeRouter.KIND;
    }

    override get(kind: string | undefined): IEdgeRouter {
        return super.get(kind || this.defaultKind);
    }

    /**
     * Computes the routes of all edges contained by the specified `parent`.
     * After all routes are available, it'll apply the registered `EdgeRoutePostProcessors`.
     * @param parent the parent to traverse for edges
     * @returns the routes of all edges that are children of `parent`
     */
    routeAllChildren(parent: Readonly<SParentElementImpl>): EdgeRouting {
        const routing = this.doRouteAllChildren(parent);
        for (const postProcessor of this.postProcessors) {
            postProcessor.apply(routing);
        }
        return routing;
    }

    /**
     * Recursively traverses the children of `parent`, collects children grouped by router kind,
     * and then routes them either.
     * @param parent the parent to traverse for edges
     * @returns the routes of all edges that are children of `parent`
     */
    protected doRouteAllChildren(parent: Readonly<SParentElementImpl>) {
        const routing = new EdgeRouting();
        const routersEdges = new Map<string, SRoutableElementImpl[]>();

        const elementsToProcess = [parent];
        while (elementsToProcess.length > 0) {
            const element = elementsToProcess.shift() as SParentElementImpl;
            for (const child of element.children) {
                if (child instanceof SRoutableElementImpl) {
                    const routerKind = child.routerKind || this.defaultKind;
                    if (routersEdges.has(routerKind)) {
                        (routersEdges.get(routerKind) as SRoutableElementImpl[]).push(child);
                    } else {
                        routersEdges.set(routerKind, [child]);
                    }
                }
                if (child instanceof SParentElementImpl) {
                    elementsToProcess.push(child);
                }
            }
        }

        routersEdges.forEach((edges, routerKind) => {
            const childRouter = this.get(routerKind);
            if (isMultipleEdgesRouter(childRouter)) {
                routing.setAll(childRouter.routeAll(edges, parent));
            } else {
                for (const edge of  edges) {
                    routing.set(edge.id, this.route(edge));
                }
            }
        });

        return routing;
    }

    /**
     * Computes or obtains the route of a single edge.
     * @param edge the edge to be routed
     * @param args arguments that may contain an `EdgeRouting` already
     * @returns the route of the specified `edge`
     */
    route(edge: Readonly<SRoutableElementImpl>, args?: IViewArgs): RoutedPoint[] {
        const edgeRouting = findArgValue<EdgeRouting>(args, 'edgeRouting');
        if (edgeRouting) {
            const route = edgeRouting.get(edge.id);
            if (route) {
                return route;
            }
        }
        const router = this.get(edge.routerKind);
        return router.route(edge);
    }

}

/** Any object that contains a routing, such as an argument object passed to views for rendering. */
export interface EdgeRoutingContainer {
    edgeRouting: EdgeRouting;
}

/**
 * Map of edges and their computed routes.
 */
export class EdgeRouting {

    protected routesMap = new Map<string, RoutedPoint[]>();

    set(routableId: string, route: RoutedPoint[]): void {
        this.routesMap.set(routableId, route);
    }

    setAll(otherRoutes: EdgeRouting): void {
        otherRoutes.routes.forEach((route, routableId) => this.set(routableId, route));
    }

    get(routableId: string): RoutedPoint[] | undefined {
        return this.routesMap.get(routableId);
    }

    get routes() {
        return this.routesMap;
    }

}
