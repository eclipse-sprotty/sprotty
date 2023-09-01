/********************************************************************************
 * Copyright (c) 2017-2022 TypeFox and others.
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

import { Bounds, Point, toDegrees } from 'sprotty-protocol';

/**
 * Represents an object's insets, for top, bottom, left and right
 */
export interface Insets {
    top: number
    bottom: number
    left: number
    right: number
}

export type Orientation = 'north' | 'south' | 'east' | 'west';

/**
 * A diamond or rhombus is a quadrilateral whose four sides all have the same length.
 * It consists of four points, a `topPoint`, `rightPoint`, `bottomPoint`, and a `leftPoint`,
 * which are connected by four lines -- the `topRightSideLight`, `topLeftSideLine`, `bottomRightSideLine`,
 * and the `bottomLeftSideLine`.
 */
export class Diamond {

    constructor(protected bounds: Bounds) { }

    get topPoint(): Point {
        return {
            x: this.bounds.x + this.bounds.width / 2,
            y: this.bounds.y
        };
    }

    get rightPoint(): Point {
        return {
            x: this.bounds.x + this.bounds.width,
            y: this.bounds.y + this.bounds.height / 2
        };
    }

    get bottomPoint(): Point {
        return {
            x: this.bounds.x + this.bounds.width / 2,
            y: this.bounds.y + this.bounds.height
        };
    }

    get leftPoint(): Point {
        return {
            x: this.bounds.x,
            y: this.bounds.y + this.bounds.height / 2
        };
    }

    get topRightSideLine(): Line {
        return new PointToPointLine(this.topPoint, this.rightPoint);
    }

    get topLeftSideLine(): Line {
        return new PointToPointLine(this.topPoint, this.leftPoint);
    }

    get bottomRightSideLine(): Line {
        return new PointToPointLine(this.bottomPoint, this.rightPoint);
    }

    get bottomLeftSideLine(): Line {
        return new PointToPointLine(this.bottomPoint, this.leftPoint);
    }

    /**
     * Return the closest side of this diamond to the specified `refPoint`.
     * @param {Point} refPoint a reference point
     * @returns {Line} a line representing the closest side
     */
    closestSideLine(refPoint: Point): Line {
        const c = Bounds.center(this.bounds);
        if (refPoint.x > c.x) {
            if (refPoint.y > c.y) {
                return this.bottomRightSideLine;
            } else {
                return this.topRightSideLine;
            }
        } else {
            if (refPoint.y > c.y) {
                return this.bottomLeftSideLine;
            } else {
                return this.topLeftSideLine;
            }
        }
    }
}

/**
 * A line represented in its standard form `a*x + b*y = c`.
 */
export interface Line {
    readonly a: number
    readonly b: number
    readonly c: number
}

export type CardinalDirection =
    'north' | 'north-east' | 'east' | 'south-east' |
    'south' | 'south-west' | 'west' | 'north-west';

/**
 * A line made up from two points.
 */
export class PointToPointLine implements Line {

    constructor(public p1: Point, public p2: Point) { }

    get a(): number {
        return this.p1.y - this.p2.y;
    }

    get b(): number {
        return this.p2.x - this.p1.x;
    }

    get c(): number {
        return this.p2.x * this.p1.y - this.p1.x * this.p2.y;
    }

    /**
     * The counter-clockwise angle of this line relative to the x-axis.
     */
    get angle(): number {
        return Math.atan2(-this.a, this.b);
    }

    /**
     * The slope of the line.
     * A vertical line returns `undefined`.
     */
    get slope(): number | undefined {
        if (this.b === 0) return undefined;
        return this.a / this.b;
    }

    /**
     * The slope of the line or `Number.MAX_SAFE_INTEGER` if vertical.
     */
    get slopeOrMax(): number {
        if (this.slope === undefined) {
            return Number.MAX_SAFE_INTEGER;
        }
        return this.slope;
    }

    /**
     * The direction of this line, such as 'north', 'south', or 'south-west'.
     */
    get direction(): CardinalDirection {
        const hDegrees = toDegrees(this.angle);
        const degrees = hDegrees < 0 ? 360 + hDegrees : hDegrees;
        // degrees are relative to the x-axis
        if (degrees === 90) {
            return 'south';
        } else if (degrees === 0 || degrees === 360) {
            return 'east';
        } else if (degrees === 270) {
            return 'north';
        } else if (degrees === 180) {
            return 'west';
        } else if (degrees > 0 && degrees < 90) {
            return 'south-east';
        } else if (degrees > 90 && degrees < 180) {
            return 'south-west';
        } else if (degrees > 180 && degrees < 270) {
            return 'north-west';
        } else if (degrees > 270 && degrees < 360) {
            return 'north-east';
        }
        throw new Error(`Cannot determine direction of line (${this.p1.x},${this.p1.y}) to (${this.p2.x},${this.p2.y})`);
    }

    /**
     * @param otherLine the other line
     * @returns the intersection point between `this` line and the `otherLine` if exists, or `undefined`.
     */
    intersection(otherLine: PointToPointLine): Point | undefined {
        if (this.hasIndistinctPoints(otherLine)) {
            return undefined;
        }

        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;
        const x3 = otherLine.p1.x;
        const y3 = otherLine.p1.y;
        const x4 = otherLine.p2.x;
        const y4 = otherLine.p2.y;

        const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
        if (denominator === 0) {
            return undefined;
        }
        const numeratorA = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
        const numeratorB = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));
        if (numeratorA === 0 && numeratorB === 0) {
            return undefined;
        }

        const determinantA = numeratorA / denominator;
        const determinantB = numeratorB / denominator;
        if (determinantA < 0 || determinantA > 1 || determinantB < 0 || determinantB > 1) {
            return undefined;
        }

        const x = x1 + (determinantA * (x2 - x1));
        const y = y1 + (determinantA * (y2 - y1));
        return { x, y };
    }

    /**
     * @param otherLine the other line
     * @returns whether the start and end point of this line is does not have distinct start
     * or end points with the `otherLine`
     */
    hasIndistinctPoints(otherLine: PointToPointLine): boolean {
        return Point.equals(this.p1, otherLine.p1) ||
            Point.equals(this.p1, otherLine.p2) ||
            Point.equals(this.p2, otherLine.p1) ||
            Point.equals(this.p2, otherLine.p2);
    }
}

/**
 * Returns the intersection of two lines `l1` and `l2`
 * @param {Line} l1 - A line
 * @param {Line} l2 - Another line
 * @returns {Point} The intersection point of `l1` and `l2`
 */
export function intersection(l1: Line, l2: Line): Point {
    return {
        x: (l1.c * l2.b - l2.c * l1.b) / (l1.a * l2.b - l2.a * l1.b),
        y: (l1.a * l2.c - l2.a * l1.c) / (l1.a * l2.b - l2.a * l1.b)
    };
}

/**
 * A minimum and maximum value of a numeric type.
 */
export interface Limits {
    min: number
    max: number
}

/**
 * Limits a value to the specified `limits`.
 * @param {number} value - The value to limit
 * @param {Limits} limits - The minimum and maximum limits
 */
export function limit(value: number, limits: Limits): number {
    if (value < limits.min) {
        return limits.min;
    }
    if (value > limits.max) {
        return limits.max;
    }
    return value;
}
