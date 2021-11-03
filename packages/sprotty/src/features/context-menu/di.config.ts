/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { ContainerModule } from "inversify";

import { IContextMenuService } from "./context-menu-service";
import { ContextMenuProviderRegistry } from "./menu-providers";
import { ContextMenuMouseListener } from "./mouse-listener";
import { TYPES } from "../../base/types";

const contextMenuModule = new ContainerModule(bind => {
    bind(TYPES.IContextMenuServiceProvider).toProvider<IContextMenuService>(ctx => {
        return () => {
            return new Promise<IContextMenuService>((resolve, reject) => {
                if (ctx.container.isBound(TYPES.IContextMenuService)) {
                    resolve(ctx.container.get<IContextMenuService>(TYPES.IContextMenuService));
                } else {
                    reject();
                }
            });
        };
    });
    bind(TYPES.MouseListener).to(ContextMenuMouseListener);
    bind(TYPES.IContextMenuProviderRegistry).to(ContextMenuProviderRegistry);
});

export default contextMenuModule;
