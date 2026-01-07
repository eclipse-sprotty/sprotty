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
exports.PortalManager = void 0;
const React = __importStar(require("react"));
const ReactDOM = __importStar(require("react-dom"));
const hooks_1 = require("./hooks");
const event_trap_1 = require("./event-trap");
/**
 * Component that renders a single React Portal.
 */
const PortalRenderer = React.memo(({ entry, useEventTrap }) => {
    const { domNode, model, componentType: Component } = entry;
    const content = React.createElement(Component, { model: model });
    // Wrap in EventTrap if enabled
    const wrappedContent = useEventTrap ? (React.createElement(event_trap_1.EventTrap, null, content)) : (content);
    // Use React Portal to render into the foreignObject's div
    return ReactDOM.createPortal(wrappedContent, domNode);
});
PortalRenderer.displayName = 'PortalRenderer';
/**
 * Component that manages and renders all React Portals for diagram nodes.
 *
 * The PortalManager subscribes to the ReactPortalService and renders a
 * React Portal for each registered entry. This enables React components
 * to be rendered within Sprotty's SVG diagram while maintaining their
 * position in the React component tree (and thus Context access).
 *
 * Key features:
 * - Subscribes to ReactPortalService for portal registry changes
 * - Creates React Portals targeting foreignObject DOM nodes
 * - Optionally wraps components in EventTrap to prevent Sprotty conflicts
 * - Uses React.memo for performance optimization
 *
 * @example
 * ```tsx
 * // Inside SprottyDiagram
 * <PortalManager portalService={portalService} />
 * ```
 */
const PortalManager = ({ portalService, useEventTrap = true }) => {
    const portals = (0, hooks_1.usePortalRegistry)(portalService);
    return (React.createElement(React.Fragment, null, Array.from(portals.values()).map((entry) => (React.createElement(PortalRenderer, { key: entry.id, entry: entry, useEventTrap: useEventTrap })))));
};
exports.PortalManager = PortalManager;
exports.PortalManager.displayName = 'PortalManager';
//# sourceMappingURL=portal-manager.js.map