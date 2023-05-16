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

import { injectable, inject } from "inversify";
import { VNode } from "snabbdom";
import { SModelElementImpl, SChildElementImpl } from "../../base/model/smodel";
import { IVNodePostprocessor } from "../../base/views/vnode-postprocessor";
import { isDecoration, Decoration } from "./model";
import { setAttr } from "../../base/views/vnode-utils";
import { isSizeable } from "../bounds/model";
import { SRoutableElementImpl } from "../routing/model";
import { EdgeRouterRegistry } from "../routing/routing";
import { Point } from "sprotty-protocol";

@injectable()
export class DecorationPlacer implements IVNodePostprocessor {

    @inject(EdgeRouterRegistry) edgeRouterRegistry: EdgeRouterRegistry;

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (isDecoration(element)) {
            const position = this.getPosition(element);
            const translate = 'translate(' + position.x + ', ' + position.y + ')';
            setAttr(vnode, 'transform', translate);
        }
        return vnode;
    }

    protected getPosition(element: SModelElementImpl & Decoration): Point {
        if (element instanceof SChildElementImpl && element.parent instanceof SRoutableElementImpl) {
            const route =  this.edgeRouterRegistry.route(element.parent);
            if (route.length > 1) {
                const index = Math.floor(0.5  * (route.length - 1));
                const offset = isSizeable(element)
                    ? {
                        x: - 0.5 * element.bounds.width,
                        y: - 0.5 * element.bounds.width
                    }
                    : Point.ORIGIN;
                return {
                    x: 0.5 * (route[index].x + route[index + 1].x) + offset.x,
                    y: 0.5 * (route[index].y + route[index + 1].y) + offset.y
                };
            }
        }
        if (isSizeable(element))
            return {
                x: -0.666 * element.bounds.width,
                y: -0.666 * element.bounds.height
            };
        return Point.ORIGIN;
    }

    postUpdate(): void {
    }
}
