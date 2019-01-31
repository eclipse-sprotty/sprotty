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

import virtualize from "snabbdom-virtualize/strings";
import { VNode } from "snabbdom/vnode";
import { IView, RenderingContext } from "../base/views/view";
import { PreRenderedElement } from "./model";
import { injectable } from "inversify";

@injectable()
export class PreRenderedView implements IView {
    render(model: PreRenderedElement, context: RenderingContext): VNode {
        const node = virtualize(model.code);
        this.correctNamespace(node);
        return node;
    }

    protected correctNamespace(node: VNode) {
        if (node.sel === 'svg' || node.sel === 'g')
            this.setNamespace(node, 'http://www.w3.org/2000/svg');
    }

    protected setNamespace(node: VNode, ns: string) {
        if (node.data === undefined)
            node.data = {};
        node.data.ns = ns;
        const children = node.children;
        if (children !== undefined) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (typeof child !== 'string')
                    this.setNamespace(child, ns);
            }
        }
    }
}
