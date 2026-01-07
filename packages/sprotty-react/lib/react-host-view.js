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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactHostView = exports.hasSize = exports.ReactComponentRegistry = void 0;
const inversify_1 = require("inversify");
const snabbdom_1 = require("snabbdom");
const sprotty_1 = require("sprotty");
const types_1 = require("./types");
const react_portal_service_1 = require("./react-portal-service");
const contexts_1 = require("./contexts");
const React = __importStar(require("react"));
const ReactDOMClient = __importStar(require("react-dom/client"));
const react_dom_1 = require("react-dom");
/**
 * Registry for React components mapped to model types.
 */
let ReactComponentRegistry = class ReactComponentRegistry {
    constructor(registrations = []) {
        this.components = new Map();
        registrations.forEach(reg => {
            this.register(reg.type, reg.component);
        });
    }
    /**
     * Register a React component for a model type.
     */
    register(type, component) {
        this.components.set(type, component);
    }
    /**
     * Get the React component for a model type.
     */
    get(type) {
        return this.components.get(type);
    }
    /**
     * Check if a component is registered for a type.
     */
    has(type) {
        return this.components.has(type);
    }
};
exports.ReactComponentRegistry = ReactComponentRegistry;
exports.ReactComponentRegistry = ReactComponentRegistry = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.multiInject)(types_1.REACT_TYPES.ReactComponentRegistration)),
    __param(0, (0, inversify_1.optional)()),
    __metadata("design:paramtypes", [Array])
], ReactComponentRegistry);
/**
 * Type guard to check if a model element has size information.
 */
function hasSize(model) {
    return 'size' in model &&
        typeof model.size === 'object' &&
        typeof model.size.width === 'number' &&
        typeof model.size.height === 'number';
}
exports.hasSize = hasSize;
const SVGNS = 'http://www.w3.org/2000/svg';
const XHTMLNS = 'http://www.w3.org/1999/xhtml';
/**
 * A Sprotty view that renders a foreignObject container for React components.
 *
 * This view creates an SVG foreignObject element with a div inside it. The div
 * serves as the target for a React Portal. When Snabbdom inserts this VNode into
 * the DOM, the insert hook registers the DOM node with the ReactPortalService,
 * which triggers React to create a portal rendering the user's React component.
 *
 * In hidden mode (for bounds measurement), React components are rendered
 * synchronously using flushSync to ensure content is available for measurement
 * before layout calculations.
 *
 * Lifecycle:
 * - insert: Register the DOM node with ReactPortalService (or render synchronously in hidden mode)
 * - update: Notify ReactPortalService of model changes
 * - destroy: Unregister from ReactPortalService, triggering portal unmount
 */
