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
exports.SprottyContextProvider = exports.ReactPortalServiceContext = exports.SprottyContainerContext = exports.SprottyModelContext = exports.SprottyDispatchContext = void 0;
const React = __importStar(require("react"));
/**
 * Context for accessing the Sprotty action dispatcher.
 * Use the `useSprottyDispatch` hook instead of accessing this directly.
 */
exports.SprottyDispatchContext = React.createContext(null);
/**
 * Context for accessing the current Sprotty model root.
 * Use the `useSprottyModel` hook instead of accessing this directly.
 */
exports.SprottyModelContext = React.createContext(null);
/**
 * Context for accessing the Inversify container.
 * Useful for accessing other Sprotty services from React components.
 */
exports.SprottyContainerContext = React.createContext(null);
/**
 * Context for accessing the ReactPortalService.
 * Used internally by the PortalManager.
 */
exports.ReactPortalServiceContext = React.createContext(null);
/**
 * Combined provider component that wraps children with all Sprotty contexts.
 */
const SprottyContextProvider = ({ children, dispatcher, model, container, portalService }) => {
    return (React.createElement(exports.SprottyContainerContext.Provider, { value: container !== null && container !== void 0 ? container : null },
        React.createElement(exports.SprottyDispatchContext.Provider, { value: dispatcher },
            React.createElement(exports.SprottyModelContext.Provider, { value: model },
                React.createElement(exports.ReactPortalServiceContext.Provider, { value: portalService }, children)))));
};
exports.SprottyContextProvider = SprottyContextProvider;
//# sourceMappingURL=contexts.js.map