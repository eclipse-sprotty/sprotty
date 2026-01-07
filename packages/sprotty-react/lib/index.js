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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactModule = void 0;
// Types
__exportStar(require("./types"), exports);
// Services
__exportStar(require("./react-portal-service"), exports);
__exportStar(require("./react-bounds-updater"), exports);
// Views
__exportStar(require("./react-host-view"), exports);
// React Components
__exportStar(require("./sprotty-diagram"), exports);
__exportStar(require("./portal-manager"), exports);
__exportStar(require("./event-trap"), exports);
// Contexts and Hooks
__exportStar(require("./contexts"), exports);
__exportStar(require("./hooks"), exports);
// Configuration helpers
__exportStar(require("./configure-react-node"), exports);
__exportStar(require("./react-model"), exports);
// DI Module
const di_config_1 = __importDefault(require("./di.config"));
exports.reactModule = di_config_1.default;
//# sourceMappingURL=index.js.map