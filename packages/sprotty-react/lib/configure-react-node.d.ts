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
import { SModelElementImpl, CustomFeatures } from 'sprotty';
import * as React from 'react';
import { ReactNodeProps } from './react-portal-service';
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
export declare function configureReactNode(context: ConfigurationContext, type: string, modelClass: new () => SModelElementImpl, component: React.ComponentType<ReactNodeProps>, features?: CustomFeatures): void;
/**
 * Configure ReactHostView as the view for a model element type.
 *
 * Use this when you want to use ReactHostView but need to register
 * the model element and React component separately.
 *
 * @param context - The Inversify binding context
 * @param type - The model element type
 */
export declare function configureReactView(context: ConfigurationContext, type: string): void;
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
export declare function registerReactComponent(context: ConfigurationContext, type: string, component: React.ComponentType<ReactNodeProps>): void;
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
export declare function configureReactNodes(context: ConfigurationContext, configs: Array<{
    type: string;
    modelClass: new () => SModelElementImpl;
    component: React.ComponentType<ReactNodeProps>;
    features?: CustomFeatures;
}>): void;
/**
 * Override an existing node type to use React rendering.
 *
 * @param context - The Inversify binding context
 * @param type - The model element type to override
 * @param modelClass - The model class constructor
 * @param component - The React component to render
 * @param features - Optional custom features
 */
export declare function overrideWithReactNode(context: ConfigurationContext, type: string, modelClass: new () => SModelElementImpl, component: React.ComponentType<ReactNodeProps>, features?: CustomFeatures): void;
//# sourceMappingURL=configure-react-node.d.ts.map