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

import { injectable, inject } from 'inversify';
import { VNode } from 'snabbdom';
import { Bounds, Point, toDegrees } from 'sprotty-protocol/lib/utils/geometry';
import { EdgeLayoutable, EdgePlacement } from 'sprotty-protocol/lib/model';
import { SModelElementImpl, SChildElementImpl } from '../../base/model/smodel';
import { IVNodePostprocessor } from '../../base/views/vnode-postprocessor';
import { setAttr } from '../../base/views/vnode-utils';
import { SEdgeImpl } from '../../graph/sgraph';
import { Orientation } from '../../utils/geometry';
import { isAlignable, InternalBoundsAware } from '../bounds/model';
import { DEFAULT_EDGE_PLACEMENT, isEdgeLayoutable, checkEdgePlacement } from './model';
import { EdgeRouterRegistry } from '../routing/routing';
import { TYPES } from '../../base/types';
import { ILogger } from '../../utils/logging';
import { isMoveable } from '../move/model';

@injectable()
export class EdgeLayoutPostprocessor implements IVNodePostprocessor {

    @inject(EdgeRouterRegistry) edgeRouterRegistry: EdgeRouterRegistry;
    @inject(TYPES.ILogger) protected readonly logger: ILogger;

    /**
     * Decorates the vnode with the appropriate transformation based on the element's placement and bounds.
     * @param vnode - The vnode to decorate.
     * @param element - The SModelElementImpl to decorate.
     * @returns The decorated vnode.
     */
    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (isEdgeLayoutable(element) && element.parent instanceof SEdgeImpl) {
            if (element.bounds !== Bounds.EMPTY) {
                const actualBounds = element.bounds;
                const hasOwnPlacement = checkEdgePlacement(element);
                const placement = this.getEdgePlacement(element);
                const edge = element.parent;
                const position = Math.min(1, Math.max(0, placement.position));
                const router = this.edgeRouterRegistry.get(edge.routerKind);
                // point on edge derived from edgePlacement.position
                const pointOnEdge = router.pointAt(edge, position);
                let transform = '';
                // get the relative position on segment. This can be later changed if the moveMode is set to 'edge'.
                let derivativeOnEdge = router.derivativeAt(edge, position);;
                // Check if edgeplacement is set. If not the label is freely movable if movefeature is enabled for such labels.
                if (pointOnEdge) {
                    if (hasOwnPlacement) {
                        switch (placement.moveMode) {
                            case 'edge':
                                // Find orthogonal intersection point on edge and use it as the label's position
                                const orthogonalPoint = router.findOrthogonalIntersection(edge, Point.add(pointOnEdge, actualBounds));
                                if (orthogonalPoint) {
                                    derivativeOnEdge = orthogonalPoint.derivative;
                                    transform += `translate(${orthogonalPoint.point.x}, ${orthogonalPoint.point.y})`;
                                }
                                break;
                            case 'free':
                                // Calculation of potential free movement. Just add the actual bounds to the point on edge.
                                transform += `translate(${(pointOnEdge?.x ?? 0) + actualBounds.x}, ${(pointOnEdge?.y ?? 0) + actualBounds.y})`;;
                                break;
                            case 'none':
                                transform += `translate(${pointOnEdge.x}, ${pointOnEdge.y})`;
                                break;
                            default:
                                this.logger.error({}, 'No moveMode set for edge label. Skipping edge placement.');
                                break;
                        }
                        if (derivativeOnEdge) {
                            const angle = toDegrees(Math.atan2(derivativeOnEdge.y, derivativeOnEdge.x));
                            if (placement.rotate) {
                                let flippedAngle = angle;
                                // Flip angle if it exceeds 90 degrees
                                if (Math.abs(angle) > 90) {
                                    if (angle < 0)
                                        flippedAngle += 180;
                                    else if (angle > 0)
                                        flippedAngle -= 180;
                                }
                                transform += ` rotate(${flippedAngle})`;
                                // Get rotated alignment based on flipped angle
                                const alignment = this.getRotatedAlignment(element, placement, flippedAngle !== angle);
                                transform += ` translate(${alignment.x}, ${alignment.y})`;
                            } else {
                                // Get alignment based on angle
                                const alignment = this.getAlignment(element, placement, angle);
                                transform += ` translate(${alignment.x}, ${alignment.y})`;
                            }
                        }
                    } else {
                        // if the element is moveable and no placement is specified, the label is freely movable (i.e. moveMode = 'free').
                        // Otherwise it is fixed to its position (i.e. moveMode = 'none').
                        if (isMoveable(element)) {
                            transform += `translate(${(pointOnEdge?.x ?? 0) + actualBounds.x}, ${(pointOnEdge?.y ?? 0) + actualBounds.y})`;;
                        } else {
                            transform += `translate(${pointOnEdge.x}, ${pointOnEdge.y})`;
                        }
                    }
                }
                setAttr(vnode, 'transform', transform);
            }
        }
        return vnode;
    }

    protected getRotatedAlignment(element: EdgeLayoutable & SModelElementImpl & InternalBoundsAware, placement: EdgePlacement, flip: boolean) {
        let x = isAlignable(element) ? element.alignment.x : 0;
        let y = isAlignable(element) ? element.alignment.y : 0;
        const bounds = element.bounds;
        if (placement.side === 'on')
            return { x: x - 0.5 * bounds.height, y: y - 0.5 * bounds.height};
        if (flip) {
            if (placement.position < 0.3333333)
                x -= bounds.width + placement.offset;
            else if (placement.position < 0.6666666)
                x -= 0.5 * bounds.width;
            else
                x += placement.offset;
            switch (placement.side) {
                case 'left':
                case 'bottom':
                    y -= placement.offset + bounds.height;
                    break;
                case 'right':
                case 'top':
                    y += placement.offset;
            }
        } else {
            if (placement.position < 0.3333333)
                x += placement.offset;
            else if (placement.position < 0.6666666)
                x -= 0.5 * bounds.width;
            else
                x -= bounds.width + placement.offset;
            switch (placement.side) {
                case 'right':
                case 'bottom':
                    y += - placement.offset - bounds.height;
                    break;
                case 'left':
                case 'top':
                    y += placement.offset;
            }
        }
        return { x, y };
    }

    protected getEdgePlacement(element: SModelElementImpl): EdgePlacement {
        let current = element;
        const allPlacements: EdgePlacement[] = [];
        while (current !== undefined) {
            const placement = (current as any).edgePlacement;
            if (placement !== undefined)
                allPlacements.push(placement);
            if (current instanceof SChildElementImpl)
                current = current.parent;
            else
                break;
        }
        const edgePlacement = allPlacements.reverse().reduce(
            (a, b) => { return {...a, ...b}; }, DEFAULT_EDGE_PLACEMENT);

        if (!edgePlacement.moveMode) {
            edgePlacement.moveMode = isMoveable(element) ? 'edge' : 'none';
        }

        return edgePlacement;
    }

    protected getAlignment(label: EdgeLayoutable & SModelElementImpl & InternalBoundsAware, placement: EdgePlacement, angle: number): Point {
        const bounds = label.bounds;
        const x = isAlignable(label) ? label.alignment.x - bounds.width : 0;
        const y = isAlignable(label) ? label.alignment.y - bounds.height : 0;
        if (placement.side === 'on') {
            return { x: x + 0.5 * bounds.width, y: y + 0.5 * bounds.height};
        }
        const quadrant = this.getQuadrant(angle);
        const midLeft = { x: placement.offset, y: y + 0.5 * bounds.height };
        const topLeft = { x: placement.offset, y: y + bounds.height + placement.offset };
        const topRight = { x: -bounds.width - placement.offset, y: y + bounds.height + placement.offset};
        const midRight = { x: -bounds.width - placement.offset, y: y + 0.5 * bounds.height };
        const bottomRight = { x: -bounds.width - placement.offset, y: y - placement.offset};
        const bottomLeft = { x: placement.offset, y: y - placement.offset};
        switch (placement.side) {
            case 'left':
                switch (quadrant.orientation) {
                    case 'west':
                        return Point.linear(topLeft, topRight, quadrant.position);
                    case 'north':
                        return Point.linear(topRight, bottomRight, quadrant.position);
                    case 'east':
                        return Point.linear(bottomRight, bottomLeft, quadrant.position);
                    case 'south':
                        return Point.linear(bottomLeft, topLeft, quadrant.position);
                }
                break;
            case 'right':
                switch (quadrant.orientation) {
                    case 'west':
                        return Point.linear(bottomRight, bottomLeft, quadrant.position);
                    case 'north':
                        return Point.linear(bottomLeft, topLeft, quadrant.position);
                    case 'east':
                        return Point.linear(topLeft, topRight, quadrant.position);
                    case 'south':
                        return Point.linear(topRight, bottomRight, quadrant.position);
                }
                break;
            case 'top':
                switch (quadrant.orientation) {
                    case 'west':
                        return Point.linear(bottomRight, bottomLeft, quadrant.position);
                    case 'north':
                        return this.linearFlip(bottomLeft, midLeft, midRight, bottomRight, quadrant.position);
                    case 'east':
                        return Point.linear(bottomRight, bottomLeft, quadrant.position);
                    case 'south':
                        return this.linearFlip(bottomLeft, midLeft, midRight, bottomRight, quadrant.position);
                }
                break;
            case 'bottom':
                switch (quadrant.orientation) {
                    case 'west':
                        return Point.linear(topLeft, topRight, quadrant.position);
                    case 'north':
                        return this.linearFlip(topRight, midRight, midLeft, topLeft, quadrant.position);
                    case 'east':
                        return Point.linear(topLeft, topRight, quadrant.position);
                    case 'south':
                        return this.linearFlip(topRight, midRight, midLeft, topLeft, quadrant.position);
                }
                break;
        }
        return {x: 0, y: 0};
    }

    protected getQuadrant(angle: number): {orientation: Orientation, position: number} {
        if (Math.abs(angle) > 135)
            return { orientation: 'west', position: (angle > 0 ? angle - 135 : angle + 225) / 90 };
        else if (angle < -45)
            return { orientation: 'north', position: (angle + 135) / 90 };
        else if (angle < 45)
            return { orientation: 'east', position: (angle + 45) / 90 };
        else
            return { orientation: 'south', position: (angle - 45) / 90 };
    }

    protected linearFlip(p0: Point, p1: Point, p2: Point, p3: Point, position: number) {
        return position < 0.5 ? Point.linear(p0, p1, 2 * position) : Point.linear(p2, p3, 2 * position - 1);
    }

    postUpdate(): void {}
}
