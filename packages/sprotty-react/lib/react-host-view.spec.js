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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const vitest_1 = require("vitest");
const inversify_1 = require("inversify");
const sprotty_1 = require("sprotty");
const di_config_1 = __importDefault(require("sprotty/lib/base/di.config"));
const react_host_view_1 = require("./react-host-view");
const react_portal_service_1 = require("./react-portal-service");
const types_1 = require("./types");
const react_model_1 = require("./react-model");
const React = __importStar(require("react"));
// Mock React component for testing
const MockComponent = ({ model }) => {
    return React.createElement('div', null, model.id);
};
// Create a minimal rendering context
function createMockContext() {
    return {
        viewRegistry: {},
        targetKind: 'main',
        decorate: (vnode, _element) => vnode,
        renderElement: (_element) => undefined,
        renderChildren: (_element) => []
    };
}
(0, vitest_1.describe)('ReactHostView', () => {
    let container;
    let view;
    (0, vitest_1.beforeEach)(() => {
        container = new inversify_1.Container();
        container.load(di_config_1.default);
        // Bind portal service
        container.bind(types_1.REACT_TYPES.ReactPortalService).to(react_portal_service_1.ReactPortalService).inSingletonScope();
        // Bind component registry with mock component
        container.bind(types_1.REACT_TYPES.ReactComponentRegistration).toConstantValue({
            type: 'react:node',
            component: MockComponent
        });
        container.bind(types_1.REACT_TYPES.ReactComponentRegistry).to(react_host_view_1.ReactComponentRegistry).inSingletonScope();
        // Bind and get the view
        container.bind(react_host_view_1.ReactHostView).toSelf();
        view = container.get(react_host_view_1.ReactHostView);
    });
    (0, vitest_1.describe)('render', () => {
        (0, vitest_1.it)('should return undefined if not visible', () => {
            const model = new react_model_1.SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 100, height: 50 };
            // Create a mock context that makes the element invisible
            const context = createMockContext();
            vitest_1.vi.spyOn(view, 'isVisible').mockReturnValue(false);
            const result = view.render(model, context);
            (0, vitest_1.expect)(result).toBeUndefined();
        });
        (0, vitest_1.it)('should return undefined if no component is registered', () => {
            const model = new react_model_1.SReactNode();
            model.id = 'node1';
            model.type = 'unregistered:type';
            model.size = { width: 100, height: 50 };
            const context = createMockContext();
            // Mock isVisible to return true so we can test component lookup
            vitest_1.vi.spyOn(view, 'isVisible').mockReturnValue(true);
            const consoleSpy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            const result = view.render(model, context);
            (0, vitest_1.expect)(result).toBeUndefined();
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('No React component registered'));
        });
        (0, vitest_1.it)('should render a VNode with foreignObject structure', () => {
            var _a, _b, _c, _d, _e;
            const model = new react_model_1.SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 150, height: 80 };
            const context = createMockContext();
            // Mock isVisible to return true
            vitest_1.vi.spyOn(view, 'isVisible').mockReturnValue(true);
            const result = view.render(model, context);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result === null || result === void 0 ? void 0 : result.sel).toBe('g');
            (0, vitest_1.expect)(result === null || result === void 0 ? void 0 : result.children).toHaveLength(1);
            const foreignObject = (_a = result === null || result === void 0 ? void 0 : result.children) === null || _a === void 0 ? void 0 : _a[0];
            (0, vitest_1.expect)(foreignObject.sel).toBe('foreignObject');
            (0, vitest_1.expect)((_c = (_b = foreignObject.data) === null || _b === void 0 ? void 0 : _b.attrs) === null || _c === void 0 ? void 0 : _c.width).toBe(150);
            (0, vitest_1.expect)((_e = (_d = foreignObject.data) === null || _d === void 0 ? void 0 : _d.attrs) === null || _e === void 0 ? void 0 : _e.height).toBe(80);
        });
        (0, vitest_1.it)('should use default size if model has no size', () => {
            var _a, _b, _c, _d, _e;
            // Create model without size property set
            const model = new sprotty_1.SModelElementImpl();
            model.id = 'node1';
            model.type = 'react:node';
            const context = createMockContext();
            // Mock isVisible to return true
            vitest_1.vi.spyOn(view, 'isVisible').mockReturnValue(true);
            const result = view.render(model, context);
            const foreignObject = (_a = result === null || result === void 0 ? void 0 : result.children) === null || _a === void 0 ? void 0 : _a[0];
            (0, vitest_1.expect)((_c = (_b = foreignObject.data) === null || _b === void 0 ? void 0 : _b.attrs) === null || _c === void 0 ? void 0 : _c.width).toBe(100); // default
            (0, vitest_1.expect)((_e = (_d = foreignObject.data) === null || _d === void 0 ? void 0 : _d.attrs) === null || _e === void 0 ? void 0 : _e.height).toBe(50); // default
        });
        (0, vitest_1.it)('should add lifecycle hooks to the inner div', () => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const model = new react_model_1.SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 100, height: 50 };
            const context = createMockContext();
            // Mock isVisible to return true
            vitest_1.vi.spyOn(view, 'isVisible').mockReturnValue(true);
            const result = view.render(model, context);
            const foreignObject = (_a = result === null || result === void 0 ? void 0 : result.children) === null || _a === void 0 ? void 0 : _a[0];
            const div = (_b = foreignObject === null || foreignObject === void 0 ? void 0 : foreignObject.children) === null || _b === void 0 ? void 0 : _b[0];
            (0, vitest_1.expect)((_d = (_c = div.data) === null || _c === void 0 ? void 0 : _c.hook) === null || _d === void 0 ? void 0 : _d.insert).toBeDefined();
            (0, vitest_1.expect)((_f = (_e = div.data) === null || _e === void 0 ? void 0 : _e.hook) === null || _f === void 0 ? void 0 : _f.update).toBeDefined();
            (0, vitest_1.expect)((_h = (_g = div.data) === null || _g === void 0 ? void 0 : _g.hook) === null || _h === void 0 ? void 0 : _h.destroy).toBeDefined();
        });
        (0, vitest_1.it)('should set selected class when model is selected', () => {
            var _a, _b, _c, _d;
            const model = new react_model_1.SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 100, height: 50 };
            model.selected = true;
            const context = createMockContext();
            // Mock isVisible to return true
            vitest_1.vi.spyOn(view, 'isVisible').mockReturnValue(true);
            const result = view.render(model, context);
            const foreignObject = (_a = result === null || result === void 0 ? void 0 : result.children) === null || _a === void 0 ? void 0 : _a[0];
            const div = (_b = foreignObject === null || foreignObject === void 0 ? void 0 : foreignObject.children) === null || _b === void 0 ? void 0 : _b[0];
            (0, vitest_1.expect)((_d = (_c = div.data) === null || _c === void 0 ? void 0 : _c.class) === null || _d === void 0 ? void 0 : _d.selected).toBe(true);
        });
    });
    (0, vitest_1.describe)('hasSize', () => {
        (0, vitest_1.it)('should return true for model with size', () => {
            const model = new react_model_1.SReactNode();
            model.size = { width: 100, height: 50 };
            (0, vitest_1.expect)((0, react_host_view_1.hasSize)(model)).toBe(true);
        });
        (0, vitest_1.it)('should return false for model without size property', () => {
            // SModelElementImpl doesn't have a size property by default
            const model = new sprotty_1.SModelElementImpl();
            model.id = 'test';
            (0, vitest_1.expect)((0, react_host_view_1.hasSize)(model)).toBe(false);
        });
        (0, vitest_1.it)('should return false for invalid size', () => {
            const model = { size: { width: 'invalid' } };
            (0, vitest_1.expect)((0, react_host_view_1.hasSize)(model)).toBe(false);
            const model2 = { size: 'not-an-object' };
            (0, vitest_1.expect)((0, react_host_view_1.hasSize)(model2)).toBe(false);
        });
    });
});
(0, vitest_1.describe)('ReactComponentRegistry', () => {
    let registry;
    (0, vitest_1.beforeEach)(() => {
        registry = new react_host_view_1.ReactComponentRegistry([]);
    });
    (0, vitest_1.it)('should register components', () => {
        registry.register('test:type', MockComponent);
        (0, vitest_1.expect)(registry.has('test:type')).toBe(true);
        (0, vitest_1.expect)(registry.get('test:type')).toBe(MockComponent);
    });
    (0, vitest_1.it)('should return undefined for unregistered types', () => {
        (0, vitest_1.expect)(registry.has('unknown')).toBe(false);
        (0, vitest_1.expect)(registry.get('unknown')).toBeUndefined();
    });
    (0, vitest_1.it)('should initialize with provided registrations', () => {
        const registryWithInit = new react_host_view_1.ReactComponentRegistry([
            { type: 'node:a', component: MockComponent },
            { type: 'node:b', component: MockComponent }
        ]);
        (0, vitest_1.expect)(registryWithInit.has('node:a')).toBe(true);
        (0, vitest_1.expect)(registryWithInit.has('node:b')).toBe(true);
    });
});
//# sourceMappingURL=react-host-view.spec.js.map