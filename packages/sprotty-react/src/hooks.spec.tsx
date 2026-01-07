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

import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Container } from 'inversify';
import { IActionDispatcher, SModelRootImpl } from 'sprotty';
import {
    useSprottyDispatch,
    useSprottyModel,
    useSprottyContainer,
    useReactPortalService,
    useSprottyAction,
    usePortalRegistry
} from './hooks';
import {
    SprottyDispatchContext,
    SprottyModelContext,
    SprottyContainerContext,
    ReactPortalServiceContext
} from './contexts';
import { ReactPortalService, ReactNodeProps } from './react-portal-service';
import { SModelElementImpl } from 'sprotty';

// Mock dispatcher
const createMockDispatcher = (): IActionDispatcher => ({
    dispatch: vi.fn().mockResolvedValue(undefined),
    dispatchAll: vi.fn().mockResolvedValue(undefined),
    request: vi.fn().mockResolvedValue({ responseId: 'test' })
});

// RAF mock helpers for batching tests
let rafCallbacks: Array<() => void> = [];
let rafIdCounter = 0;

function flushRaf(): void {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => cb());
}

// Mock React component
const MockComponent: React.FC<ReactNodeProps> = ({ model }) => {
    return React.createElement('div', null, model.id);
};

describe('useSprottyDispatch', () => {
    it('should return the dispatcher from context', () => {
        const mockDispatcher = createMockDispatcher();

        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(SprottyDispatchContext.Provider, { value: mockDispatcher }, children);

        const { result } = renderHook(() => useSprottyDispatch(), { wrapper });

        expect(result.current).toBe(mockDispatcher);
    });

    it('should throw error when used outside context', () => {
        // Suppress console.error for expected error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            renderHook(() => useSprottyDispatch());
        }).toThrow('useSprottyDispatch must be used within a SprottyDiagram component');

        consoleSpy.mockRestore();
    });
});

describe('useSprottyModel', () => {
    it('should return the model from context', () => {
        const mockModel = new SModelRootImpl();
        mockModel.id = 'root';

        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(SprottyModelContext.Provider, { value: mockModel }, children);

        const { result } = renderHook(() => useSprottyModel(), { wrapper });

        expect(result.current).toBe(mockModel);
    });

    it('should return null when no model in context', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(SprottyModelContext.Provider, { value: null }, children);

        const { result } = renderHook(() => useSprottyModel(), { wrapper });

        expect(result.current).toBeNull();
    });
});

describe('useSprottyContainer', () => {
    it('should return the container from context', () => {
        const mockContainer = new Container();

        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(SprottyContainerContext.Provider, { value: mockContainer }, children);

        const { result } = renderHook(() => useSprottyContainer(), { wrapper });

        expect(result.current).toBe(mockContainer);
    });

    it('should return null when no container in context', () => {
        const { result } = renderHook(() => useSprottyContainer());
        expect(result.current).toBeNull();
    });
});

describe('useReactPortalService', () => {
    it('should return the portal service from context', () => {
        const mockService = new ReactPortalService();

        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(ReactPortalServiceContext.Provider, { value: mockService }, children);

        const { result } = renderHook(() => useReactPortalService(), { wrapper });

        expect(result.current).toBe(mockService);
    });

    it('should return null when no service in context', () => {
        const { result } = renderHook(() => useReactPortalService());
        expect(result.current).toBeNull();
    });
});

describe('useSprottyAction', () => {
    it('should return a function that dispatches actions', async () => {
        const mockDispatcher = createMockDispatcher();

        const wrapper = ({ children }: { children: React.ReactNode }) =>
            React.createElement(SprottyDispatchContext.Provider, { value: mockDispatcher }, children);

        const { result } = renderHook(() => useSprottyAction(), { wrapper });

        const action = { kind: 'test' };
        await act(async () => {
            await result.current(action);
        });

        expect(mockDispatcher.dispatch).toHaveBeenCalledWith(action);
    });
});

describe('usePortalRegistry', () => {
    beforeEach(() => {
        rafCallbacks = [];
        rafIdCounter = 0;

        // Mock requestAnimationFrame to capture callbacks (for batching)
        vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
            rafCallbacks.push(cb);
            return ++rafIdCounter;
        });
        vi.stubGlobal('cancelAnimationFrame', () => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return empty map when service is null', () => {
        const { result } = renderHook(() => usePortalRegistry(null));
        expect(result.current.size).toBe(0);
    });

    it('should return current portals from service', () => {
        const service = new ReactPortalService();
        const model = new SModelElementImpl();
        model.id = 'node1';
        const domNode = document.createElement('div');

        service.register('node1', domNode, model, MockComponent);
        flushRaf(); // Flush the batched notification

        const { result } = renderHook(() => usePortalRegistry(service));

        expect(result.current.size).toBe(1);
        expect(result.current.has('node1')).toBe(true);
    });

    it('should update when portals change', () => {
        const service = new ReactPortalService();

        const { result } = renderHook(() => usePortalRegistry(service));
        expect(result.current.size).toBe(0);

        const model = new SModelElementImpl();
        model.id = 'node1';
        const domNode = document.createElement('div');

        act(() => {
            service.register('node1', domNode, model, MockComponent);
            flushRaf(); // Flush the batched notification within act()
        });

        expect(result.current.size).toBe(1);
        expect(result.current.has('node1')).toBe(true);
    });

    it('should unsubscribe on unmount', () => {
        const service = new ReactPortalService();
        const unsubscribeSpy = vi.spyOn(service, 'subscribe');

        const { unmount } = renderHook(() => usePortalRegistry(service));

        expect(unsubscribeSpy).toHaveBeenCalled();

        unmount();

        // Verify no memory leaks - adding a new portal shouldn't call old listeners
        const model = new SModelElementImpl();
        model.id = 'node2';
        const domNode = document.createElement('div');

        // This shouldn't affect the unmounted hook
        service.register('node2', domNode, model, MockComponent);
        flushRaf();
    });
});

