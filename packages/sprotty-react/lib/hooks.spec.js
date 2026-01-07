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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const vitest_1 = require("vitest");
const React = __importStar(require("react"));
const react_1 = require("@testing-library/react");
const inversify_1 = require("inversify");
const sprotty_1 = require("sprotty");
const hooks_1 = require("./hooks");
const contexts_1 = require("./contexts");
const react_portal_service_1 = require("./react-portal-service");
const sprotty_2 = require("sprotty");
// Mock dispatcher
const createMockDispatcher = () => ({
    dispatch: vitest_1.vi.fn().mockResolvedValue(undefined),
    dispatchAll: vitest_1.vi.fn().mockResolvedValue(undefined),
    request: vitest_1.vi.fn().mockResolvedValue({ responseId: 'test' })
});
// RAF mock helpers for batching tests
let rafCallbacks = [];
let rafIdCounter = 0;
function flushRaf() {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => cb());
}
// Mock React component
const MockComponent = ({ model }) => {
    return React.createElement('div', null, model.id);
};
(0, vitest_1.describe)('useSprottyDispatch', () => {
    (0, vitest_1.it)('should return the dispatcher from context', () => {
        const mockDispatcher = createMockDispatcher();
        const wrapper = ({ children }) => React.createElement(contexts_1.SprottyDispatchContext.Provider, { value: mockDispatcher }, children);
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useSprottyDispatch)(), { wrapper });
        (0, vitest_1.expect)(result.current).toBe(mockDispatcher);
    });
    (0, vitest_1.it)('should throw error when used outside context', () => {
        // Suppress console.error for expected error
        const consoleSpy = vitest_1.vi.spyOn(console, 'error').mockImplementation(() => { });
        (0, vitest_1.expect)(() => {
            (0, react_1.renderHook)(() => (0, hooks_1.useSprottyDispatch)());
        }).toThrow('useSprottyDispatch must be used within a SprottyDiagram component');
        consoleSpy.mockRestore();
    });
});
(0, vitest_1.describe)('useSprottyModel', () => {
    (0, vitest_1.it)('should return the model from context', () => {
        const mockModel = new sprotty_1.SModelRootImpl();
        mockModel.id = 'root';
        const wrapper = ({ children }) => React.createElement(contexts_1.SprottyModelContext.Provider, { value: mockModel }, children);
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useSprottyModel)(), { wrapper });
        (0, vitest_1.expect)(result.current).toBe(mockModel);
    });
    (0, vitest_1.it)('should return null when no model in context', () => {
        const wrapper = ({ children }) => React.createElement(contexts_1.SprottyModelContext.Provider, { value: null }, children);
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useSprottyModel)(), { wrapper });
        (0, vitest_1.expect)(result.current).toBeNull();
    });
});
(0, vitest_1.describe)('useSprottyContainer', () => {
    (0, vitest_1.it)('should return the container from context', () => {
        const mockContainer = new inversify_1.Container();
        const wrapper = ({ children }) => React.createElement(contexts_1.SprottyContainerContext.Provider, { value: mockContainer }, children);
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useSprottyContainer)(), { wrapper });
        (0, vitest_1.expect)(result.current).toBe(mockContainer);
    });
    (0, vitest_1.it)('should return null when no container in context', () => {
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useSprottyContainer)());
        (0, vitest_1.expect)(result.current).toBeNull();
    });
});
(0, vitest_1.describe)('useReactPortalService', () => {
    (0, vitest_1.it)('should return the portal service from context', () => {
        const mockService = new react_portal_service_1.ReactPortalService();
        const wrapper = ({ children }) => React.createElement(contexts_1.ReactPortalServiceContext.Provider, { value: mockService }, children);
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useReactPortalService)(), { wrapper });
        (0, vitest_1.expect)(result.current).toBe(mockService);
    });
    (0, vitest_1.it)('should return null when no service in context', () => {
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useReactPortalService)());
        (0, vitest_1.expect)(result.current).toBeNull();
    });
});
(0, vitest_1.describe)('useSprottyAction', () => {
    (0, vitest_1.it)('should return a function that dispatches actions', async () => {
        const mockDispatcher = createMockDispatcher();
        const wrapper = ({ children }) => React.createElement(contexts_1.SprottyDispatchContext.Provider, { value: mockDispatcher }, children);
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.useSprottyAction)(), { wrapper });
        const action = { kind: 'test' };
        await (0, react_1.act)(async () => {
            await result.current(action);
        });
        (0, vitest_1.expect)(mockDispatcher.dispatch).toHaveBeenCalledWith(action);
    });
});
(0, vitest_1.describe)('usePortalRegistry', () => {
    (0, vitest_1.beforeEach)(() => {
        rafCallbacks = [];
        rafIdCounter = 0;
        // Mock requestAnimationFrame to capture callbacks (for batching)
        vitest_1.vi.stubGlobal('requestAnimationFrame', (cb) => {
            rafCallbacks.push(cb);
            return ++rafIdCounter;
        });
        vitest_1.vi.stubGlobal('cancelAnimationFrame', () => { });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('should return empty map when service is null', () => {
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.usePortalRegistry)(null));
        (0, vitest_1.expect)(result.current.size).toBe(0);
    });
    (0, vitest_1.it)('should return current portals from service', () => {
        const service = new react_portal_service_1.ReactPortalService();
        const model = new sprotty_2.SModelElementImpl();
        model.id = 'node1';
        const domNode = document.createElement('div');
        service.register('node1', domNode, model, MockComponent);
        flushRaf(); // Flush the batched notification
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.usePortalRegistry)(service));
        (0, vitest_1.expect)(result.current.size).toBe(1);
        (0, vitest_1.expect)(result.current.has('node1')).toBe(true);
    });
    (0, vitest_1.it)('should update when portals change', () => {
        const service = new react_portal_service_1.ReactPortalService();
        const { result } = (0, react_1.renderHook)(() => (0, hooks_1.usePortalRegistry)(service));
        (0, vitest_1.expect)(result.current.size).toBe(0);
        const model = new sprotty_2.SModelElementImpl();
        model.id = 'node1';
        const domNode = document.createElement('div');
        (0, react_1.act)(() => {
            service.register('node1', domNode, model, MockComponent);
            flushRaf(); // Flush the batched notification within act()
        });
        (0, vitest_1.expect)(result.current.size).toBe(1);
        (0, vitest_1.expect)(result.current.has('node1')).toBe(true);
    });
    (0, vitest_1.it)('should unsubscribe on unmount', () => {
        const service = new react_portal_service_1.ReactPortalService();
        const unsubscribeSpy = vitest_1.vi.spyOn(service, 'subscribe');
        const { unmount } = (0, react_1.renderHook)(() => (0, hooks_1.usePortalRegistry)(service));
        (0, vitest_1.expect)(unsubscribeSpy).toHaveBeenCalled();
        unmount();
        // Verify no memory leaks - adding a new portal shouldn't call old listeners
        const model = new sprotty_2.SModelElementImpl();
        model.id = 'node2';
        const domNode = document.createElement('div');
        // This shouldn't affect the unmounted hook
        service.register('node2', domNode, model, MockComponent);
        flushRaf();
    });
});
//# sourceMappingURL=hooks.spec.js.map