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
const react_portal_service_1 = require("./react-portal-service");
const sprotty_1 = require("sprotty");
const React = __importStar(require("react"));
// Mock React component for testing
const MockComponent = ({ model }) => {
    return React.createElement('div', null, model.id);
};
// Mock SModelElementImpl
function createMockModel(id, type = 'test:node') {
    const model = new sprotty_1.SModelElementImpl();
    model.id = id;
    model.type = type;
    return model;
}
// Mock HTMLElement
function createMockDomNode(id) {
    const div = document.createElement('div');
    div.id = id;
    return div;
}
(0, vitest_1.describe)('ReactPortalService', () => {
    let service;
    let rafCallbacks;
    let rafIdCounter;
    // Helper to flush pending requestAnimationFrame callbacks
    function flushRaf() {
        const callbacks = [...rafCallbacks];
        rafCallbacks = [];
        callbacks.forEach(cb => cb());
    }
    (0, vitest_1.beforeEach)(() => {
        service = new react_portal_service_1.ReactPortalService();
        rafCallbacks = [];
        rafIdCounter = 0;
        // Mock requestAnimationFrame to capture callbacks
        vitest_1.vi.stubGlobal('requestAnimationFrame', (cb) => {
            rafCallbacks.push(cb);
            return ++rafIdCounter;
        });
        vitest_1.vi.stubGlobal('cancelAnimationFrame', (id) => {
            // Not strictly needed for these tests, but good to have
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.describe)('register', () => {
        (0, vitest_1.it)('should register a new portal entry', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            (0, vitest_1.expect)(service.has('node1')).toBe(true);
            (0, vitest_1.expect)(service.size).toBe(1);
        });
        (0, vitest_1.it)('should store correct entry data', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            const entry = service.get('node1');
            (0, vitest_1.expect)(entry).toBeDefined();
            (0, vitest_1.expect)(entry === null || entry === void 0 ? void 0 : entry.id).toBe('node1');
            (0, vitest_1.expect)(entry === null || entry === void 0 ? void 0 : entry.domNode).toBe(domNode);
            (0, vitest_1.expect)(entry === null || entry === void 0 ? void 0 : entry.model).toBe(model);
            (0, vitest_1.expect)(entry === null || entry === void 0 ? void 0 : entry.componentType).toBe(MockComponent);
        });
        (0, vitest_1.it)('should notify listeners when registering', () => {
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            // Notification is batched via requestAnimationFrame
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0];
            (0, vitest_1.expect)(entries.has('node1')).toBe(true);
        });
        (0, vitest_1.it)('should register multiple portals', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');
            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);
            (0, vitest_1.expect)(service.size).toBe(2);
            (0, vitest_1.expect)(service.has('node1')).toBe(true);
            (0, vitest_1.expect)(service.has('node2')).toBe(true);
        });
    });
    (0, vitest_1.describe)('update', () => {
        (0, vitest_1.it)('should update an existing portal model', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node1');
            model2.type = 'test:updated';
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model1, MockComponent);
            service.update('node1', model2);
            const entry = service.get('node1');
            (0, vitest_1.expect)(entry === null || entry === void 0 ? void 0 : entry.model).toBe(model2);
        });
        (0, vitest_1.it)('should notify listeners when updating', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model1, MockComponent);
            flushRaf(); // Flush the register notification
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.update('node1', model2);
            // Notification is batched via requestAnimationFrame
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should not notify if portal does not exist', () => {
            const model = createMockModel('node1');
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.update('nonexistent', model);
            flushRaf(); // Even after flushing, nothing should be called
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('unregister', () => {
        (0, vitest_1.it)('should remove a portal entry', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            (0, vitest_1.expect)(service.has('node1')).toBe(true);
            service.unregister('node1');
            (0, vitest_1.expect)(service.has('node1')).toBe(false);
            (0, vitest_1.expect)(service.size).toBe(0);
        });
        (0, vitest_1.it)('should notify listeners when unregistering', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            flushRaf(); // Flush the register notification
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.unregister('node1');
            // Notification is batched via requestAnimationFrame
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0];
            (0, vitest_1.expect)(entries.has('node1')).toBe(false);
        });
        (0, vitest_1.it)('should not notify if portal does not exist', () => {
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.unregister('nonexistent');
            flushRaf(); // Even after flushing, nothing should be called
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getAll', () => {
        (0, vitest_1.it)('should return a copy of all entries', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');
            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);
            const entries = service.getAll();
            (0, vitest_1.expect)(entries.size).toBe(2);
            (0, vitest_1.expect)(entries.has('node1')).toBe(true);
            (0, vitest_1.expect)(entries.has('node2')).toBe(true);
            // Verify it's a copy (modifying it shouldn't affect service)
            entries.delete('node1');
            (0, vitest_1.expect)(service.has('node1')).toBe(true);
        });
    });
    (0, vitest_1.describe)('subscribe', () => {
        (0, vitest_1.it)('should return an unsubscribe function', () => {
            const listener = vitest_1.vi.fn();
            const unsubscribe = service.subscribe(listener);
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            unsubscribe();
            service.register('node2', domNode, model, MockComponent);
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1); // Not called again
        });
        (0, vitest_1.it)('should support multiple listeners', () => {
            const listener1 = vitest_1.vi.fn();
            const listener2 = vitest_1.vi.fn();
            service.subscribe(listener1);
            service.subscribe(listener2);
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            flushRaf();
            (0, vitest_1.expect)(listener1).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(listener2).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle listener errors gracefully', () => {
            const errorListener = vitest_1.vi.fn(() => {
                throw new Error('Listener error');
            });
            const normalListener = vitest_1.vi.fn();
            service.subscribe(errorListener);
            service.subscribe(normalListener);
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            // Should not throw (even after flushing RAF)
            service.register('node1', domNode, model, MockComponent);
            (0, vitest_1.expect)(() => {
                flushRaf();
            }).not.toThrow();
            // Both listeners should have been called
            (0, vitest_1.expect)(errorListener).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(normalListener).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('clear', () => {
        (0, vitest_1.it)('should remove all portal entries', () => {
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');
            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);
            (0, vitest_1.expect)(service.size).toBe(2);
            service.clear();
            (0, vitest_1.expect)(service.size).toBe(0);
        });
        (0, vitest_1.it)('should notify listeners when clearing', () => {
            const model = createMockModel('node1');
            const domNode = createMockDomNode('container1');
            service.register('node1', domNode, model, MockComponent);
            flushRaf(); // Flush the register notification
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.clear();
            // Notification is batched via requestAnimationFrame
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0];
            (0, vitest_1.expect)(entries.size).toBe(0);
        });
        (0, vitest_1.it)('should not notify if already empty', () => {
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.clear();
            flushRaf(); // Even after flushing, nothing should be called
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('batching', () => {
        (0, vitest_1.it)('should batch multiple notifications into one', () => {
            const listener = vitest_1.vi.fn();
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
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
            // Only one RAF callback should be scheduled
            (0, vitest_1.expect)(rafCallbacks.length).toBe(1);
            // Flush the batched notification
            flushRaf();
            // Listener should be called exactly once with all 3 entries
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0];
            (0, vitest_1.expect)(entries.size).toBe(3);
            (0, vitest_1.expect)(entries.has('node1')).toBe(true);
            (0, vitest_1.expect)(entries.has('node2')).toBe(true);
            (0, vitest_1.expect)(entries.has('node3')).toBe(true);
        });
        (0, vitest_1.it)('should batch mixed operations into one notification', () => {
            var _a;
            const model1 = createMockModel('node1');
            const model2 = createMockModel('node2');
            const domNode1 = createMockDomNode('container1');
            const domNode2 = createMockDomNode('container2');
            // First register some nodes
            service.register('node1', domNode1, model1, MockComponent);
            service.register('node2', domNode2, model2, MockComponent);
            flushRaf();
            const listener = vitest_1.vi.fn();
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
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
            // Flush the batched notification
            flushRaf();
            // Listener should be called exactly once with final state
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            const entries = listener.mock.calls[0][0];
            (0, vitest_1.expect)(entries.size).toBe(2);
            (0, vitest_1.expect)(entries.has('node1')).toBe(true);
            (0, vitest_1.expect)(entries.has('node2')).toBe(false);
            (0, vitest_1.expect)(entries.has('node3')).toBe(true);
            (0, vitest_1.expect)((_a = entries.get('node1')) === null || _a === void 0 ? void 0 : _a.model.type).toBe('updated');
        });
        (0, vitest_1.it)('should allow new batches after previous one completes', () => {
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            const model1 = createMockModel('node1');
            const domNode1 = createMockDomNode('container1');
            // First batch
            service.register('node1', domNode1, model1, MockComponent);
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            // Second batch
            const model2 = createMockModel('node2');
            const domNode2 = createMockDomNode('container2');
            service.register('node2', domNode2, model2, MockComponent);
            flushRaf();
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(2);
        });
    });
});
//# sourceMappingURL=react-portal-service.spec.js.map