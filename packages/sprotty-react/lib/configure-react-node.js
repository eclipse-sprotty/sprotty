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
exports.overrideWithReactNode = exports.configureReactNodes = exports.registerReactComponent = exports.configureReactView = exports.configureReactNode = exports.SReactNode = void 0;
const sprotty_1 = require("sprotty");
const types_1 = require("./types");
const react_host_view_1 = require("./react-host-view");
// SReactNode is re-exported for convenience but used only in documentation
var react_model_1 = require("./react-model");
Object.defineProperty(exports, "SReactNode", { enumerable: true, get: function () { return react_model_1.SReactNode; } });
/**
 * Configure a React-rendered node type in the DI container.
 *
 * This helper function performs all necessary bindings to render a model
 * element type using a React component:
 *
 * 1. Registers the model element class for the type
 * 2. Binds ReactHostView as the view for the type
 * 3. Registers the React component in the ReactComponentRegistry
 *
 * @param context - The Inversify binding context
 * @param type - The model element type (e.g., 'node:task')
 * @param modelClass - The model class constructor (default: SReactNode)
 * @param component - The React component to render
 * @param features - Optional custom features to enable/disable
 *
 * @example
 * ```typescript
 * import { ContainerModule } from 'inversify';
 * import { SGraphImpl, SGraphView, configureModelElement } from 'sprotty';
 * import { configureReactNode, SReactNode } from 'sprotty-react';
 * import { TaskNodeComponent } from './task-node';
 *
 * const myModule = new ContainerModule((bind, unbind, isBound, rebind) => {
 *     const context = { bind, unbind, isBound, rebind };
 *
 *     // Standard Sprotty element
 *     configureModelElement(context, 'graph', SGraphImpl, SGraphView);
 *
 *     // React node with default model class
 *     configureReactNode(context, 'node:task', SReactNode, TaskNodeComponent);
 *
 *     // React node with custom model class
 *     configureReactNode(context, 'node:user', UserNode, UserNodeComponent);
 * });
 * ```
 */
function configureReactNode(context, type, modelClass, component, features) {
    // Register the model element
    (0, sprotty_1.registerModelElement)(context, type, modelClass, features);
    // Bind ReactHostView for this type
    configureReactView(context, type);
    // Register the React component
    context.bind(types_1.REACT_TYPES.ReactComponentRegistration).toConstantValue({
        type,
        component
    });
}
exports.configureReactNode = configureReactNode;
/**
 * Configure ReactHostView as the view for a model element type.
 *
 * Use this when you want to use ReactHostView but need to register
 * the model element and React component separately.
 *
 * @param context - The Inversify binding context
 * @param type - The model element type
 */
function configureReactView(context, type) {
    // Ensure ReactHostView is bound
    if (!context.isBound(react_host_view_1.ReactHostView)) {
        context.bind(react_host_view_1.ReactHostView).toSelf();
    }
    // Register the view for this type
    context.bind(sprotty_1.TYPES.ViewRegistration).toDynamicValue(ctx => ({
        type,
        factory: () => ctx.container.get(react_host_view_1.ReactHostView)
    }));
}
exports.configureReactView = configureReactView;
/**
 * Register a React component for a model type without configuring the view.
 *
 * Use this when you want to manually configure the view but still want
 * the component registered in the ReactComponentRegistry.
 *
 * @param context - The Inversify binding context
 * @param type - The model element type
 * @param component - The React component to render
 */
function registerReactComponent(context, type, component) {
    context.bind(types_1.REACT_TYPES.ReactComponentRegistration).toConstantValue({
        type,
        component
    });
}
exports.registerReactComponent = registerReactComponent;
/**
 * Configure multiple React nodes at once.
 *
 * @param context - The Inversify binding context
 * @param configs - Array of node configurations
 *
 * @example
 * ```typescript
 * configureReactNodes(context, [
 *     { type: 'node:task', modelClass: SReactNode, component: TaskNode },
 *     { type: 'node:user', modelClass: UserNode, component: UserNodeComponent },
 *     { type: 'node:group', modelClass: GroupNode, component: GroupNodeComponent }
 * ]);
 * ```
 */
function configureReactNodes(context, configs) {
    configs.forEach(config => {
        configureReactNode(context, config.type, config.modelClass, config.component, config.features);
    });
}
exports.configureReactNodes = configureReactNodes;
/**
 * Override an existing node type to use React rendering.
 *
 * @param context - The Inversify binding context
 * @param type - The model element type to override
 * @param modelClass - The model class constructor
 * @param component - The React component to render
 * @param features - Optional custom features
 */
function overrideWithReactNode(context, type, modelClass, component, features) {
    // Register the model element with override flag
    (0, sprotty_1.registerModelElement)(context, type, modelClass, features, true);
    // Override the view binding
    if (context.rebind) {
        // If rebind is available, use it
        if (!context.isBound(react_host_view_1.ReactHostView)) {
            context.bind(react_host_view_1.ReactHostView).toSelf();
        }
        context.bind(sprotty_1.TYPES.ViewRegistration).toDynamicValue(ctx => ({
            type,
            factory: () => ctx.container.get(react_host_view_1.ReactHostView),
            isOverride: true
        }));
    }
    else {
        // Fall back to regular binding with isOverride flag
        configureReactView(context, type);
    }
    // Register the React component
    context.bind(types_1.REACT_TYPES.ReactComponentRegistration).toConstantValue({
        type,
        component
    });
}
exports.overrideWithReactNode = overrideWithReactNode;
//# sourceMappingURL=configure-react-node.js.map