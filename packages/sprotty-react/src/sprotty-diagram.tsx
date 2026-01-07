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

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Container } from 'inversify';
import {
    TYPES,
    IActionDispatcher,
    SModelRootImpl,
    LocalModelSource,
    ModelSource
} from 'sprotty';
import { SModelRoot } from 'sprotty-protocol';
import { REACT_TYPES } from './types';
import { ReactPortalService } from './react-portal-service';
import { SprottyContextProvider } from './contexts';
import { PortalManager } from './portal-manager';

/**
 * Props for the SprottyDiagram component.
 */
export interface SprottyDiagramProps {
    /**
     * The Inversify container with all Sprotty bindings.
     * Must have reactModule loaded.
     */
    container: Container;

    /**
     * Optional initial model to display.
     * If using LocalModelSource, this will be set as the initial model.
     */
    initialModel?: SModelRoot;

    /**
     * Callback when the model changes.
     */
    onModelChange?: (model: SModelRootImpl) => void;

    /**
     * Whether to wrap portal components in EventTrap (default: true).
     */
    useEventTrap?: boolean;

    /**
     * Additional class name for the container div.
     */
    className?: string;

    /**
     * Additional style for the container div.
     */
    style?: React.CSSProperties;

    /**
     * Children to render alongside the diagram (e.g., overlays).
     */
    children?: React.ReactNode;
}

/**
 * Main React wrapper component for Sprotty diagrams.
 *
 * SprottyDiagram integrates a Sprotty diagram into a React application,
 * providing:
 *
 * - Context providers for action dispatch and model access
 * - Portal management for rendering React components as diagram nodes
 * - Automatic model source initialization
 * - Lifecycle management for the Sprotty container
 *
 * @example
 * ```tsx
 * import { Container } from 'inversify';
 * import { loadDefaultModules } from 'sprotty';
 * import { reactModule, SprottyDiagram } from 'sprotty-react';
 *
 * const container = new Container();
 * loadDefaultModules(container);
 * container.load(reactModule, myModule);
 *
 * const App = () => (
 *     <ThemeProvider theme={myTheme}>
 *         <SprottyDiagram
 *             container={container}
 *             initialModel={myModel}
 *         />
 *     </ThemeProvider>
 * );
 * ```
 *
 * React nodes rendered within the diagram have access to all ancestor
 * contexts (like ThemeProvider above) because they are rendered via
 * React Portals that maintain the React tree hierarchy.
 */
export const SprottyDiagram: React.FC<SprottyDiagramProps> = ({
    container,
    initialModel,
    onModelChange,
    useEventTrap = true,
    className,
    style,
    children
}) => {
    const [dispatcher, setDispatcher] = useState<IActionDispatcher | null>(null);
    const [portalService, setPortalService] = useState<ReactPortalService | null>(null);
    const [model, setModel] = useState<SModelRootImpl | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);

    // Initialize Sprotty services from the container
    useEffect(() => {
        if (initializedRef.current) {
            return;
        }
        initializedRef.current = true;

        try {
            // Get the action dispatcher
            const actionDispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
            setDispatcher(actionDispatcher);

            // Get the portal service
            const reactPortalService = container.get<ReactPortalService>(REACT_TYPES.ReactPortalService);
            setPortalService(reactPortalService);

            // Get the model source and set initial model if using LocalModelSource
            if (container.isBound(TYPES.ModelSource)) {
                const modelSource = container.get<ModelSource>(TYPES.ModelSource);

                if (modelSource instanceof LocalModelSource) {
                    // Subscribe to model changes
                    const originalSetModel = modelSource.setModel.bind(modelSource);
                    modelSource.setModel = async (newModel: SModelRoot) => {
                        await originalSetModel(newModel);
                        const currentModel = (modelSource as any).currentRoot as SModelRootImpl;
                        if (currentModel) {
                            setModel(currentModel);
                            onModelChange?.(currentModel);
                        }
                    };

                    // Set initial model if provided
                    if (initialModel) {
                        modelSource.setModel(initialModel);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to initialize SprottyDiagram:', error);
        }

        // Cleanup on unmount
        return () => {
            portalService?.clear();
        };
    }, [container, initialModel, onModelChange]);

    // Render loading state if not initialized
    if (!dispatcher || !portalService) {
        return (
            <div
                ref={containerRef}
                className={`sprotty-diagram-loading ${className || ''}`}
                style={style}
            />
        );
    }

    return (
        <SprottyContextProvider
            dispatcher={dispatcher}
            model={model}
            container={container}
            portalService={portalService}
        >
            <div
                ref={containerRef}
                className={`sprotty-diagram-container ${className || ''}`}
                style={style}
            >
                {/* The actual Sprotty diagram is rendered by the container's baseDiv */}
                {/* Portals are rendered here, but visually appear in the SVG foreignObjects */}
                <PortalManager
                    portalService={portalService}
                    useEventTrap={useEventTrap}
                />
                {children}
            </div>
        </SprottyContextProvider>
    );
};

SprottyDiagram.displayName = 'SprottyDiagram';

/**
 * Hook to create and manage a Sprotty container.
 *
 * @example
 * ```tsx
 * const App = () => {
 *     const container = useSprottyContainer(() => {
 *         const c = new Container();
 *         loadDefaultModules(c);
 *         c.load(reactModule, myModule);
 *         return c;
 *     });
 *
 *     return <SprottyDiagram container={container} />;
 * };
 * ```
 */
export function useSprottyContainerFactory(factory: () => Container): Container {
    const [container] = useState(() => factory());
    return container;
}

