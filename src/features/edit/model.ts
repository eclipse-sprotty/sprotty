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

import { Point, angleBetweenPoints } from '../../utils/geometry';
import { SModelElement, SChildElement, SParentElement } from '../../base/model/smodel';
import { SModelExtension } from '../../base/model/smodel-extension';
import { Selectable, selectFeature } from '../select/model';
import { moveFeature } from '../move/model';
import { Hoverable, hoverFeedbackFeature } from '../hover/model';
import { RoutedPoint } from '../../graph/routing';
import { SDanglingAnchor } from '../../graph/sgraph';

export const editFeature = Symbol('editFeature');

export interface Routable extends SModelExtension {
    routingPoints: Point[];
    readonly source?: SModelElement;
    readonly target?: SModelElement;
    sourceId?: string,
    targetId?: string,
    route(): RoutedPoint[];
}

export function isRoutable<T extends SModelElement>(element: T): element is T & Routable {
    return (element as any).routingPoints !== undefined && typeof((element as any).route) === 'function';
}

export function canEditRouting(element: SModelElement): element is SModelElement & Routable {
    return isRoutable(element) && element.hasFeature(editFeature);
}

export type RoutingHandleKind = 'junction' | 'line' | 'source' | 'target';

export class SRoutingHandle extends SChildElement implements Selectable, Hoverable {
    /**
     * 'junction' is a point where two line segments meet,
     * 'line' is a volatile handle placed on a line segment,
     * 'source' and 'target are the respective anchors.
     */
    kind: RoutingHandleKind;
    /** The actual routing point index (junction) or the previous point index (line). */
    pointIndex: number;
    /** Whether the routing point is being dragged. */
    editMode: boolean = false;

    hoverFeedback: boolean = false;
    selected: boolean = false;
    danglingAnchor?: SDanglingAnchor;

    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || feature === moveFeature || feature === hoverFeedbackFeature;
    }
}

/** The angle in radians below which a routing handle is removed. */
const HANDLE_REMOVE_THRESHOLD = 0.1;

/**
 * Remove routed points that are in edit mode and for which the angle between the preceding and
 * following points falls below a threshold.
 */
export function filterEditModeHandles(route: RoutedPoint[], parent: SParentElement): RoutedPoint[] {
    if (parent.children.length === 0)
        return route;

    let i = 0;
    while (i < route.length) {
        const curr = route[i];
        if (curr.pointIndex !== undefined) {
            const handle: SRoutingHandle | undefined = parent.children.find(child =>
                child instanceof SRoutingHandle && child.kind === 'junction' && child.pointIndex === curr.pointIndex) as any;
            if (handle !== undefined && handle.editMode && i > 0 && i < route.length - 1) {
                const prev = route[i - 1], next = route[i + 1];
                const prevDiff: Point = { x: prev.x - curr.x, y: prev.y - curr.y };
                const nextDiff: Point = { x: next.x - curr.x, y: next.y - curr.y };
                const angle = angleBetweenPoints(prevDiff, nextDiff);
                if (Math.abs(Math.PI - angle) < HANDLE_REMOVE_THRESHOLD) {
                    route.splice(i, 1);
                    continue;
                }
            }
        }
        i++;
    }
    return route;
}
