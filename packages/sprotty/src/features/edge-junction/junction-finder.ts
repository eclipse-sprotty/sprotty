/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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

import { injectable } from "inversify";
import { SParentElementImpl } from "../../base/model/smodel";
import { SEdgeImpl } from "../../graph/sgraph";
import { EdgeRouting, IEdgeRoutePostprocessor, RoutedPoint } from "../routing/routing";

/**
 * Finds junction points in the edge routes. A junction point is a point where two or more edges split.
 * This excludes the source and target points of the edges.
 *
 * Only works with straight line segments.
 */
@injectable()
export class JunctionFinder implements IEdgeRoutePostprocessor {
    apply(routing: EdgeRouting, parent: SParentElementImpl): void {
        this.findJunctions(routing, parent);
    }

    findJunctions(routing: EdgeRouting, parent: SParentElementImpl) {
        // gather all edges from the parent
        const edges = parent.children.filter(child => child instanceof SEdgeImpl) as SEdgeImpl[];

        routing.routes.forEach((route, routeId) => {
            // for each route we find the corresponding edge from the model by matching the route id and the edge id
            const edge = edges.find(e => e.id === routeId);

            if (!edge) {
                return;
            }

            // we find all edges with the same source as the current edge, excluding the current edge
            const edgesWithSameSource = edges.filter(e => e.sourceId === edge.sourceId && e.id !== edge.id);
            // for each edge with the same source we find the corresponding route from the routing
            const routesWithSameSource: RoutedPoint[][] = [];
            edgesWithSameSource.forEach(e => {
                const foundRoute = routing.get(e.id);
                if (!foundRoute) {
                    return;
                }
                routesWithSameSource.push(foundRoute);
            });

            // if there are any routes with the same source, we find the junction points
            if (routesWithSameSource.length > 0) {
                this.findJunctionPointsWithSameSource(route, routesWithSameSource);
            }

            // we find all edges with the same target as the current edge, excluding the current edge
            const edgesWithSameTarget = edges.filter(e => e.targetId === edge.targetId && e.id !== edge.id);
            // for each edge with the same target we find the corresponding route from the routing
            const routesWithSameTarget: RoutedPoint[][] = [];
            edgesWithSameTarget.forEach(e => {
                const routeOfGivenEdge = routing.get(e.id);
                if (!routeOfGivenEdge) {
                    return;
                }
                routesWithSameTarget.push(routeOfGivenEdge);
            });

            // if there are any routes with the same target, we find the junction points
            if (routesWithSameTarget.length > 0) {
                this.findJunctionPointsWithSameTarget(route, routesWithSameTarget);
            }
        });


    }

    /**
     * Finds the junction points of routes with the same source
     */
    findJunctionPointsWithSameSource(route: RoutedPoint[], otherRoutes: RoutedPoint[][]) {
        for (const otherRoute of otherRoutes) {
            // finds the index where the two routes diverge
            const junctionIndex: number = this.getJunctionIndex(route, otherRoute);

            // if no junction point has been found (i.e. the routes are identical)
            // or if the junction point is the first point of the routes (i.e the routes diverge at the source)
            // we can skip this route
            if (junctionIndex === -1 || junctionIndex === 0) {
                continue;
            }

            this.setJunctionPoints(route, otherRoute, junctionIndex);
        }
    }

    /**
     * Finds the junction points of routes with the same target
     */
    findJunctionPointsWithSameTarget(route: RoutedPoint[], otherRoutes: RoutedPoint[][]) {
        // we reverse the route so that the target is considered the source for the algorithm
        route.reverse();
        for (const otherRoute of otherRoutes) {
            // we reverse the other route so that the target is considered the source for the algorithm
            otherRoute.reverse();
            // finds the index where the two routes diverge
            const junctionIndex: number = this.getJunctionIndex(route, otherRoute);

            // if no junction point has been found (i.e. the routes are identical)
            // or if the junction point is the first point of the routes (i.e the routes diverge at the source)
            // we can skip this route
            if (junctionIndex === -1 || junctionIndex === 0) {
                continue;
            }
            this.setJunctionPoints(route, otherRoute, junctionIndex);
            // we reverse the other route back to its original order
            otherRoute.reverse();
        }
        // we reverse the route back to their original order
        route.reverse();
    }

