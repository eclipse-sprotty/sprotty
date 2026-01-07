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
import * as React from 'react';
import { IActionDispatcher, SModelRootImpl } from 'sprotty';
import { Container } from 'inversify';
import { ReactPortalService } from './react-portal-service';
/**
 * Context for accessing the Sprotty action dispatcher.
 * Use the `useSprottyDispatch` hook instead of accessing this directly.
 */
export declare const SprottyDispatchContext: React.Context<IActionDispatcher | null>;
/**
 * Context for accessing the current Sprotty model root.
 * Use the `useSprottyModel` hook instead of accessing this directly.
 */
export declare const SprottyModelContext: React.Context<SModelRootImpl | null>;
/**
 * Context for accessing the Inversify container.
 * Useful for accessing other Sprotty services from React components.
 */
export declare const SprottyContainerContext: React.Context<Container | null>;
/**
 * Context for accessing the ReactPortalService.
 * Used internally by the PortalManager.
 */
export declare const ReactPortalServiceContext: React.Context<ReactPortalService | null>;
/**
 * Provider component props.
 */
export interface SprottyContextProviderProps {
    children: React.ReactNode;
    dispatcher: IActionDispatcher;
    model: SModelRootImpl | null;
    container?: Container | null;
    portalService: ReactPortalService;
}
/**
 * Combined provider component that wraps children with all Sprotty contexts.
 */
export declare const SprottyContextProvider: React.FC<SprottyContextProviderProps>;
//# sourceMappingURL=contexts.d.ts.map