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

import { SNodeSchema, Bounds, moveFeature, CircularNode, RectangularNode } from "../../../src";

export interface TaskNodeSchema extends SNodeSchema {
    name?: string
    status?: string
    kernelNr: number
}

export class TaskNode extends CircularNode {
    name: string = '';
    status?: string;
    kernelNr: number;

    hasFeature(feature: symbol): boolean {
        if (feature === moveFeature)
            return false;
        else
            return super.hasFeature(feature);
    }
}

export interface BarrierNodeSchema extends SNodeSchema {
    name: string
}

export class BarrierNode extends RectangularNode {
    name: string = '';
    bounds: Bounds = { x: 0, y: 0, width: 50, height: 20 };

    hasFeature(feature: symbol): boolean {
        if (feature === moveFeature)
            return false;
        else
            return super.hasFeature(feature);
    }
}
