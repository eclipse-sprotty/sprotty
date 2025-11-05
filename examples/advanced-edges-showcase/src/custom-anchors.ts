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
import { IAnchorComputer } from 'sprotty/lib/features/routing/anchor';
import { SConnectableElementImpl } from 'sprotty/lib/features/routing/model';
import { Point } from 'sprotty-protocol/lib/utils/geometry';

/**
 * Hexagon anchor computer for hexagonal nodes.
 * Computes anchor points on a regular hexagon boundary.
 */
@injectable()
export class HexagonAnchor implements IAnchorComputer {
    static readonly KIND = 'hexagon';

    get kind() {
        return HexagonAnchor.KIND;
    }

    getAnchor(
        connectable: SConnectableElementImpl,
        referencePoint: Point,
        offset: number = 0
    ): Point {
        const bounds = connectable.bounds;
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const width = bounds.width;
        const height = bounds.height;

        // Calculate hexagon vertices (flat-top orientation)
        const w2 = width / 2;
        const h2 = height / 2;
        const w4 = width / 4;

        const vertices: Point[] = [
            { x: cx + w2, y: cy },           // Right
            { x: cx + w4, y: cy + h2 },      // Bottom-right
            { x: cx - w4, y: cy + h2 },      // Bottom-left
            { x: cx - w2, y: cy },           // Left
            { x: cx - w4, y: cy - h2 },      // Top-left
            { x: cx + w4, y: cy - h2 }       // Top-right
        ];

        // Find closest point on hexagon boundary
        let closestPoint = vertices[0];
        let minDist = this.distance(referencePoint, closestPoint);

        // Check each edge of the hexagon
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];

            const projected = this.projectPointOnSegment(referencePoint, p1, p2);
            const dist = this.distance(referencePoint, projected);

            if (dist < minDist) {
                minDist = dist;
                closestPoint = projected;
            }
        }

        // Apply offset if needed
        if (offset !== 0) {
            closestPoint = this.applyOffset(closestPoint, referencePoint, offset);
        }

        return closestPoint;
    }

    private distance(p1: Point, p2: Point): number {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private projectPointOnSegment(point: Point, segmentStart: Point, segmentEnd: Point): Point {
        const dx = segmentEnd.x - segmentStart.x;
        const dy = segmentEnd.y - segmentStart.y;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return segmentStart;
        }

        // Calculate projection parameter t
        const t = Math.max(0, Math.min(1,
            ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / lengthSquared
        ));

        return {
            x: segmentStart.x + t * dx,
            y: segmentStart.y + t * dy
        };
    }

    private applyOffset(anchorPoint: Point, referencePoint: Point, offset: number): Point {
        const dx = referencePoint.x - anchorPoint.x;
        const dy = referencePoint.y - anchorPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return anchorPoint;
        }

        return {
            x: anchorPoint.x - (dx / length) * offset,
            y: anchorPoint.y - (dy / length) * offset
        };
    }
}

/**
 * Dynamic anchor computer that chooses anchor side based on reference point direction.
 * Places anchors on the four cardinal sides of rectangular bounds.
 */
@injectable()
export class DynamicAnchor implements IAnchorComputer {
    static readonly KIND = 'dynamic';

    get kind() {
        return DynamicAnchor.KIND;
    }

    getAnchor(
        connectable: SConnectableElementImpl,
        referencePoint: Point,
        offset: number = 0
    ): Point {
        const bounds = connectable.bounds;
        const center = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
        };

        // Calculate angle from center to reference point
        const angle = Math.atan2(
            referencePoint.y - center.y,
            referencePoint.x - center.x
        );

        // Determine which side based on angle (in radians)
        // Right: -π/4 to π/4
        // Bottom: π/4 to 3π/4
        // Left: 3π/4 to -3π/4 (wrapped)
        // Top: -3π/4 to -π/4

        let anchor: Point;

        const absAngle = Math.abs(angle);
        const quarterPi = Math.PI / 4;
        const threeQuarterPi = 3 * Math.PI / 4;

        if (absAngle < quarterPi) {
            // Right side
            anchor = {
                x: bounds.x + bounds.width,
                y: center.y
            };
        } else if (absAngle > threeQuarterPi) {
            // Left side
            anchor = {
                x: bounds.x,
                y: center.y
            };
        } else if (angle > 0) {
            // Bottom side
            anchor = {
                x: center.x,
                y: bounds.y + bounds.height
            };
        } else {
            // Top side
            anchor = {
                x: center.x,
                y: bounds.y
            };
        }

        // Apply offset
        if (offset !== 0) {
            const dx = referencePoint.x - anchor.x;
            const dy = referencePoint.y - anchor.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > 0) {
                anchor = {
                    x: anchor.x - (dx / length) * offset,
                    y: anchor.y - (dy / length) * offset
                };
            }
        }

        return anchor;
    }
}

