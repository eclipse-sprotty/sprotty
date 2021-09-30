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

import { injectable } from 'inversify';
import { ResolvedHandleMove } from '../move/move';
import { center, centerOfLine } from '../../utils/geometry';
import { SRoutableElement, SRoutingHandle } from './model';
import { RoutedPoint } from './routing';
import { LinearEdgeRouter } from './linear-edge-router';

@injectable()
export abstract class BezierEdgeRouter extends LinearEdgeRouter {

    static readonly KIND = 'bezier';

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
            result.push({ kind: 'bezier-control', x: sourceAnchor.x + 25, y: sourceAnchor.y - 25, pointIndex: 0 });
            result.push({ kind: 'bezier-control', x: targetAnchor.x - 25, y: targetAnchor.y + 25, pointIndex: 1 });
        }
        else if (rpCount >= 2) {
            for (let i = 0; i < rpCount; i++) {
                const p = edge.routingPoints[i];
                if ((i + 1) % 3 === 0) {
                    result.push({ kind: 'bezier-segment', x: p.x, y: p.y, pointIndex: i });
                }
                else {
                    result.push({ kind: 'bezier-control', x: p.x, y: p.y, pointIndex: i });
                }
            }
        }
        result.push({ kind: 'target', x: targetAnchor.x, y: targetAnchor.y });
        return result;
    }

    createRoutingHandles(edge: SRoutableElement): void {
        // route ensure there are at least 2 routed points
        const routedPoints = this.route(edge);
        this.commitRoute(edge, routedPoints);
        const rpCount = edge.routingPoints.length;

        this.addHandle(edge, 'source', 'routing-point', 0);
        this.addHandle(edge, 'line', 'volatile-routing-point', 0);

        this.addHandle(edge, 'bezier-control', 'volatile-routing-point', 0);
        if (rpCount > 2) {
            for (let i = 1; i < rpCount - 1; i++) {
                this.addHandle(edge, 'bezier-control', 'volatile-routing-point', i);
                this.addHandle(edge, 'bezier-segment', 'volatile-routing-point', i);
                this.addHandle(edge, 'bezier-control', 'volatile-routing-point', i);
            }
        }
        this.addHandle(edge, 'bezier-control', 'volatile-routing-point', rpCount - 1);
        this.addHandle(edge, 'target', 'routing-point', rpCount - 1);
    }

    getInnerHandlePosition(edge: SRoutableElement, route: RoutedPoint[], handle: SRoutingHandle) {
        console.log(handle.kind);
       if (handle.kind === 'bezier-control') {
            for (let i = 0; i < route.length; i++) {
                const p = route[i];
                if (p.pointIndex === handle.pointIndex)
                    return p;
            }
        }
        else if (handle.kind === 'line') {
            const { start, end } = this.findRouteSegment(edge, route, handle.pointIndex);
            if (start !== undefined && end !== undefined)
                return centerOfLine(start, end);
        }
        return undefined;
    }

    applyInnerHandleMoves(edge: SRoutableElement, moves: ResolvedHandleMove[]) {
        moves.forEach(move => {
            const handle = move.handle;
            if (handle.kind === 'bezier-control') {
                const points = edge.routingPoints;
                const index = handle.pointIndex;
                if (index >= 0 && index < points.length) {
                    points[index] = move.toPosition;
                }
            }
        });
    }
}
