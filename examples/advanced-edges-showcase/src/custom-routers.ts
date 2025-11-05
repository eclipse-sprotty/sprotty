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

import { injectable } from 'inversify';
import { AbstractEdgeRouter, LinearRouteOptions } from 'sprotty/lib/features/routing/abstract-edge-router';
import { SRoutableElementImpl, SRoutingHandleImpl } from 'sprotty/lib/features/routing/model';
import { RoutedPoint } from 'sprotty/lib/features/routing/routing';
import { ResolvedHandleMove } from 'sprotty/lib/features/move/move';
import { SConnectableElementImpl } from 'sprotty/lib/features/routing/model';
import { Point } from 'sprotty-protocol/lib/utils/geometry';

/**
 * Arc edge router that creates parabolic arc paths between nodes.
 * Useful for showing flow or curved connections.
 */
@injectable()
export class ArcEdgeRouter extends AbstractEdgeRouter {
    static readonly KIND = 'arc';

    get kind() {
        return ArcEdgeRouter.KIND;
    }

    protected override getOptions(edge: SRoutableElementImpl): LinearRouteOptions {
        return {
            minimalPointDistance: 2,
            standardDistance: 20,
            selfEdgeOffset: 0.25
        };
    }

    override route(edge: SRoutableElementImpl): RoutedPoint[] {
        const source = edge.source;
        const target = edge.target;

        if (!source || !target) {
            return [];
        }

        const result: RoutedPoint[] = [];

        // Calculate target center for anchor computation
        const targetCenter = this.getElementCenter(target);

        // Get source anchor
        const sourceAnchor = this.getTranslatedAnchor(
            source,
            targetCenter,
            target.parent,
            edge,
            edge.sourceAnchorCorrection
        );

        result.push({
            kind: 'source',
            x: sourceAnchor.x,
            y: sourceAnchor.y
        });

        // Calculate arc points using target center
        const arcPoints = this.calculateArcPoints(sourceAnchor, targetCenter);
        arcPoints.forEach(p => {
            result.push({
                kind: 'linear',
                x: p.x,
                y: p.y
            });
        });

        // Get target anchor
        const lastArcPoint = arcPoints.length > 0
            ? arcPoints[arcPoints.length - 1]
            : sourceAnchor;

        const targetAnchor = this.getTranslatedAnchor(
            target,
            lastArcPoint,
            source.parent,
            edge,
            edge.targetAnchorCorrection
        );

        result.push({
            kind: 'target',
            x: targetAnchor.x,
            y: targetAnchor.y
        });

        return result;
    }

    /**
     * Calculate points along a parabolic arc
     */
    private calculateArcPoints(start: Point, end: Point): Point[] {
        const points: Point[] = [];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Arc height is proportional to distance
        const arcHeight = distance * 0.15;

        // Create smooth arc with multiple segments
        const segments = Math.max(8, Math.floor(distance / 20));

        for (let i = 1; i < segments; i++) {
            const t = i / segments;

            // Linear interpolation for base position
            const x = start.x + dx * t;
            const y = start.y + dy * t;

            // Add parabolic offset perpendicular to connection
            const offset = Math.sin(t * Math.PI) * arcHeight;

            // Calculate perpendicular direction
            const perpX = -dy / distance;
            const perpY = dx / distance;

            points.push({
                x: x + perpX * offset,
                y: y + perpY * offset
            });
        }

        return points;
    }

    private getElementCenter(element: SConnectableElementImpl): Point {
        return {
            x: element.bounds.x + element.bounds.width / 2,
            y: element.bounds.y + element.bounds.height / 2
        };
    }

    override createRoutingHandles(edge: SRoutableElementImpl): void {
        // No interactive handles for this simple router
    }

    override applyHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void {
        // Not implemented for this router
    }

    protected applyInnerHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void {
        // Not implemented for this simple router
    }

    protected getInnerHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl): Point | undefined {
        return undefined;
    }

    override applyReconnect(edge: SRoutableElementImpl, newSourceId?: string, newTargetId?: string): void {
        // Not implemented for this router
    }

    override pointAt(edge: SRoutableElementImpl, t: number): Point | undefined {
        const route = this.route(edge);
        if (route.length === 0) return undefined;

        const totalLength = route.length - 1;
        const segmentIndex = Math.floor(t * totalLength);
        const segmentT = (t * totalLength) - segmentIndex;

        if (segmentIndex >= route.length - 1) {
            return route[route.length - 1];
        }

        const p1 = route[segmentIndex];
        const p2 = route[segmentIndex + 1];

        return {
            x: p1.x + (p2.x - p1.x) * segmentT,
            y: p1.y + (p2.y - p1.y) * segmentT
        };
    }

    override derivativeAt(edge: SRoutableElementImpl, t: number): Point | undefined {
        const route = this.route(edge);
        if (route.length < 2) return undefined;

        const totalLength = route.length - 1;
        const segmentIndex = Math.floor(t * totalLength);

        if (segmentIndex >= route.length - 1) {
            const p1 = route[route.length - 2];
            const p2 = route[route.length - 1];
            return { x: p2.x - p1.x, y: p2.y - p1.y };
        }

        const p1 = route[segmentIndex];
        const p2 = route[segmentIndex + 1];

        return { x: p2.x - p1.x, y: p2.y - p1.y };
    }

    override getHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl): Point | undefined {
        return undefined;
    }
}

