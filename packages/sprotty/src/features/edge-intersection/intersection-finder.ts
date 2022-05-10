/********************************************************************************
 * Copyright (c) 2021-2022 EclipseSource and others.
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
import { Point } from "sprotty-protocol/lib/utils/geometry";
import TinyQueue from "tinyqueue";
import { EdgeRouting, IEdgeRoutePostprocessor, RoutedPoint } from "../routing/routing";
import { addRoute, checkWhichEventIsLeft, runSweep, SweepEvent } from "./sweepline";

export interface Intersection {
    readonly routable1: string;
    readonly segmentIndex1: number;
    readonly routable2: string;
    readonly segmentIndex2: number;
    readonly intersectionPoint: Point;
}

export interface IntersectingRoutedPoint extends RoutedPoint {
    intersections: Intersection[];
}

export function isIntersectingRoutedPoint(routedPoint: Point): routedPoint is IntersectingRoutedPoint {
    return routedPoint !== undefined && 'intersections' in routedPoint && 'kind' in routedPoint;
}

export const BY_X_THEN_Y = (a: Intersection, b: Intersection): number => {
    if (a.intersectionPoint.x === b.intersectionPoint.x) {
        return a.intersectionPoint.y - b.intersectionPoint.y;
    }
    return a.intersectionPoint.x - b.intersectionPoint.x;
};

export const BY_DESCENDING_X_THEN_Y = (a: Intersection, b: Intersection): number => {
    if (a.intersectionPoint.x === b.intersectionPoint.x) {
        return a.intersectionPoint.y - b.intersectionPoint.y;
    }
    return b.intersectionPoint.x - a.intersectionPoint.x;
};

export const BY_X_THEN_DESCENDING_Y = (a: Intersection, b: Intersection): number => {
    if (a.intersectionPoint.x === b.intersectionPoint.x) {
        return b.intersectionPoint.y - a.intersectionPoint.y;
    }
    return a.intersectionPoint.x - b.intersectionPoint.x;
};

export const BY_DESCENDING_X_THEN_DESCENDING_Y = (a: Intersection, b: Intersection): number => {
    if (a.intersectionPoint.x === b.intersectionPoint.x) {
        return b.intersectionPoint.y - a.intersectionPoint.y;
    }
    return b.intersectionPoint.x - a.intersectionPoint.x;
};

/**
 * Finds intersections among edges and updates routed points to reflect those intersections.
 *
 * This only yields correct intersections among straight line segments and doesn't work with bezier curves.
 */
@injectable()
export class IntersectionFinder implements IEdgeRoutePostprocessor {

    /**
     * Finds all intersections in the specified `routing` and replaces the `RoutedPoints` that are
     * intersecting by adding intersection information to routing points (@see `IntersectingRoutedPoints`).
     * @param routing the edge routing to find intersections for and update.
     */
    apply(routing: EdgeRouting) {
        const intersections = this.find(routing);
        this.addToRouting(intersections, routing);
    }

    /**
     * Finds the intersections in the specified `routing` and returns them.
     * @param routing the edge routing to find intersections for and update.
     * @returns the identified intersections.
     */
    find(routing: EdgeRouting): Intersection[] {
        const eventQueue = new TinyQueue<SweepEvent>(undefined, checkWhichEventIsLeft);
        routing.routes.forEach((route, routeId) => {
            if (this.isSupportedRoute(route)) {
                addRoute(routeId, route, eventQueue);
            }
        });
        return runSweep(eventQueue);
    }

    /**
     * Specifies whether or not a specific route should be included in this intersection search or not.
     *
     * As this intersection finder only supports linear line segments, this method only returns `true`
     * for routes that only contain routed points, which are either 'source', 'target' or 'linear'.
     */
    protected isSupportedRoute(route: RoutedPoint[]): boolean {
        return route.find(point => point.kind !== 'source' && point.kind !== 'target' && point.kind !== 'linear') === undefined;
    }

    protected addToRouting(intersections: Intersection[], routing: EdgeRouting) {
        for (const intersection of intersections) {
            const routable1 = routing.get(intersection.routable1);
            const routable2 = routing.get(intersection.routable2);
            this.addIntersectionToRoutedPoint(intersection, routable1, intersection.segmentIndex1);
            this.addIntersectionToRoutedPoint(intersection, routable2, intersection.segmentIndex2);
        }
    }

    private addIntersectionToRoutedPoint(intersection: Intersection, routedPoint: RoutedPoint[] | undefined, segmentIndex: number) {
        if (routedPoint && routedPoint.length > segmentIndex) {
            const segment = routedPoint[segmentIndex + 1];
            if (isIntersectingRoutedPoint(segment)) {
                segment.intersections.push(intersection);
            } else {
                const intersectingRoutedPoint = { ...segment, intersections: [intersection] };
                routedPoint[segmentIndex + 1] = intersectingRoutedPoint;
            }
        }
    }
}