let ReactHostView = class ReactHostView extends sprotty_1.ShapeView {
    constructor() {
        super(...arguments);
        /**
         * Track React roots created for hidden mode rendering.
         * These need to be cleaned up when the hidden VNodes are destroyed.
         */
        this.hiddenRoots = new Map();
    }
    render(model, context, args) {
        if (!this.isVisible(model, context)) {
            return undefined;
        }
        const size = this.getSize(model);
        const componentType = this.componentRegistry.get(model.type);
        if (!componentType) {
            console.warn(`No React component registered for type: ${model.type}`);
            return undefined;
        }
        // Store component type for use in hooks
        const component = componentType;
        // Check if we're rendering in hidden mode (for bounds measurement)
        const isHidden = context.targetKind === 'hidden';
        // Build the VNode tree using explicit h() calls to avoid JSX type conflicts
        // between React and Snabbdom when @types/react is installed
        const divNode = (0, snabbdom_1.h)('div', {
            attrs: {
                xmlns: XHTMLNS
            },
            class: {
                'sprotty-react-node': true,
                'selected': model.selected === true
            },
            hook: {
                insert: (vnode) => this.onInsert(vnode, model, component, isHidden),
                update: (_oldVnode, newVnode) => this.onUpdate(newVnode, model, isHidden),
                destroy: (vnode) => this.onDestroy(vnode, model)
            }
        });
        const foreignObjectNode = (0, snabbdom_1.h)('foreignObject', {
            ns: SVGNS,
            attrs: {
                requiredFeatures: 'http://www.w3.org/TR/SVG11/feature#Extensibility',
                width: Math.max(size.width, 1),
                height: Math.max(size.height, 1),
                x: 0,
                y: 0
            },
            class: {
                'sprotty-react-foreign-object': true
            }
        }, [divNode]);
        return (0, snabbdom_1.h)('g', { ns: SVGNS }, [foreignObjectNode]);
    }
    /**
     * Get the size of the model element.
     * Falls back to default size if not specified.
     */
    getSize(model) {
        if (hasSize(model)) {
            return model.size;
        }
        // Default size if not specified
        return { width: 100, height: 50 };
    }
    /**
     * Called when the VNode is inserted into the DOM.
     *
     * In hidden mode: Renders the React component synchronously using flushSync
     * so the content is available for bounds measurement. The component is wrapped
     * with SprottyContextProvider to ensure hooks like useSprottyDispatch work.
     *
     * In normal mode: Registers the portal with ReactPortalService for async rendering.
     */
    onInsert(vnode, model, componentType, isHidden) {
        if (vnode.elm && vnode.elm instanceof HTMLElement) {
            if (isHidden) {
                // Hidden mode: render synchronously for measurement
                // Use flushSync to ensure React renders immediately before bounds are measured
                // Wrap with SprottyContextProvider so hooks work during hidden rendering
                const root = ReactDOMClient.createRoot(vnode.elm);
                this.hiddenRoots.set(model.id, root);
                (0, react_dom_1.flushSync)(() => {
                    // Create the component element
                    const componentElement = React.createElement(componentType, { model: model });
                    // Wrap with context provider so hooks work during hidden rendering
                    const wrappedElement = React.createElement(contexts_1.SprottyContextProvider, {
                        dispatcher: this.actionDispatcher,
                        model: null,
                        portalService: this.portalService,
                        children: componentElement
                    });
                    root.render(wrappedElement);
                });
            }
            else {
                // Normal mode: use portal mechanism for async rendering
                this.portalService.register(model.id, vnode.elm, model, componentType);
            }
        }
    }
    /**
     * Called when the VNode is updated.
     * Notifies ReactPortalService of model changes (only in normal mode).
     */
    onUpdate(vnode, model, isHidden) {
        if (!isHidden) {
            this.portalService.update(model.id, model);
        }
        // In hidden mode, updates are not needed as the hidden rendering is transient
    }
    /**
     * Called when the VNode is removed from the DOM.
     * Cleans up React roots (hidden mode) or unregisters from portal service.
     */
    onDestroy(vnode, model) {
        // Clean up hidden mode roots
        const hiddenRoot = this.hiddenRoots.get(model.id);
        if (hiddenRoot) {
            hiddenRoot.unmount();
            this.hiddenRoots.delete(model.id);
        }
        // Also unregister from portal service (safe to call even if not registered)
        this.portalService.unregister(model.id);
    }
    /**
     * Determine if the element should be rendered.
     * Checks viewport visibility for performance optimization.
     */
    isVisible(model, context) {
        if (context.targetKind === 'hidden') {
            return true;
        }
        // Check if the model has bounds
        const bounds = model.bounds;
        if (!bounds) {
            return true;
        }
        // Check viewport visibility if we have a viewport
        const root = model.root;
        if ((0, sprotty_1.isViewport)(root)) {
            const viewport = root;
            const canvasBounds = viewport.canvasBounds;
            const scroll = viewport.scroll;
            const zoom = viewport.zoom;
            // Transform model bounds to canvas coordinates
            const viewBounds = {
                x: (bounds.x - scroll.x) * zoom,
                y: (bounds.y - scroll.y) * zoom,
                width: bounds.width * zoom,
                height: bounds.height * zoom
            };
            // Check if bounds intersect with canvas
            return !(viewBounds.x + viewBounds.width < 0 ||
                viewBounds.y + viewBounds.height < 0 ||
                viewBounds.x > canvasBounds.width ||
                viewBounds.y > canvasBounds.height);
        }
        return true;
    }
};
exports.ReactHostView = ReactHostView;
__decorate([
    (0, inversify_1.inject)(types_1.REACT_TYPES.ReactPortalService),
    __metadata("design:type", react_portal_service_1.ReactPortalService)
], ReactHostView.prototype, "portalService", void 0);
__decorate([
    (0, inversify_1.inject)(types_1.REACT_TYPES.ReactComponentRegistry),
    __metadata("design:type", ReactComponentRegistry)
], ReactHostView.prototype, "componentRegistry", void 0);
__decorate([
    (0, inversify_1.inject)(sprotty_1.TYPES.IActionDispatcher),
    __metadata("design:type", Object)
], ReactHostView.prototype, "actionDispatcher", void 0);
exports.ReactHostView = ReactHostView = __decorate([
    (0, inversify_1.injectable)()
], ReactHostView);
//# sourceMappingURL=react-host-view.js.map