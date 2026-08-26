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

import { TYPES } from "../../base/types.js";
import { IContextMenuService, IContextMenuServiceProvider } from "./context-menu-service.js";
import { ContextMenuProviderRegistry } from "./menu-providers.js";
import { ContextMenuMouseListener } from "./mouse-listener.js";

const contextMenuModule = new ContainerModule(({bind}) => {
    bind<IContextMenuServiceProvider>(TYPES.IContextMenuServiceProvider).toFactory(ctx => {
        return () => {
            return new Promise<IContextMenuService>((resolve, reject) => {
                const service = ctx.get<IContextMenuService>(TYPES.IContextMenuService, { optional: true });
                if (service !== undefined) {
                    resolve(service);
                } else {
                    reject();
                }
            });
        };
    });
    bind(ContextMenuMouseListener).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(ContextMenuMouseListener);
    bind(TYPES.IContextMenuProviderRegistry).to(ContextMenuProviderRegistry);
});

export default contextMenuModule;
