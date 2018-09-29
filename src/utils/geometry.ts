/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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

/**
 * A Point is composed of the (x,y) coordinates of an object.
 */
export interface Point {
    readonly x: number
    readonly y: number
}

/**
 * (x,y) coordinates of the origin.
 */
export const ORIGIN_POINT: Point = Object.freeze({
    x: 0,
    y: 0
});

/**
 * Adds two points.
 * @param {Point} p1 - First point
 * @param {Point} p2 - Second point
 * @returns {Point} The sum of the two points
 */
export function add(p1: Point, p2: Point): Point {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}

/**
 * Subtracts two points.
 * @param {Point} p1 - First point
 * @param {Point} p2 - Second point
 * @returns {Point} The difference of the two points
 */
export function subtract(p1: Point, p2: Point): Point {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}

/**
 * The Dimension of an object is composed of its width and height.
 */
export interface Dimension {
    readonly width: number
    readonly height: number
}

/**
 * A dimension with both width and height set to a negative value, which is considered as undefined.
 */
export const EMPTY_DIMENSION: Dimension = Object.freeze({
    width: -1,
    height: -1
});

/**
 * Checks whether the given dimention is valid, i.e. the width and height are non-zero.
 * @param {Dimension} b - Dimension object
 * @returns {boolean}
 */
export function isValidDimension(d: Dimension): boolean {
    return d.width >= 0 && d.height >= 0;
}

/**
 * The bounds are the position (x, y) and dimension (width, height) of an object.
 */
export interface Bounds extends Point, Dimension {
}

export const EMPTY_BOUNDS: Bounds = Object.freeze({
    x: 0,
    y: 0,
    width: -1,
    height: -1
});

export function isBounds(element: any): element is Bounds {
    return 'x' in element
        && 'y' in element
        && 'width' in element
        && 'height' in element;
}

/**
 * Combines the bounds of two objects into one, so that the new bounds
 * are the minimum bounds that covers both of the original bounds.
 * @param {Bounds} b0 - First bounds object
 * @param {Bounds} b1 - Second bounds object
 * @returns {Bounds} The combined bounds
 */
export function combine(b0: Bounds, b1: Bounds): Bounds {
    const minX = Math.min(b0.x, b1.x);
    const minY = Math.min(b0.y, b1.y);
    const maxX = Math.max(b0.x + (b0.width >= 0 ? b0.width : 0), b1.x + (b1.width >= 0 ? b1.width : 0));
    const maxY = Math.max(b0.y + (b0.height >= 0 ? b0.height : 0), b1.y + (b1.height >= 0 ? b1.height : 0));
    return {
        x: minX, y: minY, width: maxX - minX, height: maxY - minY
    };
}

/**
 * Translates the given bounds.
 * @param {Bounds} b - Bounds object
 * @param {Point} p - Vector by which to translate the bounds
 * @returns {Bounds} The translated bounds
 */
export function translate(b: Bounds, p: Point): Bounds {
    return {
        x: b.x + p.x,
        y: b.y + p.y,
        width: b.width,
        height: b.height
    };
}

/**
 * Returns the center point of the bounds of an object
 * @param {Bounds} b - Bounds object
 * @returns {Point} the center point
 */
export function center(b: Bounds): Point {
    return {
        x: b.x + (b.width >= 0 ? 0.5 * b.width : 0),
        y: b.y + (b.height >= 0 ? 0.5 * b.height : 0)
    };
}

export function centerOfLine(s: Point, e: Point): Point {
    const b: Bounds = {
        x: s.x > e.x ? e.x : s.x,
        y: s.y > e.y ? e.y : s.y,
        width: Math.abs(e.x - s.x),
        height: Math.abs(e.y - s.y)
    };
    return center(b);
}

/**
 * Checks whether the point p is included in the bounds b.
 */
export function includes(b: Bounds, p: Point): boolean {
    return p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
}

/**
 * Represents an object's insets, for top, bottom, left and right
 */
export interface Insets {
    top: number
    bottom: number
    left: number
    right: number
}

/**
 * Enumeration of possible directions (left, right, up, down)
 */
export enum Direction { left, right, up, down }

/**
 * Returns the "straight line" distance between two points.
 * @param {Point} a - First point
 * @param {Point} b - Second point
 * @returns {number} The Eucledian distance
 */
export function euclideanDistance(a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Returns the distance between two points in a grid, using a
 * strictly vertical and/or horizontal path (versus straight line).
 * @param {Point} a - First point
 * @param {Point} b - Second point
 * @returns {number} The Manhattan distance
 */
export function manhattanDistance(a: Point, b: Point): number {
    return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

/**
 * Returns the maximum of the horizontal and the vertical distance.
 * @param {Point} a - First point
 * @param {Point} b - Second point
 * @returns {number} The maximum distance
 */
export function maxDistance(a: Point, b: Point): number {
    return Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
}

/**
 * Computes the angle in radians of the given point to the x-axis of the coordinate system.
 * The result is in the range [-pi, pi].
 * @param {Point} p - A point in the Eucledian plane
 */
export function angleOfPoint(p: Point): number {
    return Math.atan2(p.y, p.x);
}

/**
 * Computes the angle in radians between the two given points (relative to the origin of the coordinate system).
 * The result is in the range [0, pi]. Returns NaN if the points are equal.
 * @param {Point} a - First point
 * @param {Point} b - Second point
 */
export function angleBetweenPoints(a: Point, b: Point): number {
    const lengthProduct = Math.sqrt((a.x * a.x + a.y * a.y) * (b.x * b.x + b.y * b.y));
    if (isNaN(lengthProduct) || lengthProduct === 0)
        return NaN;
    const dotProduct = a.x * b.x + a.y * b.y;
    return Math.acos(dotProduct / lengthProduct);
}

/**
 * Converts from radians to degrees
 * @param {number} a - A value in radians
 * @returns {number} The converted value
 */
export function toDegrees(a: number): number {
    return a * 180 / Math.PI;
}

/**
 * Converts from degrees to radians
 * @param {number} a - A value in degrees
 * @returns {number} The converted value
 */
export function toRadians(a: number): number {
    return a * Math.PI / 180;
}

/**
 * Returns whether two numbers are almost equal, within a small margin (0.001)
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {boolean} True if the two numbers are almost equal
 */
export function almostEquals(a: number, b: number): boolean {
    return Math.abs(a - b) < 1e-3;
}
