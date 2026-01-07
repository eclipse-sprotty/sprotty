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
exports.useSprottyContainerFactory = exports.SprottyDiagram = void 0;
const React = __importStar(require("react"));
const react_1 = require("react");
const sprotty_1 = require("sprotty");
const types_1 = require("./types");
const contexts_1 = require("./contexts");
const portal_manager_1 = require("./portal-manager");
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
const SprottyDiagram = ({ container, initialModel, onModelChange, useEventTrap = true, className, style, children }) => {
    const [dispatcher, setDispatcher] = (0, react_1.useState)(null);
    const [portalService, setPortalService] = (0, react_1.useState)(null);
    const [model, setModel] = (0, react_1.useState)(null);
    const containerRef = (0, react_1.useRef)(null);
    const initializedRef = (0, react_1.useRef)(false);
    // Initialize Sprotty services from the container
    (0, react_1.useEffect)(() => {
        if (initializedRef.current) {
            return;
        }
        initializedRef.current = true;
        try {
            // Get the action dispatcher
            const actionDispatcher = container.get(sprotty_1.TYPES.IActionDispatcher);
            setDispatcher(actionDispatcher);
            // Get the portal service
            const reactPortalService = container.get(types_1.REACT_TYPES.ReactPortalService);
            setPortalService(reactPortalService);
            // Get the model source and set initial model if using LocalModelSource
            if (container.isBound(sprotty_1.TYPES.ModelSource)) {
                const modelSource = container.get(sprotty_1.TYPES.ModelSource);
                if (modelSource instanceof sprotty_1.LocalModelSource) {
                    // Subscribe to model changes
                    const originalSetModel = modelSource.setModel.bind(modelSource);
                    modelSource.setModel = async (newModel) => {
                        await originalSetModel(newModel);
                        const currentModel = modelSource.currentRoot;
                        if (currentModel) {
                            setModel(currentModel);
                            onModelChange === null || onModelChange === void 0 ? void 0 : onModelChange(currentModel);
                        }
                    };
                    // Set initial model if provided
                    if (initialModel) {
                        modelSource.setModel(initialModel);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to initialize SprottyDiagram:', error);
        }
        // Cleanup on unmount
        return () => {
            portalService === null || portalService === void 0 ? void 0 : portalService.clear();
        };
    }, [container, initialModel, onModelChange]);
    // Render loading state if not initialized
    if (!dispatcher || !portalService) {
        return (React.createElement("div", { ref: containerRef, className: `sprotty-diagram-loading ${className || ''}`, style: style }));
    }
    return (React.createElement(contexts_1.SprottyContextProvider, { dispatcher: dispatcher, model: model, container: container, portalService: portalService },
        React.createElement("div", { ref: containerRef, className: `sprotty-diagram-container ${className || ''}`, style: style },
            React.createElement(portal_manager_1.PortalManager, { portalService: portalService, useEventTrap: useEventTrap }),
            children)));
};
exports.SprottyDiagram = SprottyDiagram;
exports.SprottyDiagram.displayName = 'SprottyDiagram';
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
function useSprottyContainerFactory(factory) {
    const [container] = (0, react_1.useState)(() => factory());
    return container;
}
exports.useSprottyContainerFactory = useSprottyContainerFactory;
//# sourceMappingURL=sprotty-diagram.js.map