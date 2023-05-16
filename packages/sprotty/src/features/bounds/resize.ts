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

import { Dimension } from "sprotty-protocol/lib/utils/geometry";
import { Animation } from "../../base/animations/animation";
import { SModelRootImpl, SModelElementImpl } from "../../base/model/smodel";
import { CommandExecutionContext } from "../../base/commands/command";
import { BoundsAware } from './model';

export interface ResolvedElementResize {
    element: SModelElementImpl & BoundsAware
    fromDimension: Dimension
    toDimension: Dimension
}

export class ResizeAnimation extends Animation {
    constructor(protected model: SModelRootImpl,
        public elementResizes: Map<string, ResolvedElementResize>,
        context: CommandExecutionContext,
        protected reverse: boolean = false) {
        super(context);
    }

    tween(t: number) {
        this.elementResizes.forEach(
            (elementResize) => {
                const element = elementResize.element;
                const newDimension: Dimension = (this.reverse) ? {
                        width: (1 - t) * elementResize.toDimension.width + t * elementResize.fromDimension.width,
                        height: (1 - t) * elementResize.toDimension.height + t * elementResize.fromDimension.height
                    } : {
                        width: (1 - t) * elementResize.fromDimension.width + t * elementResize.toDimension.width,
                        height: (1 - t) * elementResize.fromDimension.height + t * elementResize.toDimension.height
                    };
                element.bounds = {
                    x: element.bounds.x,
                    y: element.bounds.y,
                    width: newDimension.width,
                    height: newDimension.height
                };
            }
        );
        return this.model;
    }
}
