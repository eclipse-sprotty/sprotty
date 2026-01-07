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

import { injectable, inject, optional, multiInject } from 'inversify';
import { VNode, h } from 'snabbdom';
import {
    IView,
    RenderingContext,
    SModelElementImpl,
    ShapeView,
    IViewArgs,
    isViewport,
    TYPES,
    IActionDispatcher
} from 'sprotty';
import { Bounds } from 'sprotty-protocol';
import { REACT_TYPES } from './types';
import { ReactPortalService, ReactNodeProps } from './react-portal-service';
import { SprottyContextProvider } from './contexts';
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { flushSync } from 'react-dom';

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
@injectable()
export class ReactComponentRegistry {
    protected readonly components: Map<string, React.ComponentType<ReactNodeProps>> = new Map();

    constructor(
        @multiInject(REACT_TYPES.ReactComponentRegistration) @optional()
        registrations: ReactComponentRegistration[] = []
    ) {
        registrations.forEach(reg => {
            this.register(reg.type, reg.component);
        });
    }

    /**
     * Register a React component for a model type.
     */
    register(type: string, component: React.ComponentType<ReactNodeProps>): void {
        this.components.set(type, component);
    }

    /**
     * Get the React component for a model type.
     */
    get(type: string): React.ComponentType<ReactNodeProps> | undefined {
        return this.components.get(type);
    }

    /**
     * Check if a component is registered for a type.
     */
    has(type: string): boolean {
        return this.components.has(type);
    }
}

/**
 * Interface for model elements that can be rendered as React nodes.
 * Extends SModelElementImpl with size information needed for the foreignObject.
 */
export interface ReactNodeModel extends SModelElementImpl {
    /** The size of the node */
    size: { width: number; height: number };
}

/**
 * Type guard to check if a model element has size information.
 */
export function hasSize(model: SModelElementImpl): model is ReactNodeModel {
    return 'size' in model &&
        typeof (model as any).size === 'object' &&
        typeof (model as any).size.width === 'number' &&
        typeof (model as any).size.height === 'number';
}

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
@injectable()
export class ReactHostView extends ShapeView implements IView {

    @inject(REACT_TYPES.ReactPortalService)
    protected portalService: ReactPortalService;

    @inject(REACT_TYPES.ReactComponentRegistry)
    protected componentRegistry: ReactComponentRegistry;

    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    /**
     * Track React roots created for hidden mode rendering.
     * These need to be cleaned up when the hidden VNodes are destroyed.
     */
    protected hiddenRoots: Map<string, ReactDOMClient.Root> = new Map();

    render(model: Readonly<SModelElementImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
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
        const divNode = h('div', {
            attrs: {
                xmlns: XHTMLNS
            },
            class: {
                'sprotty-react-node': true,
                'selected': (model as any).selected === true
            },
            hook: {
                insert: (vnode: VNode) => this.onInsert(vnode, model, component, isHidden),
                update: (_oldVnode: VNode, newVnode: VNode) => this.onUpdate(newVnode, model, isHidden),
                destroy: (vnode: VNode) => this.onDestroy(vnode, model)
            }
        });

        const foreignObjectNode = h('foreignObject', {
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

        return h('g', { ns: SVGNS }, [foreignObjectNode]);
    }

    /**
     * Get the size of the model element.
     * Falls back to default size if not specified.
     */
    protected getSize(model: Readonly<SModelElementImpl>): { width: number; height: number } {
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
    protected onInsert(
        vnode: VNode,
        model: Readonly<SModelElementImpl>,
        componentType: React.ComponentType<ReactNodeProps>,
        isHidden: boolean
    ): void {
        if (vnode.elm && vnode.elm instanceof HTMLElement) {
            if (isHidden) {
                // Hidden mode: render synchronously for measurement
                // Use flushSync to ensure React renders immediately before bounds are measured
                // Wrap with SprottyContextProvider so hooks work during hidden rendering
                const root = ReactDOMClient.createRoot(vnode.elm);
                this.hiddenRoots.set(model.id, root);
                flushSync(() => {
                    // Create the component element
                    const componentElement = React.createElement(componentType, { model: model as SModelElementImpl });
                    // Wrap with context provider so hooks work during hidden rendering
                    const wrappedElement = React.createElement(
                        SprottyContextProvider,
                        {
                            dispatcher: this.actionDispatcher,
                            model: null,
                            portalService: this.portalService,
                            children: componentElement
                        }
                    );
                    root.render(wrappedElement);
                });
            } else {
                // Normal mode: use portal mechanism for async rendering
                this.portalService.register(
                    model.id,
                    vnode.elm,
                    model as SModelElementImpl,
                    componentType
                );
            }
        }
    }

    /**
     * Called when the VNode is updated.
     * Notifies ReactPortalService of model changes (only in normal mode).
     */
    protected onUpdate(vnode: VNode, model: Readonly<SModelElementImpl>, isHidden: boolean): void {
        if (!isHidden) {
            this.portalService.update(model.id, model as SModelElementImpl);
        }
        // In hidden mode, updates are not needed as the hidden rendering is transient
    }

    /**
     * Called when the VNode is removed from the DOM.
     * Cleans up React roots (hidden mode) or unregisters from portal service.
     */
    protected onDestroy(vnode: VNode, model: Readonly<SModelElementImpl>): void {
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
    override isVisible(model: Readonly<SModelElementImpl>, context: RenderingContext): boolean {
        if (context.targetKind === 'hidden') {
            return true;
        }

        // Check if the model has bounds
        const bounds = (model as any).bounds as Bounds | undefined;
        if (!bounds) {
            return true;
        }

        // Check viewport visibility if we have a viewport
        const root = model.root;
        if (isViewport(root)) {
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
            return !(
                viewBounds.x + viewBounds.width < 0 ||
                viewBounds.y + viewBounds.height < 0 ||
                viewBounds.x > canvasBounds.width ||
                viewBounds.y > canvasBounds.height
            );
        }

        return true;
    }
}
