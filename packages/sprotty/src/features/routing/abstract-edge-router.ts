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
import { Bounds, Point } from "sprotty-protocol/lib/utils/geometry";
import { SModelElementImpl, SParentElementImpl } from "../../base/model/smodel";
import { translateBounds, translatePoint } from "../../base/model/smodel-utils";
import { ResolvedHandleMove } from "../move/move";
import { RoutingHandleKind, SDanglingAnchorImpl, SRoutingHandleImpl, edgeInProgressID, edgeInProgressTargetHandleID } from "./model";
import { AnchorComputerRegistry, IAnchorComputer } from "./anchor";
import { SConnectableElementImpl, SRoutableElementImpl } from "./model";
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

    constructor(readonly element: SConnectableElementImpl, edgeParent: SParentElementImpl, readonly kind: 'source' | 'target') {
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
        const leftDistance = Point.euclideanDistance(point, this.left);
        const rightDistance = Point.euclideanDistance(point, this.right);
        const topDistance = Point.euclideanDistance(point, this.top);
        const bottomDistance = Point.euclideanDistance(point, this.bottom);
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
export abstract class AbstractEdgeRouter implements IEdgeRouter {

    @inject(AnchorComputerRegistry) anchorRegistry: AnchorComputerRegistry;

    abstract get kind(): string;

    abstract route(edge: SRoutableElementImpl): RoutedPoint[];

    abstract createRoutingHandles(edge: SRoutableElementImpl): void;

    protected abstract getOptions(edge: SRoutableElementImpl): LinearRouteOptions;

    pointAt(edge: SRoutableElementImpl, t: number): Point | undefined {
        const segments = this.calculateSegment(edge, t);
        if (!segments)
            return undefined;
        const { segmentStart, segmentEnd, lambda } = segments;
        return Point.linear(segmentStart, segmentEnd, lambda);
    }

    derivativeAt(edge: SRoutableElementImpl, t: number): Point | undefined {
        const segments = this.calculateSegment(edge, t);
        if (!segments)
            return undefined;
        const { segmentStart, segmentEnd } = segments;
        return {
            x: segmentEnd.x - segmentStart.x,
            y: segmentEnd.y - segmentStart.y
        };
    }

    protected calculateSegment(edge: SRoutableElementImpl, t: number): { segmentStart: Point, segmentEnd: Point, lambda: number} | undefined {
        if (t < 0 || t > 1)
            return undefined;
        const routedPoints = this.route(edge);
        if (routedPoints.length < 2)
            return undefined;
        const segmentLengths: number[] = [];
        let totalLength = 0;
        for (let i = 0; i < routedPoints.length - 1; ++i) {
            segmentLengths[i] = Point.euclideanDistance(routedPoints[i], routedPoints[i + 1]);
            totalLength += segmentLengths[i];
        }
        let currentLenght = 0;
        const tAsLenght = t * totalLength;
        for (let i = 0; i < routedPoints.length - 1; ++i) {
            const newLength = currentLenght + segmentLengths[i];
            // avoid division by (almost) zero
            if (segmentLengths[i] > 1E-8) {
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

    protected addHandle(edge: SRoutableElementImpl, kind: RoutingHandleKind, type: string, routingPointIndex: number): SRoutingHandleImpl {
        const handle = new SRoutingHandleImpl();
        handle.kind = kind;
        handle.pointIndex = routingPointIndex;
        handle.type = type;
        if (kind === 'target' && edge.id === edgeInProgressID)
            handle.id = edgeInProgressTargetHandleID;
        edge.add(handle);
        return handle;
    }

    getHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl): Point | undefined {
        switch (handle.kind) {
            case 'source':
                if (edge.source instanceof SDanglingAnchorImpl)
                    return edge.source.position;
                else
                    return route[0];
            case 'target':
                if (edge.target instanceof SDanglingAnchorImpl)
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

    protected abstract getInnerHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl): Point | undefined;

    protected findRouteSegment(edge: SRoutableElementImpl, route: RoutedPoint[], handleIndex: number): { start?: Point, end?: Point } {
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

    getTranslatedAnchor(connectable: SConnectableElementImpl, refPoint: Point, refContainer: SParentElementImpl, edge: SRoutableElementImpl, anchorCorrection: number = 0): Point {
        const translatedRefPoint = translatePoint(refPoint, refContainer, connectable.parent);
        const anchorComputer = this.getAnchorComputer(connectable);
        const strokeCorrection = 0.5 * connectable.strokeWidth;
        const anchor = anchorComputer.getAnchor(connectable, translatedRefPoint, anchorCorrection + strokeCorrection);
        return translatePoint(anchor, connectable.parent, edge.parent);
    }

    protected getAnchorComputer(connectable: SConnectableElementImpl): IAnchorComputer {
       return this.anchorRegistry.get(this.kind, connectable.anchorKind);
    }

    applyHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void {
        const remainingMoves = moves.slice();
        moves.forEach(move => {
            const handle = move.handle;
            if (handle.kind === 'source' && !(edge.source instanceof SDanglingAnchorImpl)) {
                // detach source
                const anchor = new SDanglingAnchorImpl();
                anchor.id = edge.id + '_dangling-source';
                anchor.original = edge.source;
                anchor.position = move.toPosition;
                handle.root.add(anchor);
                handle.danglingAnchor = anchor;
                edge.sourceId = anchor.id;
            } else if (handle.kind === 'target' && !(edge.target instanceof SDanglingAnchorImpl)) {
                // detach target
                const anchor = new SDanglingAnchorImpl();
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

    protected abstract applyInnerHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void;

    cleanupRoutingPoints(edge: SRoutableElementImpl, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean) {
        const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, "source");
        const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, "target");
        this.resetRoutingPointsOnReconnect(edge, routingPoints, updateHandles, sourceAnchors, targetAnchors);
    }

    protected resetRoutingPointsOnReconnect(edge: SRoutableElementImpl, routingPoints: Point[], updateHandles: boolean,
        sourceAnchors: DefaultAnchors, targetAnchors: DefaultAnchors): boolean {
        if (routingPoints.length === 0 || edge.source instanceof SDanglingAnchorImpl || edge.target instanceof SDanglingAnchorImpl) {
            const options = this.getOptions(edge);
            const corners = this.calculateDefaultCorners(edge, sourceAnchors, targetAnchors, options);
            routingPoints.splice(0, routingPoints.length, ...corners);
            if (updateHandles) {
                let maxPointIndex = -2;
                edge.children.forEach(child => {
                    if (child instanceof SRoutingHandleImpl) {
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

    applyReconnect(edge: SRoutableElementImpl, newSourceId?: string, newTargetId?: string) {
        let hasChanged = false;
        if (newSourceId) {
            const newSource = edge.root.index.getById(newSourceId);
            if (newSource instanceof SConnectableElementImpl) {
                edge.sourceId = newSource.id;
                hasChanged = true;
            }
        }
        if (newTargetId) {
            const newTarget = edge.root.index.getById(newTargetId);
            if (newTarget instanceof SConnectableElementImpl) {
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

    takeSnapshot(edge: SRoutableElementImpl): EdgeSnapshot {
        return {
            routingPoints: edge.routingPoints.slice(),
            routingHandles: edge.children
                .filter(child => child instanceof SRoutingHandleImpl)
                .map(child => child as SRoutingHandleImpl),
            routedPoints: this.route(edge),
            router: this,
            source: edge.source,
            target: edge.target
        };
    }

    applySnapshot(edge: SRoutableElementImpl, snapshot: EdgeSnapshot): void {
        edge.routingPoints = snapshot.routingPoints;
        edge.removeAll(child => child instanceof SRoutingHandleImpl);
        edge.routerKind = snapshot.router.kind;
        snapshot.routingHandles.forEach(handle => edge.add(handle));
        if (snapshot.source)
            edge.sourceId = snapshot.source.id;
        if (snapshot.target)
            edge.targetId = snapshot.target.id;
        // update index
        edge.root.index.remove(edge as SModelElementImpl);
        edge.root.index.add(edge as SModelElementImpl);
    }

    protected calculateDefaultCorners(edge: SRoutableElementImpl, sourceAnchors: DefaultAnchors, targetAnchors: DefaultAnchors, options: LinearRouteOptions): Point[] {
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

    protected getSelfEdgeIndex(edge: SRoutableElementImpl): number {
        if (!edge.source || edge.source !== edge.target)
            return -1;
        return edge.source.outgoingEdges
            .filter(otherEdge => otherEdge.target === edge.source)
            .indexOf(edge);
    }

    protected commitRoute(edge: SRoutableElementImpl, routedPoints: RoutedPoint[]) {
        const newRoutingPoints: Point[] = [];
        for (let i = 1; i < routedPoints.length - 1; ++i)
            newRoutingPoints.push({ x: routedPoints[i].x, y: routedPoints[i].y });
        edge.routingPoints = newRoutingPoints;
    }
}
