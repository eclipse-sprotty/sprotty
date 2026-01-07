"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const sprotty_1 = require("sprotty");
const types_1 = require("./types");
const react_portal_service_1 = require("./react-portal-service");
const react_host_view_1 = require("./react-host-view");
const react_bounds_updater_1 = require("./react-bounds-updater");
/**
 * Inversify ContainerModule that provides all sprotty-react bindings.
 *
 * Load this module into your Sprotty container to enable React integration:
 *
 * ```typescript
 * import { Container } from 'inversify';
 * import { loadDefaultModules } from 'sprotty';
 * import { reactModule } from 'sprotty-react';
 *
 * const container = new Container();
 * loadDefaultModules(container);
 * container.load(reactModule);
 * ```
 */
const reactModule = new inversify_1.ContainerModule((bind, unbind, isBound, rebind) => {
    // Bind the portal service as a singleton
    bind(types_1.REACT_TYPES.ReactPortalService).to(react_portal_service_1.ReactPortalService).inSingletonScope();
    // Bind the component registry as a singleton
    bind(types_1.REACT_TYPES.ReactComponentRegistry).to(react_host_view_1.ReactComponentRegistry).inSingletonScope();
    // Rebind HiddenBoundsUpdater to use React-aware version that can measure
    // HTML content inside foreignObject elements
    rebind(sprotty_1.HiddenBoundsUpdater).to(react_bounds_updater_1.ReactBoundsUpdater).inSingletonScope();
});
exports.default = reactModule;
//# sourceMappingURL=di.config.js.map