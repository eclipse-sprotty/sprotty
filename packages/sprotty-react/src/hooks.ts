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

import { useContext, useState, useEffect, useCallback } from 'react';
import { IActionDispatcher, SModelRootImpl } from 'sprotty';
import { Action } from 'sprotty-protocol';
import { Container } from 'inversify';
import {
    SprottyDispatchContext,
    SprottyModelContext,
    SprottyContainerContext,
    ReactPortalServiceContext
} from './contexts';
import { ReactPortalService, PortalEntry } from './react-portal-service';

/**
 * Hook to access the Sprotty action dispatcher.
 *
 * Use this hook to dispatch actions from React components within diagram nodes.
 *
 * @example
 * ```tsx
 * const MyNode = ({ model }) => {
 *     const dispatch = useSprottyDispatch();
 *
 *     const handleDelete = () => {
 *         dispatch({ kind: 'deleteElement', elementId: model.id });
 *     };
 *
 *     return <button onClick={handleDelete}>Delete</button>;
 * };
 * ```
 *
 * @returns The Sprotty action dispatcher
 * @throws Error if used outside of a SprottyDiagram context
 */
export function useSprottyDispatch(): IActionDispatcher {
    const dispatcher = useContext(SprottyDispatchContext);
    if (!dispatcher) {
        throw new Error(
            'useSprottyDispatch must be used within a SprottyDiagram component. ' +
            'Make sure your React component is rendered inside a SprottyDiagram.'
        );
    }
    return dispatcher;
}

/**
 * Hook to access the current Sprotty model root.
 *
 * @returns The current Sprotty model root, or null if not available
 */
export function useSprottyModel(): SModelRootImpl | null {
    return useContext(SprottyModelContext);
}

/**
 * Hook to access the Inversify container.
 *
 * Use this hook to access other Sprotty services from React components.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *     const container = useSprottyContainer();
 *     const viewerOptions = container?.get(TYPES.ViewerOptions);
 *     // ...
 * };
 * ```
 *
 * @returns The Inversify container, or null if not available
 */
export function useSprottyContainer(): Container | null {
    return useContext(SprottyContainerContext);
}

/**
 * Hook to access the ReactPortalService.
 *
 * @returns The ReactPortalService, or null if not available
 */
export function useReactPortalService(): ReactPortalService | null {
    return useContext(ReactPortalServiceContext);
}

/**
 * Hook that provides a convenient dispatch function with proper typing.
 *
 * @example
 * ```tsx
 * const MyNode = ({ model }) => {
 *     const dispatchAction = useSprottyAction();
 *
 *     const handleSelect = () => {
 *         dispatchAction({
 *             kind: 'elementSelected',
 *             selectedElementsIDs: [model.id]
 *         });
 *     };
 *
 *     return <div onClick={handleSelect}>Select me</div>;
 * };
 * ```
 *
 * @returns A function that dispatches actions and returns a Promise
 */
export function useSprottyAction(): (action: Action) => Promise<void> {
    const dispatcher = useSprottyDispatch();
    return useCallback(
        (action: Action) => dispatcher.dispatch(action),
        [dispatcher]
    );
}

/**
 * Hook that subscribes to portal registry changes.
 * Used internally by the PortalManager component.
 *
 * @param portalService - The ReactPortalService to subscribe to
 * @returns The current map of portal entries
 */
export function usePortalRegistry(
    portalService: ReactPortalService | null
): Map<string, PortalEntry> {
    const [portals, setPortals] = useState<Map<string, PortalEntry>>(
        () => portalService?.getAll() ?? new Map()
    );

    useEffect(() => {
        if (!portalService) {
            return;
        }

        // Initialize with current state
        setPortals(portalService.getAll());

        // Subscribe to changes
        const unsubscribe = portalService.subscribe((entries) => {
            setPortals(new Map(entries));
        });

        return unsubscribe;
    }, [portalService]);

    return portals;
}

/**
 * Hook to dispatch an action and wait for a specific response.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *     const requestBounds = useSprottyRequest();
 *
 *     const handleGetBounds = async () => {
 *         const response = await requestBounds({
 *             kind: 'computedBounds',
 *             requestId: 'my-request'
 *         });
 *         console.log('Bounds:', response);
 *     };
 * };
 * ```
 */
export function useSprottyRequest() {
    const dispatcher = useSprottyDispatch();
    return useCallback(
        (action: Action & { requestId: string }) =>
            dispatcher.request(action as any),
        [dispatcher]
    );
}

