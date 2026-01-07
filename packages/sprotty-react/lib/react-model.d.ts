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
import type { ComponentType } from 'react';
import { SNodeImpl, RectangularNode } from 'sprotty';
/**
 * Default features for React nodes.
 * Includes bounds, layout, fade, hover, popup, select, and move features.
 */
export declare const reactNodeFeatures: symbol[];
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
export declare class SReactNode extends RectangularNode {
    /**
     * Additional CSS classes to apply to the node container.
     */
    cssClasses?: string[];
    /**
     * Arbitrary data that can be passed to the React component.
     * Use this for custom properties not defined on the model.
     */
    data?: Record<string, unknown>;
    /**
     * Override to enable custom features.
     */
    static readonly DEFAULT_FEATURES: symbol[];
    hasFeature(feature: symbol): boolean;
}
/**
 * A React node that can contain child elements.
 * Useful for nodes that need to render child nodes or edges.
 */
export declare class SReactContainerNode extends SReactNode {
    /**
     * Whether to render children within the React component.
     * If false, children are rendered by Sprotty in the standard way.
     */
    renderChildrenInReact?: boolean;
}
/**
 * A React node specifically for port elements.
 */
export declare class SReactPort extends SNodeImpl {
    /**
     * Additional CSS classes for the port.
     */
    cssClasses?: string[];
    /**
     * Custom data for the React component.
     */
    data?: Record<string, unknown>;
}
/**
 * Helper type for extracting the model type from a React component's props.
 */
export type ExtractModelType<T> = T extends ComponentType<{
    model: infer M;
}> ? M : never;
/**
 * Type for a React node component.
 */
export type ReactNodeComponent<M extends SNodeImpl = SReactNode> = ComponentType<{
    model: M;
}>;
//# sourceMappingURL=react-model.d.ts.map