/**
 * Step edge router that creates stepped connections with a midpoint.
 * Creates a clean two-segment orthogonal path.
 */
@injectable()
export class StepEdgeRouter extends AbstractEdgeRouter {
    static readonly KIND = 'step';

    get kind() {
        return StepEdgeRouter.KIND;
    }

    protected override getOptions(edge: SRoutableElementImpl): LinearRouteOptions {
        return {
            minimalPointDistance: 2,
            standardDistance: 20,
            selfEdgeOffset: 0.25
        };
    }

    override route(edge: SRoutableElementImpl): RoutedPoint[] {
        const source = edge.source;
        const target = edge.target;

        if (!source || !target) {
            return [];
        }

        const result: RoutedPoint[] = [];

        // Get element centers
        const sourceCenter = this.getElementCenter(source);
        const targetCenter = this.getElementCenter(target);

        // Determine step direction based on relative positions
        const isVerticalFirst = Math.abs(targetCenter.y - sourceCenter.y) >
            Math.abs(targetCenter.x - sourceCenter.x);

        // Get source anchor
        const sourceAnchor = this.getTranslatedAnchor(
            source,
            targetCenter,
            target.parent,
            edge,
            edge.sourceAnchorCorrection
        );

        result.push({
            kind: 'source',
            x: sourceAnchor.x,
            y: sourceAnchor.y
        });

        // Create stepped path
        if (isVerticalFirst) {
            // Vertical first, then horizontal
            const midY = (sourceAnchor.y + targetCenter.y) / 2;

            result.push({
                kind: 'linear',
                x: sourceAnchor.x,
                y: midY
            });

            result.push({
                kind: 'linear',
                x: targetCenter.x,
                y: midY
            });
        } else {
            // Horizontal first, then vertical
            const midX = (sourceAnchor.x + targetCenter.x) / 2;

            result.push({
                kind: 'linear',
                x: midX,
                y: sourceAnchor.y
            });

            result.push({
                kind: 'linear',
                x: midX,
                y: targetCenter.y
            });
        }

        // Get target anchor from last step point
        const lastPoint = result[result.length - 1];
        const targetAnchor = this.getTranslatedAnchor(
            target,
            lastPoint,
            source.parent,
            edge,
            edge.targetAnchorCorrection
        );

        result.push({
            kind: 'target',
            x: targetAnchor.x,
            y: targetAnchor.y
        });

        return result;
    }

    private getElementCenter(element: SConnectableElementImpl): Point {
        return {
            x: element.bounds.x + element.bounds.width / 2,
            y: element.bounds.y + element.bounds.height / 2
        };
    }

    override createRoutingHandles(edge: SRoutableElementImpl): void {
        // No interactive handles for this router
    }

    override applyHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void {
        // Not implemented for this router
    }

    protected applyInnerHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void {
        // Not implemented for this simple router
    }

    protected getInnerHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl): Point | undefined {
        return undefined;
    }

    override applyReconnect(edge: SRoutableElementImpl, newSourceId?: string, newTargetId?: string): void {
        // Not implemented for this router
    }

    override pointAt(edge: SRoutableElementImpl, t: number): Point | undefined {
        const route = this.route(edge);
        if (route.length === 0) return undefined;

        const totalLength = route.length - 1;
        const segmentIndex = Math.floor(t * totalLength);
        const segmentT = (t * totalLength) - segmentIndex;

        if (segmentIndex >= route.length - 1) {
            return route[route.length - 1];
        }

        const p1 = route[segmentIndex];
        const p2 = route[segmentIndex + 1];

        return {
            x: p1.x + (p2.x - p1.x) * segmentT,
            y: p1.y + (p2.y - p1.y) * segmentT
        };
    }

    override derivativeAt(edge: SRoutableElementImpl, t: number): Point | undefined {
        const route = this.route(edge);
        if (route.length < 2) return undefined;

        const totalLength = route.length - 1;
        const segmentIndex = Math.floor(t * totalLength);

        if (segmentIndex >= route.length - 1) {
            const p1 = route[route.length - 2];
            const p2 = route[route.length - 1];
            return { x: p2.x - p1.x, y: p2.y - p1.y };
        }

        const p1 = route[segmentIndex];
        const p2 = route[segmentIndex + 1];

        return { x: p2.x - p1.x, y: p2.y - p1.y };
    }

    override getHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl): Point | undefined {
        return undefined;
    }
}