    /**
     * Set the junction points of two routes according to the segments direction.
     * If the segments have different directions, the junction point is the previous common point.
     * If the segments have the same direction, the junction point is the point with the greatest or lowest value axis value depending on the direction.
     */
    setJunctionPoints(route: RoutedPoint[], otherRoute: RoutedPoint[], junctionIndex: number) {
        const firstSegmentDirection = this.getSegmentDirection(route[junctionIndex - 1], route[junctionIndex]);
        const secondSegmentDirection = this.getSegmentDirection(otherRoute[junctionIndex - 1], otherRoute[junctionIndex]);

        // if the two segments have different directions, then the previous common point is the junction point
        if (firstSegmentDirection !== secondSegmentDirection) {
            this.setPreviousPointAsJunction(route, otherRoute, junctionIndex);
        } else { // the two segments have the same direction

            if (firstSegmentDirection === 'left' || firstSegmentDirection === 'right') {
                // if the segments are going horizontally, but their y values are different, then the previous common point is the junction point
                if (route[junctionIndex].y !== otherRoute[junctionIndex].y) {
                    this.setPreviousPointAsJunction(route, otherRoute, junctionIndex);
                    return;
                }
                // depending on the direction, the junction point is the point with the greatest or lowest x value
                route[junctionIndex].isJunction = firstSegmentDirection === 'left' ?
                 route[junctionIndex].x > otherRoute[junctionIndex].x
                 : route[junctionIndex].x < otherRoute[junctionIndex].x;

                otherRoute[junctionIndex].isJunction = firstSegmentDirection === 'left' ?
                    otherRoute[junctionIndex].x > route[junctionIndex].x
                    : otherRoute[junctionIndex].x < route[junctionIndex].x;

            } else {
                // if the segments are going vertically, but their x values are different, then the previous common point is the junction point
                if (route[junctionIndex].x !== otherRoute[junctionIndex].x) {
                    this.setPreviousPointAsJunction(route, otherRoute, junctionIndex);
                    return;
                }
                // depending on the direction, the junction point is the point with the greatest or lowest y value
                route[junctionIndex].isJunction = firstSegmentDirection === 'up' ?
                    route[junctionIndex].y > otherRoute[junctionIndex].y
                    : route[junctionIndex].y < otherRoute[junctionIndex].y;

                otherRoute[junctionIndex].isJunction = firstSegmentDirection === 'up' ?
                    otherRoute[junctionIndex].y > route[junctionIndex].y
                    : otherRoute[junctionIndex].y < route[junctionIndex].y;
            }
        }
    }

    /**
     * Set the previous point as a junction point.
     * This is used when two segments have the same direction but the other axis is different.
     * For example if the routes are going in opposite directions, or if the route don't split orthogonally.
     */
    setPreviousPointAsJunction(route: RoutedPoint[], sameSourceRoute: RoutedPoint[], junctionIndex: number) {
        route[junctionIndex - 1].isJunction = true;
        sameSourceRoute[junctionIndex - 1].isJunction = true;
    }

    /**
     * Get the main direction of a segment.
     * The main direction is the axis with the greatest difference between the two points.
     */
    getSegmentDirection(firstPoint: RoutedPoint, secondPoint: RoutedPoint) {
        const dX = secondPoint.x - firstPoint.x;
        const dY = secondPoint.y - firstPoint.y;

        let mainDirection = 'horizontal';
        if (Math.abs(dX) < Math.abs(dY)) {
            mainDirection = 'vertical';
        }

        if (mainDirection === 'horizontal') {
            if (dX > 0) {
                return 'right';
            } else {
                return 'left';
            }
        } else {
            if (dY > 0) {
                return 'down';
            } else {
                return 'up';
            }
        }
    }

    /**
     * Finds the index where two routes diverge.
     * Returns -1 if no divergence can be found.
     */
    getJunctionIndex(firstRoute: RoutedPoint[], secondRoute: RoutedPoint[]): number {
        let idx = 0;
        while (idx < firstRoute.length && idx < secondRoute.length) {
            if (firstRoute[idx].x !== secondRoute[idx].x
                || firstRoute[idx].y !== secondRoute[idx].y) {
                return idx;
            }
            idx++;
        }
        return -1;
    }
}
