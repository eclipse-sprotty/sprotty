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
import { ContainerModule } from 'inversify';
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
declare const reactModule: ContainerModule;
export default reactModule;
//# sourceMappingURL=di.config.d.ts.map