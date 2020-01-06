/********************************************************************************
 * Copyright (c) 2019-2020 TypeFox and others.
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

import { inject, injectable } from "inversify";
import { SModelElement, SParentElement } from "../../base/model/smodel";
import { translateBounds, translatePoint } from "../../base/model/smodel-utils";
import { Bounds, euclideanDistance, linear, Point } from "../../utils/geometry";
import { ResolvedHandleMove } from "../move/move";
import { RoutingHandleKind, SDanglingAnchor, SRoutingHandle, edgeInProgressID, edgeInProgressTargetHandleID } from "../routing/model";
import { AnchorComputerRegistry, IAnchorComputer } from "./anchor";
import { SConnectableElement, SRoutableElement } from "./model";
import { EdgeSnapshot, IEdgeRouter, RoutedPoint } from "./routing";

export interface LinearRouteOptions {
    minimalPointDistance: number
    standardDistance: number
    selfEdgeOffset: number
}

export enum Side { RIGHT, LEFT, TOP, BOTTOM }

export class DefaultAnchors {
    readonly bounds: Bounds;
    readonly left: RoutedPoint;
    readonly right: RoutedPoint;
    readonly top: RoutedPoint;
    readonly bottom: RoutedPoint;

    constructor(readonly element: SConnectableElement, edgeParent: SParentElement, readonly kind: 'source' | 'target') {
        const bounds = element.bounds;
        this.bounds = translateBounds(bounds, element.parent, edgeParent);
        this.left = { x: this.bounds.x, y: this.bounds.y + 0.5 * this.bounds.height, kind };
        this.right = { x: this.bounds.x + this.bounds.width, y: this.bounds.y + 0.5 * this.bounds.height, kind };
        this.top = { x: this.bounds.x + 0.5 * this.bounds.width, y: this.bounds.y, kind };
        this.bottom = { x: this.bounds.x + 0.5 * this.bounds.width, y: this.bounds.y + this.bounds.height, kind };
    }

    get(side: Side): RoutedPoint {
        return (this as any)[Side[side].toLowerCase()];
    }

    getNearestSide(point: Point): Side {
        const leftDistance = euclideanDistance(point, this.left);
        const rightDistance = euclideanDistance(point, this.right);
        const topDistance = euclideanDistance(point, this.top);
        const bottomDistance = euclideanDistance(point, this.bottom);
        let currentNearestSide = Side.LEFT;
        let currentMinDist = leftDistance;
        if (rightDistance < currentMinDist) {
            currentMinDist = rightDistance;
            currentNearestSide = Side.RIGHT;
        }
        if (topDistance < currentMinDist) {
            currentMinDist = topDistance;
            currentNearestSide = Side.TOP;
        }
        if (bottomDistance < currentMinDist) {
            currentMinDist = bottomDistance;
            currentNearestSide = Side.BOTTOM;
        }
        return currentNearestSide;
    }
}

@injectable()
export abstract class LinearEdgeRouter implements IEdgeRouter {

    @inject(AnchorComputerRegistry) anchorRegistry: AnchorComputerRegistry;

    abstract get kind(): string;

    abstract route(edge: SRoutableElement): RoutedPoint[];

    abstract createRoutingHandles(edge: SRoutableElement): void;

    protected abstract getOptions(edge: SRoutableElement): LinearRouteOptions;

    pointAt(edge: SRoutableElement, t: number): Point | undefined {
        const segments = this.calculateSegment(edge, t);
        if (!segments)
            return undefined;
        const { segmentStart, segmentEnd, lambda } = segments;
        return linear(segmentStart, segmentEnd, lambda);
    }

    derivativeAt(edge: SRoutableElement, t: number): Point | undefined {
        const segments = this.calculateSegment(edge, t);
        if (!segments)
            return undefined;
        const { segmentStart, segmentEnd } = segments;
        return {
            x: segmentEnd.x - segmentStart.x,
            y: segmentEnd.y - segmentStart.y
        };
    }

    protected calculateSegment(edge: SRoutableElement, t: number): { segmentStart: Point, segmentEnd: Point, lambda: number} | undefined {
        if (t < 0 || t > 1)
            return undefined;
        const routedPoints = this.route(edge);
        if (routedPoints.length < 2)
            return undefined;
        const segmentLengths: number[] = [];
        let totalLength = 0;
        for (let i = 0; i < routedPoints.length - 1; ++i) {
            segmentLengths[i] = euclideanDistance(routedPoints[i], routedPoints[i + 1]);
            totalLength += segmentLengths[i];
        }
        let currentLenght = 0;
        const tAsLenght = t * totalLength;
        for (let i = 0; i < routedPoints.length - 1; ++i) {
            const newLength = currentLenght + segmentLengths[i];
            // avoid division by (almost) zero
            if (segmentLengths[i] > 1E-8) {
                if (newLength >= tAsLenght) {
                    const lambda = Math.max(0, (tAsLenght - currentLenght)) / segmentLengths[i];
                    return {
                        segmentStart: routedPoints[i],
                        segmentEnd: routedPoints[i + 1],
                        lambda
                    };
                }
            }
            currentLenght = newLength;
        }
        return {
            segmentEnd: routedPoints.pop()!,
            segmentStart: routedPoints.pop()!,
            lambda: 1
        };
    }

    protected addHandle(edge: SRoutableElement, kind: RoutingHandleKind, type: string, routingPointIndex: number): SRoutingHandle {
        const handle = new SRoutingHandle();
        handle.kind = kind;
        handle.pointIndex = routingPointIndex;
        handle.type = type;
        if (kind === 'target' && edge.id === edgeInProgressID)
            handle.id = edgeInProgressTargetHandleID;
        edge.add(handle);
        return handle;
    }

    getHandlePosition(edge: SRoutableElement, route: RoutedPoint[], handle: SRoutingHandle): Point | undefined {
        switch (handle.kind) {
            case 'source':
                if (edge.source instanceof SDanglingAnchor)
                    return edge.source.position;
                else
                    return route[0];
            case 'target':
                if (edge.target instanceof SDanglingAnchor)
                    return edge.target.position;
                 else {
                    return route[route.length - 1];
                }
            default:
                const position = this.getInnerHandlePosition(edge, route, handle);
                if (position !== undefined)
                    return position;
                if (handle.pointIndex >= 0 && handle.pointIndex < edge.routingPoints.length)
                    return edge.routingPoints[handle.pointIndex];
        }
        return undefined;
    }

    protected abstract getInnerHandlePosition(edge: SRoutableElement, route: RoutedPoint[], handle: SRoutingHandle): Point | undefined;

    protected findRouteSegment(edge: SRoutableElement, route: RoutedPoint[], handleIndex: number): { start?: Point, end?: Point } {
        const getIndex = (rp: RoutedPoint) => {
            if (rp.pointIndex !== undefined)
                return rp.pointIndex;
            else if (rp.kind === 'target')
                return edge.routingPoints.length;
            else
                return -2;
        };
        let start, end: RoutedPoint | undefined;
        for (const rp of route) {
            const i = getIndex(rp);
            if (i <= handleIndex && (start === undefined || i > getIndex(start)))
                start = rp;
            if (i > handleIndex && (end === undefined || i < getIndex(end)))
                end = rp;
        }
        return { start, end };
    }

    getTranslatedAnchor(connectable: SConnectableElement, refPoint: Point, refContainer: SParentElement, edge: SRoutableElement, anchorCorrection: number = 0): Point {
        const translatedRefPoint = translatePoint(refPoint, refContainer, connectable.parent);
        const anchorComputer = this.getAnchorComputer(connectable);
        const strokeCorrection = 0.5 * connectable.strokeWidth;
        const anchor = anchorComputer.getAnchor(connectable, translatedRefPoint, anchorCorrection + strokeCorrection);
        return translatePoint(anchor, connectable.parent, edge.parent);
    }

    protected getAnchorComputer(connectable: SConnectableElement): IAnchorComputer {
       return this.anchorRegistry.get(this.kind, connectable.anchorKind);
    }

    applyHandleMoves(edge: SRoutableElement, moves: ResolvedHandleMove[]): void {
        const remainingMoves = moves.slice();
        moves.forEach(move => {
            const handle = move.handle;
            if (handle.kind === 'source' && !(edge.source instanceof SDanglingAnchor)) {
                // detach source
                const anchor = new SDanglingAnchor();
                anchor.id = edge.id + '_dangling-source';
                anchor.original = edge.source;
                anchor.position = move.toPosition;
                handle.root.add(anchor);
                handle.danglingAnchor = anchor;
                edge.sourceId = anchor.id;
            } else if (handle.kind === 'target' && !(edge.target instanceof SDanglingAnchor)) {
                // detach target
                const anchor = new SDanglingAnchor();
                anchor.id = edge.id + '_dangling-target';
                anchor.original = edge.target;
                anchor.position = move.toPosition;
                handle.root.add(anchor);
                handle.danglingAnchor = anchor;
                edge.targetId = anchor.id;
            }
            if (handle.danglingAnchor) {
                handle.danglingAnchor.position = move.toPosition;
                remainingMoves.splice(remainingMoves.indexOf(move), 1);
            }
        });
        if (remainingMoves.length > 0)
            this.applyInnerHandleMoves(edge, remainingMoves);
        this.cleanupRoutingPoints(edge, edge.routingPoints, true, true);
    }

    protected abstract applyInnerHandleMoves(edge: SRoutableElement, moves: ResolvedHandleMove[]): void;

    cleanupRoutingPoints(edge: SRoutableElement, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean) {
        const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, "source");
        const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, "target");
        this.resetRoutingPointsOnReconnect(edge, routingPoints, updateHandles, sourceAnchors, targetAnchors);
    }

    protected resetRoutingPointsOnReconnect(edge: SRoutableElement, routingPoints: Point[], updateHandles: boolean,
        sourceAnchors: DefaultAnchors, targetAnchors: DefaultAnchors): boolean {
        if (routingPoints.length === 0 || edge.source instanceof SDanglingAnchor || edge.target instanceof SDanglingAnchor) {
            const options = this.getOptions(edge);
            const corners = this.calculateDefaultCorners(edge, sourceAnchors, targetAnchors, options);
            routingPoints.splice(0, routingPoints.length, ...corners);
            if (updateHandles) {
                let maxPointIndex = -2;
                edge.children.forEach(child => {
                    if (child instanceof SRoutingHandle) {
                        if (child.kind === 'target')
                            child.pointIndex = routingPoints.length;
                        else if (child.kind === 'line' && child.pointIndex >= routingPoints.length)
                            edge.remove(child);
                        else
                            maxPointIndex = Math.max(child.pointIndex, maxPointIndex);
                    }
                });
                for (let i = maxPointIndex; i < routingPoints.length - 1; ++i)
                    this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', i);
            }
            return true;
        }
        return false;
    }

    applyReconnect(edge: SRoutableElement, newSourceId?: string, newTargetId?: string) {
        let hasChanged = false;
        if (newSourceId) {
            const newSource = edge.root.index.getById(newSourceId);
            if (newSource instanceof SConnectableElement) {
                edge.sourceId = newSource.id;
                hasChanged = true;
            }
        }
        if (newTargetId) {
            const newTarget = edge.root.index.getById(newTargetId);
            if (newTarget instanceof SConnectableElement) {
                edge.targetId = newTarget.id;
                hasChanged = true;
            }
        }
        if (hasChanged) {
            // reset attached elements in index
            edge.index.remove(edge);
            edge.index.add(edge);
            if (this.getSelfEdgeIndex(edge) > -1) {
                edge.routingPoints = [];
                this.cleanupRoutingPoints(edge, edge.routingPoints, true, true);
            }
        }
    }

    takeSnapshot(edge: SRoutableElement): EdgeSnapshot {
        return {
            routingPoints: edge.routingPoints.slice(),
            routingHandles: edge.children
                .filter(child => child instanceof SRoutingHandle)
                .map(child => child as SRoutingHandle),
            routedPoints: this.route(edge),
            router: this,
            source: edge.source,
            target: edge.target
        };
    }

    applySnapshot(edge: SRoutableElement, snapshot: EdgeSnapshot): void {
        edge.routingPoints = snapshot.routingPoints;
        edge.removeAll(child => child instanceof SRoutingHandle);
        edge.routerKind = snapshot.router.kind;
        snapshot.routingHandles.forEach(handle => edge.add(handle));
        if (snapshot.source)
            edge.sourceId = snapshot.source.id;
        if (snapshot.target)
            edge.targetId = snapshot.target.id;
        // update index
        edge.root.index.remove(edge as SModelElement);
        edge.root.index.add(edge as SModelElement);
    }

    protected calculateDefaultCorners(edge: SRoutableElement, sourceAnchors: DefaultAnchors, targetAnchors: DefaultAnchors, options: LinearRouteOptions): Point[] {
        const selfEdgeIndex = this.getSelfEdgeIndex(edge);
        if (selfEdgeIndex >= 0) {
            const standardDist = options.standardDistance;
            const delta = options.selfEdgeOffset * Math.min(sourceAnchors.bounds.width, sourceAnchors.bounds.height);
            switch (selfEdgeIndex % 4) {
                case 0:
                    return [
                        { x: sourceAnchors.get(Side.RIGHT).x + standardDist, y: sourceAnchors.get(Side.RIGHT).y + delta },
                        { x: sourceAnchors.get(Side.RIGHT).x + standardDist, y: sourceAnchors.get(Side.BOTTOM).y + standardDist },
                        { x: sourceAnchors.get(Side.BOTTOM).x + delta, y: sourceAnchors.get(Side.BOTTOM).y + standardDist },
                    ];
                case 1:
                    return [
                        { x: sourceAnchors.get(Side.BOTTOM).x - delta, y: sourceAnchors.get(Side.BOTTOM).y + standardDist },
                        { x: sourceAnchors.get(Side.LEFT).x - standardDist, y: sourceAnchors.get(Side.BOTTOM).y + standardDist },
                        { x: sourceAnchors.get(Side.LEFT).x - standardDist, y: sourceAnchors.get(Side.LEFT).y + delta},
                    ];
                case 2:
                    return [
                        { x: sourceAnchors.get(Side.LEFT).x - standardDist, y: sourceAnchors.get(Side.LEFT).y - delta },
                        { x: sourceAnchors.get(Side.LEFT).x - standardDist, y: sourceAnchors.get(Side.TOP).y - standardDist },
                        { x: sourceAnchors.get(Side.TOP).x - delta, y: sourceAnchors.get(Side.TOP).y - standardDist },
                    ];
                case 3:
                    return [
                        { x: sourceAnchors.get(Side.TOP).x + delta, y: sourceAnchors.get(Side.TOP).y - standardDist },
                        { x: sourceAnchors.get(Side.RIGHT).x + standardDist, y: sourceAnchors.get(Side.TOP).y - standardDist },
                        { x: sourceAnchors.get(Side.RIGHT).x + standardDist, y: sourceAnchors.get(Side.RIGHT).y - delta },
                    ];
            }
        }
        return [];
    }

    protected getSelfEdgeIndex(edge: SRoutableElement): number {
        if (!edge.source || edge.source !== edge.target)
            return -1;
        return edge.source.outgoingEdges
            .filter(otherEdge => otherEdge.target === edge.source)
            .indexOf(edge);
    }
}
