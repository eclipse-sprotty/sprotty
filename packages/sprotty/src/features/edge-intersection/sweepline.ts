/********************************************************************************
 * Copyright (c) 2019 Rowan Winsemius and others.
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
// Based on the sweepline implementation at https://github.com/rowanwins/sweepline-intersections
// which is published under the terms of MIT, but has been adapted to the use case of sprotty.
import TinyQueue from "tinyqueue";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { PointToPointLine } from "../../utils/geometry";
import { Intersection } from "./intersection-finder";
import { RoutedPoint } from "../routing/routing";

/*
 * The algorithm implemented in this module is loosely based on the Bentley-Ottmann algorithm for
 * finding intersection among line segments in `O((n+k) log n)`, whereas `n` is the number of line
 * segments and `k` is the number of intersections.
 * The underlying idea is to use a imaginary sweep line that moves over the x/y plane and testing
 * only the line segments for intersection that the sweepline currently crosses, instead of
 * testing all segment with each other, which would be `O(n^2)`.
 * It does so by generating a prioritized event queue for start and end events of the line segments
 * and working its way through the queue (i.e., sweeping).
 * More information can be found at https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm
 * In contrast to the original Bently-Ottmann algorithm, the implementation below does not use a tree
 * data structure to store the segments in order to simplify the implementation.
 * See also https://github.com/rowanwins/sweepline-intersections#algorithm-notes
 */

/**
 * Add the specified `route` to the event `queue` from left to right.
 * @param routeId id of the route.
 * @param route the route as array of points.
 * @param queue the queue to add the route to.
 */
export function addRoute(routeId: string, route: RoutedPoint[], queue: TinyQueue<SweepEvent>) {
    if (route.length < 1) return;
    let currentPoint = route[0];
    let nextPoint = undefined;
    for (let i = 0; i < route.length - 1; i++) {
        nextPoint = route[i + 1];

        const e1 = new SweepEvent(routeId, currentPoint, i);
        const e2 = new SweepEvent(routeId, nextPoint, i + 1);

        e1.otherEvent = e2;
        e2.otherEvent = e1;

        if (checkWhichEventIsLeft(e1, e2) > 0) {
            e2.isLeftEndpoint = true;
            e1.isLeftEndpoint = false;
        } else {
            e1.isLeftEndpoint = true;
            e2.isLeftEndpoint = false;
        }
        queue.push(e1);
        queue.push(e2);

        currentPoint = nextPoint;
    }
}

/**
 * Returns which of the two events is left.
 * This is used to classify the endpoints of a segment when generating the
 * event queue.
 */
export function checkWhichEventIsLeft(e1: SweepEvent, e2: SweepEvent): 1 | -1 {
    if (e1.point.x > e2.point.x) return 1;
    if (e1.point.x < e2.point.x) return -1;
    if (e1.point.y !== e2.point.y) return e1.point.y > e2.point.y ? 1 : -1;
    return 1;
}

/**
 * An event -- or with other words a start or end point of a segment -- in the context
 * of the event queue for the sweep.
 *
 * Stores the original Sprotty `edgeId` and the segment index of this segment in the edge
 * to keep track of which edge and segment this event originated from.
 */
export class SweepEvent {
    otherEvent: SweepEvent;
    isLeftEndpoint: boolean;
    constructor(readonly edgeId: string, readonly point: Point, readonly segmentIndex: number) { }
}

/**
 * A line segment consists of a start and a stop event.
 */
export class Segment {
    readonly leftSweepEvent: SweepEvent;
    readonly rightSweepEvent: SweepEvent;
    constructor(event: SweepEvent) {
        this.leftSweepEvent = event;
        this.rightSweepEvent = event.otherEvent;
    }
}

/**
 * Performs the main sweep algorithm on the specified event queue.
 *
 * An empty priority queue is created to store segments encountered.
 * An item is removed from the priority queue if the vertex is the left endpoint
 * of a segment, we test it against every other segment in the segment queue for
 * intersections with any intersection recorded. We then add the vertex (and it's
 * associated right endpoint) to the segment queue.
 * If we encounter a right endpoint we remove the first item from the segment queue.
 *
 * Each pair of segments are only tested once. And only segments that overlap on the
 * x plane are tested against each other.
 *
 * @param eventQueue the event queue.
 * @returns the identified intersections.
 */
export function runSweep(eventQueue: TinyQueue<SweepEvent>): Intersection[] {
    const intersectionPoints: Intersection[] = [];
    const outQueue = new TinyQueue<Segment>([], checkWhichSegmentHasRightEndpointFirst);
    while (eventQueue.length) {
        const event = eventQueue.pop();
        if (event?.isLeftEndpoint) {
            const segment = new Segment(event);
            for (let i = 0; i < outQueue.data.length; i++) {
                const otherSegment = outQueue.data[i];
                const intersection = intersectionOfSegments(segment, otherSegment);
                if (intersection) {
                    intersectionPoints.push(
                        <Intersection>{
                            routable1: event.edgeId,
                            routable2: otherSegment.leftSweepEvent.edgeId,
                            segmentIndex1: getSegmentIndex(segment),
                            segmentIndex2: getSegmentIndex(otherSegment),
                            intersectionPoint: intersection
                        }
                    );
                }
            }
            outQueue.push(segment);
        } else if (event?.isLeftEndpoint === false) {
            outQueue.pop();
        }
    }
    return intersectionPoints;
}

/**
 * Specifies which of the two specified segments has a right endpoint first.
 * Used as a comparator to sort the event queue.
 */
export function checkWhichSegmentHasRightEndpointFirst(seg1: Segment, seg2: Segment): 1 | -1 {
    if (seg1.rightSweepEvent.point.x > seg2.rightSweepEvent.point.x) return 1;
    if (seg1.rightSweepEvent.point.x < seg2.rightSweepEvent.point.x) return -1;
    if (seg1.rightSweepEvent.point.y !== seg2.rightSweepEvent.point.y) return seg1.rightSweepEvent.point.y < seg2.rightSweepEvent.point.y ? 1 : -1;
    return 1;
}

export function getSegmentIndex(segment: Segment): number {
    return Math.min(segment.leftSweepEvent.segmentIndex, segment.rightSweepEvent.segmentIndex);
}

/**
 * Tests whether two segments intersect and returns the intersection point if existing.
 */
export function intersectionOfSegments(seg1: Segment, seg2: Segment): Point | undefined {
    if (seg1.leftSweepEvent.edgeId === seg2.leftSweepEvent.edgeId) {
        return undefined;
    }
    const seg1Line = new PointToPointLine(seg1.leftSweepEvent.point, seg1.rightSweepEvent.point);
    const seg2Line = new PointToPointLine(seg2.leftSweepEvent.point, seg2.rightSweepEvent.point);
    return seg1Line.intersection(seg2Line);
}
