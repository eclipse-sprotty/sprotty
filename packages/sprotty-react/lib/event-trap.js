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
exports.withEventTrap = exports.EventTrap = void 0;
const React = __importStar(require("react"));
/**
 * Check if the event target is an interactive form element.
 */
function isInteractiveElement(target) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    const tagName = target.tagName.toUpperCase();
    return (tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        tagName === 'BUTTON' ||
        target.isContentEditable);
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
const EventTrap = ({ children, trapMouse = true, trapKeyboard = false, trapWheel = false, className, style }) => {
    const handleMouseEvent = React.useCallback((event) => {
        if (trapMouse) {
            // Always stop propagation for interactive elements
            if (isInteractiveElement(event.target)) {
                event.stopPropagation();
            }
            else {
                // For other elements, still stop propagation to prevent
                // unintended Sprotty interactions
                event.stopPropagation();
            }
        }
    }, [trapMouse]);
    const handleKeyboardEvent = React.useCallback((event) => {
        if (trapKeyboard) {
            event.stopPropagation();
        }
    }, [trapKeyboard]);
    const handleWheelEvent = React.useCallback((event) => {
        if (trapWheel) {
            event.stopPropagation();
        }
    }, [trapWheel]);
    // Handle drag events to prevent Sprotty from initiating drag operations
    const handleDragEvent = React.useCallback((event) => {
        if (trapMouse) {
            event.stopPropagation();
        }
    }, [trapMouse]);
    return (React.createElement("div", { className: `sprotty-react-event-trap ${className || ''}`, style: Object.assign({ width: '100%', height: '100%' }, style), onMouseDown: handleMouseEvent, onMouseUp: handleMouseEvent, onClick: handleMouseEvent, onDoubleClick: handleMouseEvent, onContextMenu: handleMouseEvent, onMouseMove: handleMouseEvent, onKeyDown: handleKeyboardEvent, onKeyUp: handleKeyboardEvent, onWheel: handleWheelEvent, onDragStart: handleDragEvent, onDrag: handleDragEvent, onDragEnd: handleDragEvent }, children));
};
exports.EventTrap = EventTrap;
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
function withEventTrap(Component, trapOptions) {
    const WrappedComponent = (props) => (React.createElement(exports.EventTrap, Object.assign({}, trapOptions),
        React.createElement(Component, Object.assign({}, props))));
    WrappedComponent.displayName = `WithEventTrap(${Component.displayName || Component.name || 'Component'})`;
    return WrappedComponent;
}
exports.withEventTrap = withEventTrap;
//# sourceMappingURL=event-trap.js.map