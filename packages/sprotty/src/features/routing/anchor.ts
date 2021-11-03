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

import { injectable, multiInject } from "inversify";
import { TYPES } from "../../base/types";
import { Point } from "../../utils/geometry";
import { InstanceRegistry } from "../../utils/registry";
import { SConnectableElement } from "./model";

export const DIAMOND_ANCHOR_KIND = 'diamond';
export const ELLIPTIC_ANCHOR_KIND = 'elliptic';
export const RECTANGULAR_ANCHOR_KIND = 'rectangular';

export interface IAnchorComputer {
    readonly kind: string;

    /**
     * Compute an anchor position for routing an edge towards this element.
     *
     * The default implementation returns the element's center point. If edges should be connected
     * differently, e.g. to some point on the boundary of the element's view, the according computation
     * should be implemented in a subclass by overriding this method.
     *
     * @param connectable The node or port an edge should be connected to.
     * @param referencePoint The point from which the edge is routed towards this elemet, in the same
     *                       coordintae system as the connectable.
     * @param offset An optional offset value to be considered in the anchor computation;
     *               positive values should shift the anchor away from this element, negative values
     *               should shift the anchor more to the inside. Use this to adapt ot arrow heads.
     */
    getAnchor(connectable: SConnectableElement, referencePoint: Point, offset?: number): Point;
}


@injectable()
export class AnchorComputerRegistry extends InstanceRegistry<IAnchorComputer> {

    constructor(@multiInject(TYPES.IAnchorComputer) anchors: IAnchorComputer[]) {
        super();
        anchors.forEach(anchor => this.register(anchor.kind, anchor));
    }

    protected get defaultAnchorKind() {
        return RECTANGULAR_ANCHOR_KIND;
    }

    get(routerKind: string, anchorKind?: string): IAnchorComputer {
        return super.get(`${routerKind}:${anchorKind || this.defaultAnchorKind}`);
    }
}
