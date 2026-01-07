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

import { interfaces } from 'inversify';
import {
    SModelElementImpl,
    TYPES,
    registerModelElement,
    CustomFeatures
} from 'sprotty';
import * as React from 'react';
import { REACT_TYPES } from './types';
import { ReactHostView, ReactComponentRegistration } from './react-host-view';
import { ReactNodeProps } from './react-portal-service';
// SReactNode is re-exported for convenience but used only in documentation
export { SReactNode } from './react-model';

/**
 * Configuration context for Inversify bindings.
 */
export interface ConfigurationContext {
    bind: interfaces.Bind;
    unbind?: interfaces.Unbind;
    isBound: interfaces.IsBound;
    rebind?: interfaces.Rebind;
}

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
export function configureReactNode(
    context: ConfigurationContext,
    type: string,
    modelClass: new () => SModelElementImpl,
    component: React.ComponentType<ReactNodeProps>,
    features?: CustomFeatures
): void {
    // Register the model element
    registerModelElement(context, type, modelClass, features);

    // Bind ReactHostView for this type
    configureReactView(context, type);

    // Register the React component
    context.bind<ReactComponentRegistration>(REACT_TYPES.ReactComponentRegistration).toConstantValue({
        type,
        component
    });
}

/**
 * Configure ReactHostView as the view for a model element type.
 *
 * Use this when you want to use ReactHostView but need to register
 * the model element and React component separately.
 *
 * @param context - The Inversify binding context
 * @param type - The model element type
 */
export function configureReactView(
    context: ConfigurationContext,
    type: string
): void {
    // Ensure ReactHostView is bound
    if (!context.isBound(ReactHostView)) {
        context.bind(ReactHostView).toSelf();
    }

    // Register the view for this type
    context.bind(TYPES.ViewRegistration).toDynamicValue(ctx => ({
        type,
        factory: () => ctx.container.get(ReactHostView)
    }));
}

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
export function registerReactComponent(
    context: ConfigurationContext,
    type: string,
    component: React.ComponentType<ReactNodeProps>
): void {
    context.bind<ReactComponentRegistration>(REACT_TYPES.ReactComponentRegistration).toConstantValue({
        type,
        component
    });
}

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
export function configureReactNodes(
    context: ConfigurationContext,
    configs: Array<{
        type: string;
        modelClass: new () => SModelElementImpl;
        component: React.ComponentType<ReactNodeProps>;
        features?: CustomFeatures;
    }>
): void {
    configs.forEach(config => {
        configureReactNode(
            context,
            config.type,
            config.modelClass,
            config.component,
            config.features
        );
    });
}

/**
 * Override an existing node type to use React rendering.
 *
 * @param context - The Inversify binding context
 * @param type - The model element type to override
 * @param modelClass - The model class constructor
 * @param component - The React component to render
 * @param features - Optional custom features
 */
export function overrideWithReactNode(
    context: ConfigurationContext,
    type: string,
    modelClass: new () => SModelElementImpl,
    component: React.ComponentType<ReactNodeProps>,
    features?: CustomFeatures
): void {
    // Register the model element with override flag
    registerModelElement(context, type, modelClass, features, true);

    // Override the view binding
    if (context.rebind) {
        // If rebind is available, use it
        if (!context.isBound(ReactHostView)) {
            context.bind(ReactHostView).toSelf();
        }
        context.bind(TYPES.ViewRegistration).toDynamicValue(ctx => ({
            type,
            factory: () => ctx.container.get(ReactHostView),
            isOverride: true
        }));
    } else {
        // Fall back to regular binding with isOverride flag
        configureReactView(context, type);
    }

    // Register the React component
    context.bind<ReactComponentRegistration>(REACT_TYPES.ReactComponentRegistration).toConstantValue({
        type,
        component
    });
}

