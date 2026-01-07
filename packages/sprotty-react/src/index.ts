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

// Types
export * from './types';

// Services
export * from './react-portal-service';
export * from './react-bounds-updater';

// Views
export * from './react-host-view';

// React Components
export * from './sprotty-diagram';
export * from './portal-manager';
export * from './event-trap';

// Contexts and Hooks
export * from './contexts';
export * from './hooks';

// Configuration helpers
export * from './configure-react-node';
export * from './react-model';

// DI Module
import reactModule from './di.config';
export { reactModule };

