/********************************************************************************
 * Copyright (c) 2021 TypeFox and others.
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

import { ELLIPTIC_ANCHOR_KIND, RECTANGULAR_ANCHOR_KIND, DIAMOND_ANCHOR_KIND } from "./anchor";
import { injectable } from "inversify";
import { DiamondAnchor, EllipseAnchor, RectangleAnchor } from './polyline-anchors';
import { BezierEdgeRouter } from './bezier-edge-router';

@injectable()
export class BezierEllipseAnchor extends EllipseAnchor {

    override get kind() {
        return BezierEdgeRouter.KIND + ':' + ELLIPTIC_ANCHOR_KIND;
    }
}

@injectable()
export class BezierRectangleAnchor extends RectangleAnchor {

    override get kind() {
        return BezierEdgeRouter.KIND + ':' + RECTANGULAR_ANCHOR_KIND;
    }
}

@injectable()
export class BezierDiamondAnchor extends DiamondAnchor {

    override get kind() {
        return BezierEdgeRouter.KIND + ':' + DIAMOND_ANCHOR_KIND;
    }
}
