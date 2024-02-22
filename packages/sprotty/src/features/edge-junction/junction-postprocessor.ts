/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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
import { IVNodePostprocessor } from "../../base/views/vnode-postprocessor";
import { VNode } from "snabbdom";
import { Action } from "sprotty-protocol";
import { SModelElementImpl } from "../../base/model/smodel";

@injectable()
export class JunctionPostProcessor implements IVNodePostprocessor {
    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        return vnode;
    }
    postUpdate(cause?: Action | undefined): void {
        const svg = document.querySelector('svg#sprotty_root > g');
        if (svg) {
            const junctionGroups = Array.from(document.querySelectorAll('g.sprotty-junction'));

            junctionGroups.forEach(junctionGroup => {
                junctionGroup.remove();
            });

            svg.append(...junctionGroups);
        }
    }
}
