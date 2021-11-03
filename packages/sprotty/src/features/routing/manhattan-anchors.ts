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

import { center, Point, Bounds, Line, PointToPointLine, intersection, subtract } from "../../utils/geometry";
import { RECTANGULAR_ANCHOR_KIND, IAnchorComputer, DIAMOND_ANCHOR_KIND, ELLIPTIC_ANCHOR_KIND } from "./anchor";
import { ManhattanEdgeRouter } from "./manhattan-edge-router";
import { SConnectableElement } from "./model";
import { injectable } from "inversify";

@injectable()
export class ManhattanRectangularAnchor implements IAnchorComputer {

    static KIND = ManhattanEdgeRouter.KIND + ':' + RECTANGULAR_ANCHOR_KIND;

    get kind() {
        return ManhattanRectangularAnchor.KIND;
    }

    getAnchor(connectable: SConnectableElement, refPoint: Point, offset: number): Point {
        const b = connectable.bounds;
        if (b.width <= 0 || b.height <= 0) {
            return b;
        }
        const bounds: Bounds = {
            x: b.x - offset,
            y: b.y - offset,
            width: b.width + 2 * offset,
            height: b.height + 2 * offset
        };
        if (refPoint.x >= bounds.x && bounds.x + bounds.width >= refPoint.x) {
            if (refPoint.y < bounds.y + 0.5 * bounds.height)
            return { x: refPoint.x, y: bounds.y };
            else
            return { x: refPoint.x, y: bounds.y + bounds.height };
        }
        if (refPoint.y >= bounds.y && bounds.y + bounds.height >= refPoint.y) {
            if (refPoint.x < bounds.x + 0.5 * bounds.width)
            return { x: bounds.x, y: refPoint.y };
            else
            return { x: bounds.x + bounds.width, y: refPoint.y };
        }
        return center(bounds);
    }
}

@injectable()
export class ManhattanDiamondAnchor implements IAnchorComputer {

    static KIND = ManhattanEdgeRouter.KIND + ':' + DIAMOND_ANCHOR_KIND;

    get kind() {
        return ManhattanDiamondAnchor.KIND;
    }

    getAnchor(connectable: SConnectableElement, refPoint: Point, offset: number = 0): Point {
        const b = connectable.bounds;
        if (b.width <= 0 || b.height <= 0) {
            return b;
        }
        const bounds = {
            x: b.x - offset,
            y: b.y - offset,
            width: b.width + 2 * offset,
            height: b.height + 2 * offset
        };
        const c = center(bounds);

        let outline: Line | undefined = undefined;
        let refLine: Line | undefined = undefined;
        if (refPoint.x >= bounds.x && refPoint.x <= bounds.x + bounds.width) {
            if (bounds.x + 0.5 * bounds.width >= refPoint.x) {
                refLine = new PointToPointLine(refPoint, { x: refPoint.x, y: c.y });
                if (refPoint.y < c.y)
                    outline = new PointToPointLine({ x: bounds.x, y: c.y }, { x: c.x, y: bounds.y });
                else
                    outline = new PointToPointLine({ x: bounds.x, y: c.y }, { x: c.x, y: bounds.y + bounds.height });
            } else {
                refLine = new PointToPointLine(refPoint, { x: refPoint.x, y: c.y });
                if (refPoint.y < c.y)
                    outline = new PointToPointLine({ x: bounds.x + bounds.width, y: c.y }, { x: c.x, y: bounds.y });
                else
                    outline = new PointToPointLine({ x: bounds.x + bounds.width, y: c.y }, { x: c.x, y: bounds.y + bounds.height });
            }
        } else if (refPoint.y >= bounds.y && refPoint.y <= bounds.y + bounds.height) {
            if (bounds.y + 0.5 * bounds.height >= refPoint.y) {
                refLine = new PointToPointLine(refPoint, { x: c.x , y: refPoint.y });
                if (refPoint.x < c.x)
                    outline = new PointToPointLine({ x: bounds.x, y: c.y }, { x: c.x, y: bounds.y });
                else
                    outline = new PointToPointLine({ x: bounds.x + bounds.width, y: c.y }, { x: c.x, y: bounds.y });
            } else {
                refLine = new PointToPointLine(refPoint, { x: c.x , y: refPoint.y });
                if (refPoint.x < c.x)
                    outline = new PointToPointLine({ x: bounds.x, y: c.y }, { x: c.x, y: bounds.y + bounds.height });
                else
                    outline = new PointToPointLine({ x: bounds.x + bounds.width, y: c.y }, { x: c.x, y: bounds.y + bounds.height });
            }
        }
        if (!!refLine && !!outline)
            return intersection(outline, refLine);
        else
            return c;
    }
}

@injectable()
export class ManhattanEllipticAnchor implements IAnchorComputer {

    static KIND = ManhattanEdgeRouter.KIND + ':' + ELLIPTIC_ANCHOR_KIND;

    get kind() {
        return ManhattanEllipticAnchor.KIND;
    }

    getAnchor(connectable: SConnectableElement, refPoint: Point, offset: number = 0): Point {
        const b = connectable.bounds;
        if (b.width <= 0 || b.height <= 0) {
            return b;
        }
        const bounds = {
            x: b.x - offset,
            y: b.y - offset,
            width: b.width + 2 * offset,
            height: b.height + 2 * offset
        };
        const c = center(bounds);
        const refRelative = subtract(refPoint, c);
        let x = c.x;
        let y = c.y;
        if (refPoint.x >= bounds.x && bounds.x + bounds.width >= refPoint.x) {
            x += refRelative.x;
            const dy = 0.5 * bounds.height * Math.sqrt(1 - (refRelative.x * refRelative.x) / (0.25 * bounds.width * bounds.width));
            if (refRelative.y < 0)
                y -= dy;
            else
                y += dy;
        } else if (refPoint.y >= bounds.y && bounds.y + bounds.height >= refPoint.y) {
            y += refRelative.y;
            const dx = 0.5 * bounds.width * Math.sqrt(1 - (refRelative.y * refRelative.y) / (0.25 * bounds.height * bounds.height));
            if (refRelative.x < 0)
                x -= dx;
            else
                x += dx;
        }
        return { x, y };
    }
}
