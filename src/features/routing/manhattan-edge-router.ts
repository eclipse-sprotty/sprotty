/********************************************************************************
 * Copyright (c) 2019 TypeFox and others.
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

import { translatePoint } from "../../base/model/smodel-utils";
import { almostEquals, center, includes, linear, Point, manhattanDistance } from "../../utils/geometry";
import { ResolvedHandleMove } from "../move/move";
import { DefaultAnchors, LinearEdgeRouter, LinearRouteOptions, Side } from "./linear-edge-router";
import { SRoutableElement, RoutingHandleKind, SRoutingHandle } from "./model";
import { RoutedPoint } from "./routing";

export interface ManhattanRouterOptions extends LinearRouteOptions {
    standardDistance: number;
}

export class ManhattanEdgeRouter extends LinearEdgeRouter {
    static readonly KIND = 'manhattan';

    get kind() {
        return ManhattanEdgeRouter.KIND;
    }

    protected getOptions(edge: SRoutableElement): ManhattanRouterOptions {
        return {
            standardDistance: 20,
            minimalPointDistance: 3,
            selfEdgeOffset: 0.25
        };
    }

    route(edge: SRoutableElement): RoutedPoint[] {
        if (!edge.source || !edge.target)
            return [];
        const routedCorners = this.createRoutedCorners(edge);
        const sourceRefPoint = routedCorners[0]
            || translatePoint(center(edge.target.bounds), edge.target.parent, edge.parent);
        const sourceAnchor = this.getTranslatedAnchor(edge.source, sourceRefPoint, edge.parent, edge, edge.sourceAnchorCorrection);
        const targetRefPoint = routedCorners[routedCorners.length - 1]
            || translatePoint(center(edge.source.bounds), edge.source.parent, edge.parent);
        const targetAnchor = this.getTranslatedAnchor(edge.target, targetRefPoint, edge.parent, edge, edge.targetAnchorCorrection);
        if (!sourceAnchor || !targetAnchor)
            return [];
        const routedPoints: RoutedPoint[] = [];
        routedPoints.push({ kind: 'source', ...sourceAnchor});
        routedCorners.forEach(corner => routedPoints.push(corner));
        routedPoints.push({ kind: 'target', ...targetAnchor});
        return routedPoints;
    }

    protected createRoutedCorners(edge: SRoutableElement): RoutedPoint[] {
        const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, 'source');
        const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, 'target');
        if (edge.routingPoints.length > 0) {
            const routingPointsCopy = edge.routingPoints.slice();
            this.cleanupRoutingPoints(edge, routingPointsCopy, false, true);
            if (routingPointsCopy.length > 0)
                return routingPointsCopy.map((routingPoint, index) => {
                    return <RoutedPoint> { kind: 'linear', pointIndex: index, ...routingPoint};
                });
        }
        const options = this.getOptions(edge);
        const corners = this.calculateDefaultCorners(edge, sourceAnchors, targetAnchors, options);
        return corners.map(corner => {
            return <RoutedPoint> { kind: 'linear', ...corner };
        });
    }

    createRoutingHandles(edge: SRoutableElement) {
        const routedPoints = this.route(edge);
        this.commitRoute(edge, routedPoints);
        if (routedPoints.length > 0) {
            this.addHandle(edge, 'source', 'routing-point', -2);
            for (let i = 0; i < routedPoints.length - 1; ++i)
                this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', i - 1);
            this.addHandle(edge, 'target', 'routing-point', routedPoints.length - 2);
        }
    }

    protected getInnerHandlePosition(edge: SRoutableElement, route: RoutedPoint[], handle: SRoutingHandle) {
        const fraction = this.getFraction(handle.kind);
        if (fraction !== undefined) {
            const { start, end } = this.findRouteSegment(edge, route, handle.pointIndex);
            if (start !== undefined && end !== undefined)
                return linear(start, end, fraction);
        }
        return undefined;
    }

    protected getFraction(kind: RoutingHandleKind): number | undefined {
        switch (kind) {
            case 'manhattan-50%': return 0.5;
            default: return undefined;
        }
    }

    protected commitRoute(edge: SRoutableElement, routedPoints: RoutedPoint[]) {
        const newRoutingPoints: Point[] = [];
        for (let i = 1; i < routedPoints.length - 1; ++i)
            newRoutingPoints.push({ x: routedPoints[i].x, y: routedPoints[i].y });
        edge.routingPoints = newRoutingPoints;
    }

    protected applyInnerHandleMoves(edge: SRoutableElement, moves: ResolvedHandleMove[]) {
        const route = this.route(edge);
        const routingPoints = edge.routingPoints;
        const minimalPointDistance = this.getOptions(edge).minimalPointDistance;
        moves.forEach(move => {
            const handle = move.handle;
            const index = handle.pointIndex;
            const correctedX = this.correctX(routingPoints, index, move.toPosition.x, minimalPointDistance);
            const correctedY = this.correctY(routingPoints, index, move.toPosition.y, minimalPointDistance);
            switch (handle.kind) {
                case 'manhattan-50%':
                    if (index < 0) {
                        if (almostEquals(route[0].x, route[1].x))
                            this.alignX(routingPoints, 0, correctedX);
                        else
                            this.alignY(routingPoints, 0, correctedY);
                    } else if (index < routingPoints.length - 1) {
                        if (almostEquals(routingPoints[index].x, routingPoints[index + 1].x)) {
                            this.alignX(routingPoints, index, correctedX);
                            this.alignX(routingPoints, index + 1, correctedX);
                        } else {
                            this.alignY(routingPoints, index, correctedY);
                            this.alignY(routingPoints, index + 1, correctedY);
                        }
                    } else {
                        if (almostEquals(route[route.length - 2].x, route[route.length - 1].x))
                            this.alignX(routingPoints, routingPoints.length - 1, correctedX);
                        else
                            this.alignY(routingPoints, routingPoints.length - 1, correctedY);
                    }
                    break;
            }
        });
    }

    protected correctX(routingPoints: Point[], index: number, x: number, minimalPointDistance: number) {
        if (index > 0 && Math.abs(x - routingPoints[index - 1].x) < minimalPointDistance)
            return routingPoints[index - 1].x;
        else if (index < routingPoints.length - 2 && Math.abs(x - routingPoints[index + 2].x) < minimalPointDistance)
            return routingPoints[index + 2].x;
        else
            return x;
    }

    protected alignX(routingPoints: Point[], index: number, x: number) {
        if (index >= 0 && index < routingPoints.length)
            routingPoints[index] = {
                x,
                y: routingPoints[index].y
            };
    }

    protected correctY(routingPoints: Point[], index: number, y: number, minimalPointDistance: number) {
        if (index > 0 && Math.abs(y - routingPoints[index - 1].y) < minimalPointDistance)
            return routingPoints[index - 1].y;
        else if (index < routingPoints.length - 2 && Math.abs(y - routingPoints[index + 2].y) < minimalPointDistance)
            return routingPoints[index + 2].y;
        else
            return y;
    }

    protected alignY(routingPoints: Point[], index: number, y: number) {
        if (index >= 0 && index < routingPoints.length)
            routingPoints[index] = {
                x: routingPoints[index].x,
                y
            };
    }

    cleanupRoutingPoints(edge: SRoutableElement, routingPoints: Point[], updateHandles: boolean, addRoutingPoints: boolean) {
        const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, "source");
        const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, "target");
        if (this.resetRoutingPointsOnReconnect(edge, routingPoints, updateHandles, sourceAnchors, targetAnchors))
            return;
        // delete leading RPs inside the bounds of the source
        for (let i = 0; i < routingPoints.length; ++i)
            if (includes(sourceAnchors.bounds, routingPoints[i])) {
                routingPoints.splice(0, 1);
                if (updateHandles) {
                    this.removeHandle(edge, -1);
                }
            } else {
                break;
            }
        // delete trailing RPs inside the bounds of the target
        for (let i = routingPoints.length - 1; i >= 0; --i)
            if (includes(targetAnchors.bounds, routingPoints[i])) {
                routingPoints.splice(i, 1);
                if (updateHandles) {
                    this.removeHandle(edge, i);
                }
            } else {
                break;
        }
        if (routingPoints.length >= 2) {
            const options = this.getOptions(edge);
            for (let i = routingPoints.length - 2; i >= 0; --i) {
                if (manhattanDistance(routingPoints[i], routingPoints[i + 1]) < options.minimalPointDistance) {
                    routingPoints.splice(i, 2);
                    --i;
                    if (updateHandles) {
                        this.removeHandle(edge, i - 1);
                        this.removeHandle(edge, i);
                    }
                }
            }
        }
        if (addRoutingPoints) {
            this.addAdditionalCorner(edge, routingPoints, sourceAnchors, targetAnchors, updateHandles);
            this.addAdditionalCorner(edge, routingPoints, targetAnchors, sourceAnchors, updateHandles);
        }
    }

    protected removeHandle(edge: SRoutableElement, pointIndex: number) {
        const toBeRemoved: SRoutingHandle[] = [];
        edge.children.forEach(child => {
            if (child instanceof SRoutingHandle) {
                if (child.pointIndex > pointIndex)
                    --child.pointIndex;
                else if (child.pointIndex === pointIndex)
                    toBeRemoved.push(child);
            }
        });
        toBeRemoved.forEach(child => edge.remove(child));
    }

    protected addAdditionalCorner(edge: SRoutableElement, routingPoints: Point[], currentAnchors: DefaultAnchors, otherAnchors: DefaultAnchors, updateHandles: boolean) {
        if (routingPoints.length === 0)
            return;
        const refPoint = currentAnchors.kind === 'source' ? routingPoints[0] : routingPoints[routingPoints.length - 1];
        const index = currentAnchors.kind === 'source' ? 0 : routingPoints.length;
        const shiftIndex = index - (currentAnchors.kind === 'source' ? 1 : 0);
        let isHorizontal: boolean;
        if (routingPoints.length > 1) {
            isHorizontal = index === 0
            ? almostEquals(routingPoints[0].x, routingPoints[1].x)
            : almostEquals(routingPoints[routingPoints.length - 1].x, routingPoints[routingPoints.length - 2].x);
        } else {
            const nearestSide = otherAnchors.getNearestSide(refPoint);
            isHorizontal = nearestSide === Side.TOP || nearestSide === Side.BOTTOM;
        }
        if (isHorizontal) {
            if (refPoint.y < currentAnchors.get(Side.TOP).y || refPoint.y > currentAnchors.get(Side.BOTTOM).y) {
                const newPoint = { x: currentAnchors.get(Side.TOP).x, y: refPoint.y };
                routingPoints.splice(index, 0, newPoint);
                if (updateHandles) {
                    edge.children.forEach(child => {
                        if (child instanceof SRoutingHandle && child.pointIndex >= shiftIndex)
                            ++child.pointIndex;
                    });
                    this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', shiftIndex);
                }
            }
        } else {
            if (refPoint.x < currentAnchors.get(Side.LEFT).x || refPoint.x > currentAnchors.get(Side.RIGHT).x) {
                const newPoint = { x: refPoint.x, y: currentAnchors.get(Side.LEFT).y };
                routingPoints.splice(index, 0, newPoint);
                if (updateHandles) {
                    edge.children.forEach(child => {
                        if (child instanceof SRoutingHandle && child.pointIndex >= shiftIndex)
                            ++child.pointIndex;
                    });
                    this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', shiftIndex);
                }
            }
        }
    }

    protected calculateDefaultCorners(edge: SRoutableElement, sourceAnchors: DefaultAnchors, targetAnchors: DefaultAnchors, options: ManhattanRouterOptions): Point[] {
        const selfEdge = super.calculateDefaultCorners(edge, sourceAnchors, targetAnchors, options);
        if (selfEdge.length > 0)
            return selfEdge;
        const bestAnchors = this.getBestConnectionAnchors(edge, sourceAnchors, targetAnchors, options);
        const sourceSide = bestAnchors.source;
        const targetSide = bestAnchors.target;
        const corners: Point[] = [];
        const startPoint = sourceAnchors.get(sourceSide);
        let endPoint = targetAnchors.get(targetSide);
        switch (sourceSide) {
            case Side.RIGHT:
                switch (targetSide) {
                    case Side.BOTTOM:
                        corners.push({ x: endPoint.x, y: startPoint.y });
                        break;
                    case Side.TOP:
                        corners.push({ x: endPoint.x, y: startPoint.y });
                        break;
                    case Side.RIGHT:
                        corners.push({ x: Math.max(startPoint.x, endPoint.x) + 1.5 * options.standardDistance, y: startPoint.y });
                        corners.push({ x: Math.max(startPoint.x, endPoint.x) + 1.5 * options.standardDistance, y: endPoint.y });
                        break;
                    case Side.LEFT:
                        if (endPoint.y !== startPoint.y) {
                            corners.push({ x: (startPoint.x + endPoint.x) / 2, y: startPoint.y });
                            corners.push({ x: (startPoint.x + endPoint.x) / 2, y: endPoint.y });
                        }
                        break;
                }
                break;
            case Side.LEFT:
                switch (targetSide) {
                    case Side.BOTTOM:
                        corners.push({ x: endPoint.x, y: startPoint.y });
                        break;
                    case Side.TOP:
                        corners.push({ x: endPoint.x, y: startPoint.y });
                        break;
                    default:
                        endPoint = targetAnchors.get(Side.RIGHT);
                        if (endPoint.y !== startPoint.y) {
                            corners.push({ x: (startPoint.x + endPoint.x) / 2, y: startPoint.y });
                            corners.push({ x: (startPoint.x + endPoint.x) / 2, y: endPoint.y });
                        }
                        break;
                }
                break;
            case Side.TOP:
                switch (targetSide) {
                    case Side.RIGHT:
                        if ((endPoint.x - startPoint.x) > 0) {
                            corners.push({ x: startPoint.x, y: startPoint.y - options.standardDistance });
                            corners.push({ x: endPoint.x + 1.5 * options.standardDistance, y: startPoint.y - options.standardDistance });
                            corners.push({ x: endPoint.x + 1.5 * options.standardDistance, y: endPoint.y });
                        } else {
                            corners.push({ x: startPoint.x, y: endPoint.y });
                        }
                        break;
                    case Side.LEFT:
                        if ((endPoint.x - startPoint.x) < 0) {
                            corners.push({ x: startPoint.x, y: startPoint.y - options.standardDistance });
                            corners.push({ x: endPoint.x - 1.5 * options.standardDistance, y: startPoint.y - options.standardDistance });
                            corners.push({ x: endPoint.x - 1.5 * options.standardDistance, y: endPoint.y });
                        } else {
                            corners.push({ x: startPoint.x, y: endPoint.y });
                        }
                        break;
                    case Side.TOP:
                        corners.push({ x: startPoint.x, y: Math.min(startPoint.y, endPoint.y) - 1.5 * options.standardDistance });
                        corners.push({ x: endPoint.x, y: Math.min(startPoint.y, endPoint.y) - 1.5 * options.standardDistance });
                        break;
                    case Side.BOTTOM:
                        if (endPoint.x !== startPoint.x) {
                            corners.push({ x: startPoint.x, y: (startPoint.y + endPoint.y) / 2 });
                            corners.push({ x: endPoint.x, y: (startPoint.y + endPoint.y) / 2 });
                        }
                        break;
                }
                break;
            case Side.BOTTOM:
                switch (targetSide) {
                    case Side.RIGHT:
                        if ((endPoint.x - startPoint.x) > 0) {
                            corners.push({ x: startPoint.x, y: startPoint.y + options.standardDistance });
                            corners.push({ x: endPoint.x + 1.5 * options.standardDistance, y: startPoint.y + options.standardDistance });
                            corners.push({ x: endPoint.x + 1.5 * options.standardDistance, y: endPoint.y });
                        } else {
                            corners.push({ x: startPoint.x, y: endPoint.y });
                        }
                        break;
                    case Side.LEFT:
                        if ((endPoint.x - startPoint.x) < 0) {
                            corners.push({ x: startPoint.x, y: startPoint.y + options.standardDistance });
                            corners.push({ x: endPoint.x - 1.5 * options.standardDistance, y: startPoint.y + options.standardDistance });
                            corners.push({ x: endPoint.x - 1.5 * options.standardDistance, y: endPoint.y });
                        } else {
                            corners.push({ x: startPoint.x, y: endPoint.y });
                        }
                        break;
                    default:
                        endPoint = targetAnchors.get(Side.TOP);
                        if (endPoint.x !== startPoint.x) {
                            corners.push({ x: startPoint.x, y: (startPoint.y + endPoint.y) / 2 });
                            corners.push({ x: endPoint.x, y: (startPoint.y + endPoint.y) / 2 });
                        }
                        break;
                }
                break;
        }
        return corners;
    }

    protected getBestConnectionAnchors(edge: SRoutableElement,
                                        sourceAnchors: DefaultAnchors, targetAnchors: DefaultAnchors,
                                        options: ManhattanRouterOptions): { source: Side, target: Side } {
        // distance is enough
        let sourcePoint = sourceAnchors.get(Side.RIGHT);
        let targetPoint = targetAnchors.get(Side.LEFT);
        if ((targetPoint.x - sourcePoint.x) > options.standardDistance)
            return { source: Side.RIGHT, target: Side.LEFT };

        sourcePoint = sourceAnchors.get(Side.LEFT);
        targetPoint = targetAnchors.get(Side.RIGHT);
        if ((sourcePoint.x - targetPoint.x) > options.standardDistance)
            return { source: Side.LEFT, target: Side.RIGHT };

        sourcePoint = sourceAnchors.get(Side.TOP);
        targetPoint = targetAnchors.get(Side.BOTTOM);
        if ((sourcePoint.y - targetPoint.y) > options.standardDistance)
            return { source: Side.TOP, target: Side.BOTTOM };

        sourcePoint = sourceAnchors.get(Side.BOTTOM);
        targetPoint = targetAnchors.get(Side.TOP);
        if ((targetPoint.y - sourcePoint.y) > options.standardDistance)
            return { source: Side.BOTTOM, target: Side.TOP };

        // One additional point
        sourcePoint = sourceAnchors.get(Side.RIGHT);
        targetPoint = targetAnchors.get(Side.TOP);
        if (((targetPoint.x - sourcePoint.x) > 0.5 * options.standardDistance) && ((targetPoint.y - sourcePoint.y) > options.standardDistance))
            return { source: Side.RIGHT, target: Side.TOP };

        targetPoint = targetAnchors.get(Side.BOTTOM);
        if (((targetPoint.x - sourcePoint.x) > 0.5 * options.standardDistance) && ((sourcePoint.y - targetPoint.y) > options.standardDistance))
            return { source: Side.RIGHT, target: Side.BOTTOM };

        sourcePoint = sourceAnchors.get(Side.LEFT);
        targetPoint = targetAnchors.get(Side.BOTTOM);
        if (((sourcePoint.x - targetPoint.x) > 0.5 * options.standardDistance) && ((sourcePoint.y - targetPoint.y) > options.standardDistance))
            return { source: Side.LEFT, target: Side.BOTTOM };

        targetPoint = targetAnchors.get(Side.TOP);
        if (((sourcePoint.x - targetPoint.x) > 0.5 * options.standardDistance) && ((targetPoint.y - sourcePoint.y) > options.standardDistance))
            return { source: Side.LEFT, target: Side.TOP };

        sourcePoint = sourceAnchors.get(Side.TOP);
        targetPoint = targetAnchors.get(Side.RIGHT);
        if (((sourcePoint.y - targetPoint.y) > 0.5 * options.standardDistance) && ((sourcePoint.x - targetPoint.x) > options.standardDistance))
            return { source: Side.TOP, target: Side.RIGHT };

        targetPoint = targetAnchors.get(Side.LEFT);
        if (((sourcePoint.y - targetPoint.y) > 0.5 * options.standardDistance) && ((targetPoint.x - sourcePoint.x) > options.standardDistance))
            return { source: Side.TOP, target: Side.LEFT };

        sourcePoint = sourceAnchors.get(Side.BOTTOM);
        targetPoint = targetAnchors.get(Side.RIGHT);
        if (((targetPoint.y - sourcePoint.y) > 0.5 * options.standardDistance) && ((sourcePoint.x - targetPoint.x) > options.standardDistance))
            return { source: Side.BOTTOM, target: Side.RIGHT };

        targetPoint = targetAnchors.get(Side.LEFT);
        if (((targetPoint.y - sourcePoint.y) > 0.5 * options.standardDistance) && ((targetPoint.x - sourcePoint.x) > options.standardDistance))
            return { source: Side.BOTTOM, target: Side.LEFT };

        // Two points
        // priority NN >> EE >> NE >> NW >> SE >> SW
        sourcePoint = sourceAnchors.get(Side.TOP);
        targetPoint = targetAnchors.get(Side.TOP);
        if (!includes(targetAnchors.bounds, sourcePoint) && !includes(sourceAnchors.bounds, targetPoint)) {
            if ((sourcePoint.y - targetPoint.y) < 0) {
                if (Math.abs(sourcePoint.x - targetPoint.x) > ((sourceAnchors.bounds.width + options.standardDistance) / 2))
                    return { source: Side.TOP, target: Side.TOP };
            } else {
                if (Math.abs(sourcePoint.x - targetPoint.x) > (targetAnchors.bounds.width / 2))
                    return { source: Side.TOP, target: Side.TOP };
            }
        }

        sourcePoint = sourceAnchors.get(Side.RIGHT);
        targetPoint = targetAnchors.get(Side.RIGHT);
        if (!includes(targetAnchors.bounds, sourcePoint) && !includes(sourceAnchors.bounds, targetPoint)) {
            if ((sourcePoint.x - targetPoint.x) > 0) {
                if (Math.abs(sourcePoint.y - targetPoint.y) > ((sourceAnchors.bounds.height + options.standardDistance) / 2))
                    return { source: Side.RIGHT, target: Side.RIGHT };
            } else if (Math.abs(sourcePoint.y - targetPoint.y) > (targetAnchors.bounds.height / 2))
                return { source: Side.RIGHT, target: Side.RIGHT };
        }

        // Secondly, judge NE NW is available
        sourcePoint = sourceAnchors.get(Side.TOP);
        targetPoint = targetAnchors.get(Side.RIGHT);
        if (!includes(targetAnchors.bounds, sourcePoint) && !includes(sourceAnchors.bounds, targetPoint))
            return { source: Side.TOP, target: Side.RIGHT };

        targetPoint = targetAnchors.get(Side.LEFT);
        if (!includes(targetAnchors.bounds, sourcePoint) && !includes(sourceAnchors.bounds, targetPoint))
            return { source: Side.TOP, target: Side.LEFT };

        // Finally, judge SE SW is available
        sourcePoint = sourceAnchors.get(Side.BOTTOM);
        targetPoint = targetAnchors.get(Side.RIGHT);
        if (!includes(targetAnchors.bounds, sourcePoint) && !includes(sourceAnchors.bounds, targetPoint))
            return { source: Side.BOTTOM, target: Side.RIGHT };

        targetPoint = targetAnchors.get(Side.LEFT);
        if (!includes(targetAnchors.bounds, sourcePoint) && !includes(sourceAnchors.bounds, targetPoint))
            return { source: Side.BOTTOM, target: Side.LEFT };

        // Only to return to the
        return { source: Side.RIGHT, target: Side.BOTTOM };
    }
}
