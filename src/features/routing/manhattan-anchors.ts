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

import { center, Point, Bounds } from "../../utils/geometry";
import { RECTANGULAR_ANCHOR_KIND, IAnchorComputer } from "./anchor";
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
        const bounds: Bounds = {
            x: b.x - offset,
            y: b.y - offset,
            width: b.width + 2 * offset,
            height: b.height + 2 * offset
        };
        if (!refPoint)
            console.log('Oh my');
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
