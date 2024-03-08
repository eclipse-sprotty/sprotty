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
    /** Map of edges as SEdgeImpl for faster lookup by id */
    protected edgesMap: Map<string, SEdgeImpl> = new Map();
    /** Map of unique edges ids with the same source */
    protected sourcesMap: Map<string, Set<string>> = new Map();
    /** Map of unique edges ids with the same target */
    protected targetsMap: Map<string, Set<string>> = new Map();

    apply(routing: EdgeRouting, parent: SParentElementImpl): void {
        this.findJunctions(routing, parent);
    }

    protected findJunctions(routing: EdgeRouting, parent: SParentElementImpl) {
        // gather all edges from the parent
        const edges = Array.from(parent.index.all().filter(child => child instanceof SEdgeImpl)) as SEdgeImpl[];

        // populate the maps for faster lookup
        edges.forEach(edge => {
            this.edgesMap.set(edge.id, edge);
            const sameSources = this.sourcesMap.get(edge.sourceId);
            if (sameSources) {
                sameSources.add(edge.id);
            } else {
                this.sourcesMap.set(edge.sourceId, new Set([edge.id]));
            }

            const sameTargets = this.targetsMap.get(edge.targetId);
            if (sameTargets) {
                sameTargets.add(edge.id);
            } else {
                this.targetsMap.set(edge.targetId, new Set([edge.id]));
            }
        });

        routing.routes.forEach((route, routeId) => {
            // for each route we find the corresponding edge from the edges map by matching the route id and the edge id
            const edge = this.edgesMap.get(routeId);
            if (!edge) {
                return;
            }

            // find the junction points for edges with the same source
            this.findJunctionPointsWithSameSource(edge, route, routing);

            // find the junction points for edges with the same target
            this.findJunctionPointsWithSameTarget(edge, route, routing);
        });
    }

    /**
     * Finds the junction points of routes with the same source
     */
    protected findJunctionPointsWithSameSource(edge: SEdgeImpl, route: RoutedPoint[], routing: EdgeRouting) {
        // get an array of edge/route ids with the same source as the current edge, excluding the current edge
        const sourcesSet = this.sourcesMap.get(edge.sourceId);
        if (!sourcesSet) {
            return;
        }
        const otherRoutesIds = Array.from(sourcesSet).filter(id => id !== edge.id);
        const otherRoutes = otherRoutesIds.map(id => routing.get(id)).filter(r => r !== undefined) as RoutedPoint[][];


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
    protected findJunctionPointsWithSameTarget(edge: SEdgeImpl, route: RoutedPoint[], routing: EdgeRouting) {
        // get an array of edge/route ids with the same target as the current edge, excluding the current edge
        const targetsSet = this.targetsMap.get(edge.targetId);
        if (!targetsSet) {
            return;
        }
        const otherRoutesIds = Array.from(targetsSet).filter(id => id !== edge.id);
        const otherRoutes = otherRoutesIds.map(id => routing.get(id)).filter(r => r !== undefined) as RoutedPoint[][];


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
    protected setJunctionPoints(route: RoutedPoint[], otherRoute: RoutedPoint[], junctionIndex: number) {
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
    protected setPreviousPointAsJunction(route: RoutedPoint[], sameSourceRoute: RoutedPoint[], junctionIndex: number) {
        route[junctionIndex - 1].isJunction = true;
        sameSourceRoute[junctionIndex - 1].isJunction = true;
    }

    /**
     * Get the main direction of a segment.
     * The main direction is the axis with the greatest difference between the two points.
     */
    protected getSegmentDirection(firstPoint: RoutedPoint, secondPoint: RoutedPoint) {
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
    protected getJunctionIndex(firstRoute: RoutedPoint[], secondRoute: RoutedPoint[]): number {
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
