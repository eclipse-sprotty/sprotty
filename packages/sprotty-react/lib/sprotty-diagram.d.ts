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
import { Container } from 'inversify';
import { SModelRootImpl } from 'sprotty';
import { SModelRoot } from 'sprotty-protocol';
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
export declare const SprottyDiagram: React.FC<SprottyDiagramProps>;
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
export declare function useSprottyContainerFactory(factory: () => Container): Container;
//# sourceMappingURL=sprotty-diagram.d.ts.map