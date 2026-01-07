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
/**
 * Props for the EventTrap component.
 */
export interface EventTrapProps {
    children: React.ReactNode;
    /**
     * Whether to trap mouse events (default: true).
     * When true, mousedown, click, dblclick, and contextmenu events
     * will not propagate to Sprotty.
     */
    trapMouse?: boolean;
    /**
     * Whether to trap keyboard events (default: false).
     * When true, keydown and keyup events will not propagate.
     */
    trapKeyboard?: boolean;
    /**
     * Whether to trap wheel events (default: false).
     * When true, wheel events will not trigger Sprotty zoom.
     */
    trapWheel?: boolean;
    /**
     * Custom class name for the wrapper div.
     */
    className?: string;
    /**
     * Custom style for the wrapper div.
     */
    style?: React.CSSProperties;
}
/**
 * Wrapper component that traps events to prevent them from bubbling up to Sprotty.
 *
 * When React components are rendered inside Sprotty diagram nodes (via foreignObject),
 * DOM events bubble up to the SVG container where Sprotty's event handlers listen.
 * This can cause conflicts - for example, clicking a button might also trigger
 * Sprotty's node selection behavior.
 *
 * EventTrap prevents this by stopping propagation of specified events at the
 * React component boundary.
 *
 * @example
 * ```tsx
 * const MyNode = ({ model }) => {
 *     return (
 *         <EventTrap>
 *             <button onClick={() => console.log('Clicked!')}>
 *                 Click me without selecting the node
 *             </button>
 *         </EventTrap>
 *     );
 * };
 * ```
 *
 * By default, EventTrap traps mouse events but not keyboard or wheel events.
 * You can customize this behavior with props:
 *
 * @example
 * ```tsx
 * // Trap all events including keyboard and wheel
 * <EventTrap trapMouse trapKeyboard trapWheel>
 *     <input type="text" />
 * </EventTrap>
 * ```
 */
export declare const EventTrap: React.FC<EventTrapProps>;
/**
 * Higher-order component that wraps a component with EventTrap.
 *
 * @example
 * ```tsx
 * const MyButton = ({ onClick }) => (
 *     <button onClick={onClick}>Click me</button>
 * );
 *
 * const TrappedButton = withEventTrap(MyButton);
 * ```
 */
export declare function withEventTrap<P extends object>(Component: React.ComponentType<P>, trapOptions?: Omit<EventTrapProps, 'children'>): React.FC<P>;
//# sourceMappingURL=event-trap.d.ts.map