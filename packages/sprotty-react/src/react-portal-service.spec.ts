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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReactPortalService, PortalEntry, ReactNodeProps } from './react-portal-service';
import { SModelElementImpl } from 'sprotty';
import * as React from 'react';

// Mock React component for testing
const MockComponent: React.FC<ReactNodeProps> = ({ model }) => {
    return React.createElement('div', null, model.id);
};

// Mock SModelElementImpl
function createMockModel(id: string, type: string = 'test:node'): SModelElementImpl {
    const model = new SModelElementImpl();
    model.id = id;
    model.type = type;
    return model;
}

// Mock HTMLElement
function createMockDomNode(id: string): HTMLElement {
    const div = document.createElement('div');
    div.id = id;
    return div;
}

describe('ReactPortalService', () => {
    let service: ReactPortalService;
    let rafCallbacks: Array<() => void>;
    let rafIdCounter: number;

    // Helper to flush pending requestAnimationFrame callbacks
    function flushRaf(): void {
        const callbacks = [...rafCallbacks];
        rafCallbacks = [];
        callbacks.forEach(cb => cb());
    }

    beforeEach(() => {
        service = new ReactPortalService();
        rafCallbacks = [];
        rafIdCounter = 0;

        // Mock requestAnimationFrame to capture callbacks
        vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
            rafCallbacks.push(cb);
            return ++rafIdCounter;
        });
        vi.stubGlobal('cancelAnimationFrame', (id: number) => {
            // Not strictly needed for these tests, but good to have
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('register', () => {
        it('should register a new portal entry', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');

            service.register('node1', domNode, model, MockComponent);

            expect(service.has('node1')).toBe(true);
            expect(service.size).toBe(1);
        });

        it('should store correct entry data', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');

            service.register('node1', domNode, model, MockComponent);

            const entry = service.get('node1');
            expect(entry).toBeDefined();
            expect(entry?.id).toBe('node1');
            expect(entry?.domNode).toBe(domNode);
            expect(entry?.model).toBe(model);
            expect(entry?.componentType).toBe(MockComponent);
        });

        it('should notify listeners when registering', () => {
            const listener = vi.fn();
            service.subscribe(listener);

            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);

            // Notification is batched via requestAnimationFrame
            expect(listener).not.toHaveBeenCalled();
            flushRaf();

            expect(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0] as Map<string, PortalEntry>;
            expect(entries.has('node1')).toBe(true);
        });

        it('should register multiple portals', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');

            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);

            expect(service.size).toBe(2);
            expect(service.has('node1')).toBe(true);
            expect(service.has('node2')).toBe(true);
        });
    });

    describe('update', () => {
        it('should update an existing portal model', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node1');
            model2.type = 'test:updated';
            const domNode = createMockDomNode('container1');

            service.register('node1', domNode, model1, MockComponent);
            service.update('node1', model2);

            const entry = service.get('node1');
            expect(entry?.model).toBe(model2);
        });

        it('should notify listeners when updating', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node1');
            const domNode = createMockDomNode('container1');

            service.register('node1', domNode, model1, MockComponent);
            flushRaf(); // Flush the register notification

            const listener = vi.fn();
            service.subscribe(listener);
            service.update('node1', model2);

            // Notification is batched via requestAnimationFrame
            expect(listener).not.toHaveBeenCalled();
            flushRaf();

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('should not notify if portal does not exist', () => {
            const model = createMockModel('node1');
            const listener = vi.fn();
            service.subscribe(listener);

            service.update('nonexistent', model);
            flushRaf(); // Even after flushing, nothing should be called

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('unregister', () => {
        it('should remove a portal entry', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');

            service.register('node1', domNode, model, MockComponent);
            expect(service.has('node1')).toBe(true);

            service.unregister('node1');
            expect(service.has('node1')).toBe(false);
            expect(service.size).toBe(0);
        });

        it('should notify listeners when unregistering', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');

            service.register('node1', domNode, model, MockComponent);
            flushRaf(); // Flush the register notification

            const listener = vi.fn();
            service.subscribe(listener);
            service.unregister('node1');

            // Notification is batched via requestAnimationFrame
            expect(listener).not.toHaveBeenCalled();
            flushRaf();

            expect(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0] as Map<string, PortalEntry>;
            expect(entries.has('node1')).toBe(false);
        });

        it('should not notify if portal does not exist', () => {
            const listener = vi.fn();
            service.subscribe(listener);

            service.unregister('nonexistent');
            flushRaf(); // Even after flushing, nothing should be called

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('getAll', () => {
        it('should return a copy of all entries', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');

            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);

            const entries = service.getAll();
            expect(entries.size).toBe(2);
            expect(entries.has('node1')).toBe(true);
            expect(entries.has('node2')).toBe(true);

            // Verify it's a copy (modifying it shouldn't affect service)
            entries.delete('node1');
            expect(service.has('node1')).toBe(true);
        });
    });

    describe('subscribe', () => {
        it('should return an unsubscribe function', () => {
            const listener = vi.fn();
            const unsubscribe = service.subscribe(listener);

            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            flushRaf();

            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();

            service.register('node2', domNode, model, MockComponent);
            flushRaf();
            expect(listener).toHaveBeenCalledTimes(1); // Not called again
        });

        it('should support multiple listeners', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            service.subscribe(listener1);
            service.subscribe(listener2);

            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            flushRaf();

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });

        it('should handle listener errors gracefully', () => {
            const errorListener = vi.fn(() => {
                throw new Error('Listener error');
            });
            const normalListener = vi.fn();

            service.subscribe(errorListener);
            service.subscribe(normalListener);

            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');

            // Should not throw (even after flushing RAF)
            service.register('node1', domNode, model, MockComponent);
            expect(() => {
                flushRaf();
            }).not.toThrow();

            // Both listeners should have been called
            expect(errorListener).toHaveBeenCalledTimes(1);
            expect(normalListener).toHaveBeenCalledTimes(1);
        });
    });

    describe('clear', () => {
        it('should remove all portal entries', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');

            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);

            expect(service.size).toBe(2);

            service.clear();

            expect(service.size).toBe(0);
        });

        it('should notify listeners when clearing', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            flushRaf(); // Flush the register notification

            const listener = vi.fn();
            service.subscribe(listener);
            service.clear();

            // Notification is batched via requestAnimationFrame
            expect(listener).not.toHaveBeenCalled();
            flushRaf();

            expect(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0] as Map<string, PortalEntry>;
            expect(entries.size).toBe(0);
        });

        it('should not notify if already empty', () => {
            const listener = vi.fn();
            service.subscribe(listener);
            service.clear();
            flushRaf(); // Even after flushing, nothing should be called

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('batching', () => {
        it('should batch multiple notifications into one', () => {
            const listener = vi.fn();
            service.subscribe(listener);

            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const model3 = createMockModel('node3');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');
            const domNode3 = createMockDomNode('container3');

            // Multiple operations in the same frame
            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);
            service.register('node3', domNode3, model3, MockComponent);

            // Listener should not be called yet
            expect(listener).not.toHaveBeenCalled();

            // Only one RAF callback should be scheduled
            expect(rafCallbacks.length).toBe(1);

            // Flush the batched notification
            flushRaf();

            // Listener should be called exactly once with all 3 entries
            expect(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0] as Map<string, PortalEntry>;
            expect(entries.size).toBe(3);
            expect(entries.has('node1')).toBe(true);
            expect(entries.has('node2')).toBe(true);
            expect(entries.has('node3')).toBe(true);
        });

        it('should batch mixed operations into one notification', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');

            // First register some nodes
            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);
            flushRaf();

            const listener = vi.fn();
            service.subscribe(listener);

            // Now perform mixed operations in the same frame
            const model1Updated = createMockModel('node1');
            model1Updated.type = 'updated';
            service.update('node1', model1Updated);
            service.unregister('node2');
            const model3 = createMockModel('node3');
            const domNode3 = createMockDomNode('container3');
            service.register('node3', domNode3, model3, MockComponent);

            // Listener should not be called yet
            expect(listener).not.toHaveBeenCalled();

            // Flush the batched notification
            flushRaf();

            // Listener should be called exactly once with final state
            expect(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0] as Map<string, PortalEntry>;
            expect(entries.size).toBe(2);
            expect(entries.has('node1')).toBe(true);
            expect(entries.has('node2')).toBe(false);
            expect(entries.has('node3')).toBe(true);
            expect(entries.get('node1')?.model.type).toBe('updated');
        });

        it('should allow new batches after previous one completes', () => {
            const listener = vi.fn();
            service.subscribe(listener);

            const model1 = createMockModel('node1');
            const domNode1 = createMockDomNode('container1');

            // First batch
            service.register('node1', domNode1, model1, MockComponent);
            flushRaf();
            expect(listener).toHaveBeenCalledTimes(1);

            // Second batch
            const model2 = createMockModel('node2');
            const domNode2 = createMockDomNode('container2');
            service.register('node2', domNode2, model2, MockComponent);
            flushRaf();
            expect(listener).toHaveBeenCalledTimes(2);
        });
    });
});

