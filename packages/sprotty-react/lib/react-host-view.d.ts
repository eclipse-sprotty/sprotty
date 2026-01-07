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
import { VNode } from 'snabbdom';
import { IView, RenderingContext, SModelElementImpl, ShapeView, IViewArgs, IActionDispatcher } from 'sprotty';
import { ReactPortalService, ReactNodeProps } from './react-portal-service';
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
/**
 * Registration for mapping a model type to a React component.
 */
export interface ReactComponentRegistration {
    /** The model element type (e.g., 'node:task') */
    type: string;
    /** The React component to render for this type */
    component: React.ComponentType<ReactNodeProps>;
}
/**
 * Registry for React components mapped to model types.
 */
export declare class ReactComponentRegistry {
    protected readonly components: Map<string, React.ComponentType<ReactNodeProps>>;
    constructor(registrations?: ReactComponentRegistration[]);
    /**
     * Register a React component for a model type.
     */
    register(type: string, component: React.ComponentType<ReactNodeProps>): void;
    /**
     * Get the React component for a model type.
     */
    get(type: string): React.ComponentType<ReactNodeProps> | undefined;
    /**
     * Check if a component is registered for a type.
     */
    has(type: string): boolean;
}
/**
 * Interface for model elements that can be rendered as React nodes.
 * Extends SModelElementImpl with size information needed for the foreignObject.
 */
export interface ReactNodeModel extends SModelElementImpl {
    /** The size of the node */
    size: {
        width: number;
        height: number;
    };
}
/**
 * Type guard to check if a model element has size information.
 */
export declare function hasSize(model: SModelElementImpl): model is ReactNodeModel;
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
export declare class ReactHostView extends ShapeView implements IView {
    protected portalService: ReactPortalService;
    protected componentRegistry: ReactComponentRegistry;
    protected actionDispatcher: IActionDispatcher;
    /**
     * Track React roots created for hidden mode rendering.
     * These need to be cleaned up when the hidden VNodes are destroyed.
     */
    protected hiddenRoots: Map<string, ReactDOMClient.Root>;
    render(model: Readonly<SModelElementImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    /**
     * Get the size of the model element.
     * Falls back to default size if not specified.
     */
    protected getSize(model: Readonly<SModelElementImpl>): {
        width: number;
        height: number;
    };
    /**
     * Called when the VNode is inserted into the DOM.
     *
     * In hidden mode: Renders the React component synchronously using flushSync
     * so the content is available for bounds measurement. The component is wrapped
     * with SprottyContextProvider to ensure hooks like useSprottyDispatch work.
     *
     * In normal mode: Registers the portal with ReactPortalService for async rendering.
     */
    protected onInsert(vnode: VNode, model: Readonly<SModelElementImpl>, componentType: React.ComponentType<ReactNodeProps>, isHidden: boolean): void;
    /**
     * Called when the VNode is updated.
     * Notifies ReactPortalService of model changes (only in normal mode).
     */
    protected onUpdate(vnode: VNode, model: Readonly<SModelElementImpl>, isHidden: boolean): void;
    /**
     * Called when the VNode is removed from the DOM.
     * Cleans up React roots (hidden mode) or unregisters from portal service.
     */
    protected onDestroy(vnode: VNode, model: Readonly<SModelElementImpl>): void;
    /**
     * Determine if the element should be rendered.
     * Checks viewport visibility for performance optimization.
     */
    isVisible(model: Readonly<SModelElementImpl>, context: RenderingContext): boolean;
}
//# sourceMappingURL=react-host-view.d.ts.map