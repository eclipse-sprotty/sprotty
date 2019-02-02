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

import { SModelExtension } from "../../base/model/smodel-extension";
import { SModelElement, SChildElement } from "../../base/model/smodel";
import { BoundsAware, isBoundsAware } from "../bounds/model";
import { SRoutableElement } from "../routing/model";

export const edgeLayoutFeature = Symbol('edgeLayout');

export interface EdgeLayoutable extends SModelExtension {
    edgePlacement: EdgePlacement
}

export function isEdgeLayoutable<T extends SModelElement>(element: T): element is T & SChildElement & BoundsAware & EdgeLayoutable {
    return element instanceof SChildElement
        && element.parent instanceof SRoutableElement
        && 'edgePlacement' in element
        && isBoundsAware(element)
        && element.hasFeature(edgeLayoutFeature);
}

export type EdgeSide = 'left' | 'right' | 'top' | 'bottom' | 'on';

export class EdgePlacement extends Object {
    /**
     * true, if the label should be rotated to touch the edge tangentially
     */
    rotate: boolean;

    /**
     * where is the label relative to the line's direction
     */
    side: EdgeSide;

    /**
     * between 0 (source anchor) and 1 (target anchor)
     */
    position: number;

    /**
     * space between label and edge/connected nodes
     */
    offset: number;
}

export const DEFAULT_EDGE_PLACEMENT: EdgePlacement = {
    rotate: true,
    side: 'top',
    position: 0.5,
    offset: 7
};
