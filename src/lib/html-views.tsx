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

 /** @jsx html */
import { html } from 'snabbdom-jsx';

import { VNode } from "snabbdom/vnode";
import { IView, RenderingContext } from "../base/views/view";
import { setClass } from "../base/views/vnode-utils";
import { HtmlRoot } from "./model";
import { injectable } from 'inversify';

@injectable()
export class HtmlRootView implements IView {
    render(model: HtmlRoot, context: RenderingContext): VNode {
        const root = <div>
            { context.renderChildren(model) }
        </div>;
        for (const c of model.classes) {
            setClass(root, c, true);
        }
        return root;
    }
}
