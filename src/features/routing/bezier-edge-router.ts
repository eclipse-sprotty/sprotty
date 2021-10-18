/********************************************************************************
 * Copyright (c) 2021 TypeFox and others.
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

import { injectable } from 'inversify';
import { ResolvedHandleMove } from '../move/move';
import { center, centerOfLine, Point } from '../../utils/geometry';
import { SRoutableElement, SRoutingHandle } from './model';
import { RoutedPoint } from './routing';
import { LinearEdgeRouter } from './linear-edge-router';

@injectable()
export abstract class BezierEdgeRouter extends LinearEdgeRouter {

    static readonly KIND = 'bezier';
    static readonly DEFAULT_BEZIER_HANDLE_OFFSET = 25;

    get kind() {
        return BezierEdgeRouter.KIND;
    }

    route(edge: SRoutableElement): RoutedPoint[] {
        if (!edge.source || !edge.target)
            return [];
        const rpCount = edge.routingPoints.length;

        // Use the target center as start anchor reference
        const startRef = center(edge.target.bounds);
        const sourceAnchor = this.getTranslatedAnchor(edge.source, startRef, edge.target.parent, edge, edge.sourceAnchorCorrection);
        // Use the source center as end anchor reference
        const endRef = center(edge.source.bounds);
        const targetAnchor = this.getTranslatedAnchor(edge.target, endRef, edge.source.parent, edge, edge.targetAnchorCorrection);

        const result: RoutedPoint[] = [];
        result.push({ kind: 'source', x: sourceAnchor.x, y: sourceAnchor.y });
        if (rpCount === 0) {
            // initial values
            const { h1, h2 } = this.createDefaultBezierHandles(sourceAnchor, targetAnchor);
            result.push( { kind: 'bezier-control-after', x: h1.x, y: h1.y, pointIndex: 0 } );
            result.push( { kind: 'bezier-control-before', x: h2.x, y: h2.y, pointIndex: 1 } );
            edge.routingPoints.push(h1);
            edge.routingPoints.push(h2);
        }
        else if (rpCount >= 2) {
            for (let i = 0; i < rpCount; i++) {
                const p = edge.routingPoints[i];
                if (i % 3 === 0) {
                    result.push({ kind: 'bezier-control-after', x: p.x, y: p.y, pointIndex: i });
                }
                if ((i + 1) % 3 === 0) {
                    result.push({ kind: 'bezier-junction', x: p.x, y: p.y, pointIndex: i });
                }
                else if ((i + 2) % 3 === 0) {
                    result.push({ kind: 'bezier-control-before', x: p.x, y: p.y, pointIndex: i });
                }
            }
        }
        result.push({ kind: 'target', x: targetAnchor.x, y: targetAnchor.y });
        return result;
    }

    private createDefaultBezierHandles(relH1: Point, relH2: Point): { h1: Point, h2: Point } {
        const h1 = {
            x: relH1.x - BezierEdgeRouter.DEFAULT_BEZIER_HANDLE_OFFSET,
            y: relH1.y
        };
        const h2 = {
            x: relH2.x + BezierEdgeRouter.DEFAULT_BEZIER_HANDLE_OFFSET,
            y: relH2.y
        };
        return { h1: h1, h2: h2 };
    }

    createRoutingHandles(edge: SRoutableElement): void {
        // route ensure there are at least 2 routed points
        this.route(edge);
        const rpCount = edge.routingPoints.length;

        // New: idea: Add two circle for add/remove segments
        this.rebuildHandles(edge, rpCount);
    }

    private rebuildHandles(edge: SRoutableElement, rpCount: number) {
        this.addHandle(edge, 'source', 'routing-point', -2);
        this.addHandle(edge, 'bezier-control-after', 'bezier-routing-point', 0);
        this.addHandle(edge, 'bezier-add', 'bezier-create-routing-point', 0);

        if (rpCount > 2) {
            for (let i = 1; i < rpCount - 1; i += 3) {
                this.addHandle(edge, 'bezier-control-before', 'bezier-routing-point', i);
                this.addHandle(edge, 'bezier-add', 'bezier-create-routing-point', i + 1);
                this.addHandle(edge, 'bezier-junction', 'routing-point', i + 1);
                this.addHandle(edge, 'bezier-remove', 'bezier-create-routing-point', i + 1);
                this.addHandle(edge, 'bezier-control-after', 'bezier-routing-point', i + 2);
            }
        }
        this.addHandle(edge, 'bezier-control-before', 'bezier-routing-point', rpCount - 1);
        this.addHandle(edge, 'target', 'routing-point', -1);
    }

    getInnerHandlePosition(edge: SRoutableElement, route: RoutedPoint[], handle: SRoutingHandle) {
       if (handle.kind === 'bezier-control-before' || handle.kind === 'bezier-junction' || handle.kind === 'bezier-control-after') {
            for (let i = 0; i < route.length; i++) {
                const p = route[i];
                if (p.pointIndex === handle.pointIndex && p.kind === handle.kind)
                    return p;
            }
        }
        else if (handle.kind === 'bezier-add') {
            const ctrlPoint = this.findBezierControl(edge, route, handle.pointIndex);
            return { x: ctrlPoint.x, y: ctrlPoint.y + 12.5};
        }
        else if (handle.kind === 'bezier-remove') {
            const ctrlPoint = this.findBezierControl(edge, route, handle.pointIndex);
            return { x: ctrlPoint.x, y: ctrlPoint.y - 12.5};
        }
        return undefined;
    }

    protected findBezierControl(edge: SRoutableElement, route: RoutedPoint[], handleIndex: number): Point {
        let result: Point = { x: route[0].x, y: route[0].y };
        if (handleIndex > 0) {
            for (const rp of route) {
                if (rp.pointIndex !== undefined && rp.pointIndex === handleIndex && rp.kind === 'bezier-junction') {
                    result = { x: rp.x, y: rp.y };
                    break;
                }
            }
        }
        return result;
    }

    applyInnerHandleMoves(edge: SRoutableElement, moves: ResolvedHandleMove[]) {
        moves.forEach(move => {
            const handle = move.handle;
            switch (handle.kind) {
                case 'bezier-control-before':
                case 'bezier-control-after':
                    // find potential other handle/rp and move
                    this.moveBezierControlPair(move.toPosition, move.handle.pointIndex, edge);
                    break;
                case 'bezier-junction':
                    const index = handle.pointIndex;
                    if (index >= 0 && index < edge.routingPoints.length) {
                        edge.routingPoints[index] = move.toPosition;
                        this.moveBezierControlPair(edge.routingPoints[index - 1], index - 1, edge);
                    }
                    break;
                case 'bezier-add':
                    this.createNewBezierSegment(move, edge);
                    break;
                case 'bezier-remove':
                    this.removeBezierSegment(move, edge);
                    break;
            }
        });
    }

    private createNewBezierSegment(move: ResolvedHandleMove, edge: SRoutableElement): void {
        const handle = move.handle;
        handle.kind = 'bezier-junction';
        handle.type = 'routing-point';

        const index = handle.pointIndex;
        const routingPoints = edge.routingPoints;

        let bezierJunctionPos, start, end: Point;
        if (routingPoints.length === 2) {
            start = routingPoints[index < 0 ? 0 : index];
            end = routingPoints[routingPoints.length - 1];
            bezierJunctionPos = centerOfLine(start, end); //move.fromPosition;
        }
        else {
            start = routingPoints[index + 1];
            end = routingPoints[index + 2];
            bezierJunctionPos = centerOfLine(start, end);
        }
        const { h1, h2 } = this.createDefaultBezierHandles(bezierJunctionPos, bezierJunctionPos);

        routingPoints.splice(index + 1, 0, h1);
        routingPoints.splice(index + 2, 0, bezierJunctionPos);
        routingPoints.splice(index + 3, 0, h2);
        // ensure handles are correctly positioned
        this.moveBezierControlPair(h1, index + 1, edge);

        // simple solution for now: just rebuildHandles
        edge.removeAll(c => c instanceof SRoutingHandle);
        this.rebuildHandles(edge, routingPoints.length);
    }

    private removeBezierSegment(move: ResolvedHandleMove, edge: SRoutableElement): void {
        const handle = move.handle;
        const index = handle.pointIndex;
        const routingPoints = edge.routingPoints;

        routingPoints.splice(index - 1, 3);

        // simple solution for now: just rebuildHandles
        edge.removeAll(c => c instanceof SRoutingHandle);
        this.rebuildHandles(edge, routingPoints.length);
    }

    private moveBezierControlPair(newPos: Point, pointIndex: number, edge: SRoutableElement) {
        if (pointIndex >= 0 && pointIndex < edge.routingPoints.length) {
            // find neighbors
            const before = pointIndex - 1;
            const after = pointIndex + 1;

            // this is the first control or the last control => nothing to do further
            if (before < 0 || after === edge.routingPoints.length) {
                edge.routingPoints[pointIndex] = newPos;
            }
            else  {
                // behind bezier-junction
                if (pointIndex % 3 === 0) {
                    this.setBezierMirror(edge, newPos, pointIndex, false);
                }
                // before bezier-junction
                else if ((pointIndex + 2) % 3 === 0) {
                    this.setBezierMirror(edge, newPos, pointIndex, true);
                }
            }
        }
    }

    private setBezierMirror(edge: SRoutableElement, newPos: Point, pointIndex: number, before: boolean) {
        edge.routingPoints[pointIndex] = newPos;
        const jct = edge.routingPoints[before ? (pointIndex + 1) : (pointIndex - 1)];
        edge.routingPoints[before ? (pointIndex + 2) : (pointIndex - 2)] = {
            x: jct.x - (newPos.x - jct.x),
            y: jct.y - (newPos.y - jct.y)
        };
    }
}
