/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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

import { injectable } from "inversify";
import { center, maxDistance, Point } from "../utils/geometry";
import { SEdge } from "./sgraph";

export interface RoutedPoint extends Point {
    kind: 'source' | 'target' | 'linear'
    pointIndex?: number
}

export interface IEdgeRouter {
    route(edge: SEdge): RoutedPoint[]
}


export interface LinearRouteOptions {
    minimalPointDistance: number;
}

@injectable()
export class LinearEdgeRouter implements IEdgeRouter {
    route(edge: SEdge, options: LinearRouteOptions = { minimalPointDistance: 2 }): RoutedPoint[] {
        const source = edge.source;
        const target = edge.target;
        if (source === undefined || target === undefined) {
            return [];
        }

        let sourceAnchor: Point;
        let targetAnchor: Point;
        const rpCount = edge.routingPoints !== undefined ? edge.routingPoints.length : 0;
        if (rpCount >= 1) {
            // Use the first routing point as start anchor reference
            const p0 = edge.routingPoints[0];
            sourceAnchor = source.getTranslatedAnchor(p0, edge.parent, edge, edge.sourceAnchorCorrection);
            // Use the last routing point as end anchor reference
            const pn = edge.routingPoints[rpCount - 1];
            targetAnchor = target.getTranslatedAnchor(pn, edge.parent, edge, edge.targetAnchorCorrection);
        } else {
            // Use the target center as start anchor reference
            const startRef = center(target.bounds);
            sourceAnchor = source.getTranslatedAnchor(startRef, target.parent, edge, edge.sourceAnchorCorrection);
            // Use the source center as end anchor reference
            const endRef = center(source.bounds);
            targetAnchor = target.getTranslatedAnchor(endRef, source.parent, edge, edge.targetAnchorCorrection);
        }

        const result: RoutedPoint[] = [];
        result.push({ kind: 'source', x: sourceAnchor.x, y: sourceAnchor.y });
        for (let i = 0; i < rpCount; i++) {
            const p = edge.routingPoints[i];
            if (i > 0 && i < rpCount - 1
                || i === 0 && maxDistance(sourceAnchor, p) >= options.minimalPointDistance + (edge.sourceAnchorCorrection || 0)
                || i === rpCount - 1 && maxDistance(p, targetAnchor) >= options.minimalPointDistance + (edge.targetAnchorCorrection || 0)) {
                result.push({ kind: 'linear', x: p.x, y: p.y, pointIndex: i });
            }
        }
        result.push({ kind: 'target', x: targetAnchor.x, y: targetAnchor.y});
        return result;
    }
}
