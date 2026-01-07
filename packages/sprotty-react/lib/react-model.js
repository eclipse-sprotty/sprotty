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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SReactPort = exports.SReactContainerNode = exports.SReactNode = exports.reactNodeFeatures = void 0;
const sprotty_1 = require("sprotty");
/**
 * Default features for React nodes.
 * Includes bounds, layout, fade, hover, popup, select, and move features.
 */
exports.reactNodeFeatures = [
    sprotty_1.boundsFeature,
    sprotty_1.layoutContainerFeature,
    sprotty_1.fadeFeature,
    sprotty_1.hoverFeedbackFeature,
    sprotty_1.popupFeature,
    sprotty_1.selectFeature,
    sprotty_1.moveFeature
];
/**
 * Base model class for React-rendered diagram nodes.
 *
 * SReactNode extends RectangularNode with additional properties
 * commonly needed for React component rendering.
 *
 * @example
 * ```typescript
 * // In your model definition
 * interface TaskNode extends SReactNode {
 *     title: string;
 *     status: 'pending' | 'in-progress' | 'done';
 *     assignee?: string;
 * }
 *
 * // In your React component
 * const TaskNodeComponent: React.FC<{ model: TaskNode }> = ({ model }) => {
 *     return (
 *         <div className={`task-node ${model.status}`}>
 *             <h3>{model.title}</h3>
 *             {model.assignee && <span>Assigned to: {model.assignee}</span>}
 *         </div>
 *     );
 * };
 * ```
 */
class SReactNode extends sprotty_1.RectangularNode {
    hasFeature(feature) {
        return exports.reactNodeFeatures.includes(feature);
    }
}
exports.SReactNode = SReactNode;
/**
 * Override to enable custom features.
 */
SReactNode.DEFAULT_FEATURES = exports.reactNodeFeatures;
/**
 * A React node that can contain child elements.
 * Useful for nodes that need to render child nodes or edges.
 */
class SReactContainerNode extends SReactNode {
}
exports.SReactContainerNode = SReactContainerNode;
/**
 * A React node specifically for port elements.
 */
class SReactPort extends sprotty_1.SNodeImpl {
}
exports.SReactPort = SReactPort;
//# sourceMappingURL=react-model.js.map