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
exports.useSprottyRequest = exports.usePortalRegistry = exports.useSprottyAction = exports.useReactPortalService = exports.useSprottyContainer = exports.useSprottyModel = exports.useSprottyDispatch = void 0;
const react_1 = require("react");
const contexts_1 = require("./contexts");
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
function useSprottyDispatch() {
    const dispatcher = (0, react_1.useContext)(contexts_1.SprottyDispatchContext);
    if (!dispatcher) {
        throw new Error('useSprottyDispatch must be used within a SprottyDiagram component. ' +
            'Make sure your React component is rendered inside a SprottyDiagram.');
    }
    return dispatcher;
}
exports.useSprottyDispatch = useSprottyDispatch;
/**
 * Hook to access the current Sprotty model root.
 *
 * @returns The current Sprotty model root, or null if not available
 */
function useSprottyModel() {
    return (0, react_1.useContext)(contexts_1.SprottyModelContext);
}
exports.useSprottyModel = useSprottyModel;
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
function useSprottyContainer() {
    return (0, react_1.useContext)(contexts_1.SprottyContainerContext);
}
exports.useSprottyContainer = useSprottyContainer;
/**
 * Hook to access the ReactPortalService.
 *
 * @returns The ReactPortalService, or null if not available
 */
function useReactPortalService() {
    return (0, react_1.useContext)(contexts_1.ReactPortalServiceContext);
}
exports.useReactPortalService = useReactPortalService;
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
function useSprottyAction() {
    const dispatcher = useSprottyDispatch();
    return (0, react_1.useCallback)((action) => dispatcher.dispatch(action), [dispatcher]);
}
exports.useSprottyAction = useSprottyAction;
/**
 * Hook that subscribes to portal registry changes.
 * Used internally by the PortalManager component.
 *
 * @param portalService - The ReactPortalService to subscribe to
 * @returns The current map of portal entries
 */
function usePortalRegistry(portalService) {
    const [portals, setPortals] = (0, react_1.useState)(() => { var _a; return (_a = portalService === null || portalService === void 0 ? void 0 : portalService.getAll()) !== null && _a !== void 0 ? _a : new Map(); });
    (0, react_1.useEffect)(() => {
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
exports.usePortalRegistry = usePortalRegistry;
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
function useSprottyRequest() {
    const dispatcher = useSprottyDispatch();
    return (0, react_1.useCallback)((action) => dispatcher.request(action), [dispatcher]);
}
exports.useSprottyRequest = useSprottyRequest;
//# sourceMappingURL=hooks.js.map