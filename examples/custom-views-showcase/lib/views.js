"use strict";
/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLabelView = exports.StyledEdgeView = exports.StatefulNodeView = exports.ComplexNodeView = exports.EnhancedNodeView = exports.BasicShapeView = void 0;
/** @jsx svg */
const sprotty_1 = require("sprotty");
const inversify_1 = require("inversify");
const sprotty_2 = require("sprotty");
/**
 * Basic Shape View - demonstrates simple custom view creation
 */
let BasicShapeView = class BasicShapeView {
    render(node, context, args) {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        const { width, height } = node.size;
        const centerX = width / 2;
        const centerY = height / 2;
        let shape;
        switch (node.shape) {
            case 'circle':
                const radius = Math.min(centerX, centerY);
                shape = (0, sprotty_1.svg)("circle", { cx: centerX, cy: centerY, r: radius, "class-basic-shape": true, "class-shape-circle": true, fill: node.color || '#e1f5fe', stroke: "#01579b", "stroke-width": "2" });
                break;
            case 'triangle':
                const points = `${centerX},5 ${width - 5},${height - 5} 5,${height - 5}`;
                shape = (0, sprotty_1.svg)("polygon", { points: points, "class-basic-shape": true, "class-shape-triangle": true, fill: node.color || '#f3e5f5', stroke: "#4a148c", "stroke-width": "2" });
                break;
            case 'diamond':
                const path = `M ${centerX} 5 L ${width - 5} ${centerY} L ${centerX} ${height - 5} L 5 ${centerY} Z`;
                shape = (0, sprotty_1.svg)("path", { d: path, "class-basic-shape": true, "class-shape-diamond": true, fill: node.color || '#e8f5e8', stroke: "#1b5e20", "stroke-width": "2" });
                break;
            default:
                shape = (0, sprotty_1.svg)("rect", { width: width, height: height, fill: "#ccc" });
        }
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-basic-shape-node": true, "class-selected": node.selected, "class-mouseover": node.hoverFeedback },
            shape,
            context.renderChildren(node));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
};
exports.BasicShapeView = BasicShapeView;
exports.BasicShapeView = BasicShapeView = __decorate([
    (0, inversify_1.injectable)()
], BasicShapeView);
/**
 * Enhanced View - demonstrates extending base views with decorations
 */
let EnhancedNodeView = class EnhancedNodeView extends sprotty_2.RectangularNodeView {
    render(node, context, args) {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        const { width, height } = node.size;
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-enhanced-node": true, "class-status-normal": node.status === 'normal', "class-status-warning": node.status === 'warning', "class-status-error": node.status === 'error', "class-status-success": node.status === 'success', "class-selected": node.selected, "class-mouseover": node.hoverFeedback },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: Math.max(width, 0), height: Math.max(height, 0), rx: node.cornerRadius, ry: node.cornerRadius, "class-enhanced-rect": true }),
            this.renderStatusIndicator(node),
            node.showBorder && this.renderBorder(node),
            context.renderChildren(node));
    }
    renderStatusIndicator(node) {
        if (node.status === 'normal')
            return undefined;
        const size = 8;
        return (0, sprotty_1.svg)("circle", { cx: node.size.width - size - 2, cy: size + 2, r: size, "class-status-indicator": true, "class-indicator-warning": node.status === 'warning', "class-indicator-error": node.status === 'error', "class-indicator-success": node.status === 'success' });
    }
    renderBorder(node) {
        const { width, height } = node.size;
        return (0, sprotty_1.svg)("rect", { x: "-2", y: "-2", width: width + 4, height: height + 4, rx: node.cornerRadius + 2, ry: node.cornerRadius + 2, "class-enhanced-border": true, fill: "none", "stroke-width": "2" });
    }
};
exports.EnhancedNodeView = EnhancedNodeView;
exports.EnhancedNodeView = EnhancedNodeView = __decorate([
    (0, inversify_1.injectable)()
], EnhancedNodeView);
/**
 * Complex View - demonstrates compositional view patterns
 */
let ComplexNodeView = class ComplexNodeView {
    render(node, context, args) {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-complex-node": true, "class-selected": node.selected, "class-mouseover": node.hoverFeedback },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: Math.max(node.size.width, 0), height: Math.max(node.size.height, 0), "class-complex-container": true }),
            node.showHeader && this.renderHeader(node),
            this.renderBody(node, context),
            node.showFooter && this.renderFooter(node));
    }
    renderHeader(node) {
        const headerHeight = 30;
        return (0, sprotty_1.svg)("g", { "class-complex-header": true },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: node.size.width, height: headerHeight, fill: node.headerColor || '#1976d2', "class-header-rect": true }),
            node.icon && ((0, sprotty_1.svg)("text", { x: "8", y: "20", "class-header-icon": true, fill: "white" }, node.icon)),
            (0, sprotty_1.svg)("text", { x: node.icon ? "28" : "8", y: "20", "class-header-title": true, fill: "white" }, node.title),
            node.subtitle && ((0, sprotty_1.svg)("text", { x: node.icon ? "28" : "8", y: "15", "class-header-subtitle": true, fill: "rgba(255,255,255,0.8)", "font-size": "10" }, node.subtitle)));
    }
    renderBody(node, context) {
        const headerHeight = node.showHeader ? 30 : 0;
        const footerHeight = node.showFooter ? 20 : 0;
        const bodyHeight = node.size.height - headerHeight - footerHeight;
        return (0, sprotty_1.svg)("g", { "class-complex-body": true, transform: `translate(0, ${headerHeight})` },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: node.size.width, height: bodyHeight, "class-body-rect": true }),
            context.renderChildren(node));
    }
    renderFooter(node) {
        const footerY = node.size.height - 20;
        return (0, sprotty_1.svg)("g", { "class-complex-footer": true },
            (0, sprotty_1.svg)("line", { x1: "0", y1: footerY, x2: node.size.width, y2: footerY, "class-footer-line": true }));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
};
exports.ComplexNodeView = ComplexNodeView;
exports.ComplexNodeView = ComplexNodeView = __decorate([
    (0, inversify_1.injectable)()
], ComplexNodeView);
/**
 * Stateful View - demonstrates conditional rendering based on state
 */
let StatefulNodeView = class StatefulNodeView {
    render(node, context, args) {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        switch (node.state) {
            case 'loading':
                return this.renderLoadingState(node, context);
            case 'error':
                return this.renderErrorState(node, context);
            case 'success':
                return this.renderSuccessState(node, context);
            default:
                return this.renderIdleState(node, context);
        }
    }
    renderLoadingState(node, context) {
        const { width, height } = node.size;
        const progress = node.progress || 0;
        const progressWidth = (width - 20) * (progress / 100);
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-stateful-node": true, "class-state-loading": true },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-loading-background": true }),
            (0, sprotty_1.svg)("rect", { x: "10", y: height - 15, width: width - 20, height: "5", "class-progress-background": true }),
            (0, sprotty_1.svg)("rect", { x: "10", y: height - 15, width: progressWidth, height: "5", "class-progress-fill": true }),
            (0, sprotty_1.svg)("text", { x: width / 2, y: height / 2, "text-anchor": "middle", "class-loading-text": true }, node.message || `Loading... ${progress}%`),
            context.renderChildren(node));
    }
    renderErrorState(node, context) {
        const { width, height } = node.size;
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-stateful-node": true, "class-state-error": true },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-error-background": true }),
            (0, sprotty_1.svg)("text", { x: "10", y: "20", "class-error-icon": true }, "\u26A0"),
            (0, sprotty_1.svg)("text", { x: "30", y: "20", "class-error-text": true }, node.message || 'Error occurred'),
            context.renderChildren(node));
    }
    renderSuccessState(node, context) {
        const { width, height } = node.size;
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-stateful-node": true, "class-state-success": true },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-success-background": true }),
            (0, sprotty_1.svg)("text", { x: "10", y: "20", "class-success-icon": true }, "\u2713"),
            (0, sprotty_1.svg)("text", { x: "30", y: "20", "class-success-text": true }, node.message || 'Success!'),
            context.renderChildren(node));
    }
    renderIdleState(node, context) {
        const { width, height } = node.size;
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-stateful-node": true, "class-state-idle": true },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-idle-background": true }),
            (0, sprotty_1.svg)("text", { x: width / 2, y: height / 2, "text-anchor": "middle", "class-idle-text": true }, node.message || 'Ready'),
            context.renderChildren(node));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
};
exports.StatefulNodeView = StatefulNodeView;
exports.StatefulNodeView = StatefulNodeView = __decorate([
    (0, inversify_1.injectable)()
], StatefulNodeView);
/**
 * Styled Edge View - demonstrates custom edge rendering
 */
let StyledEdgeView = class StyledEdgeView extends sprotty_2.PolylineEdgeView {
    renderLine(edge, segments, context) {
        return (0, sprotty_1.svg)("path", { "class-sprotty-edge": true, "class-styled-edge": true, "class-edge-solid": edge.style === 'solid', "class-edge-dashed": edge.style === 'dashed', "class-edge-dotted": edge.style === 'dotted', "class-edge-animated": edge.animated, d: this.createPath(segments), fill: "none", stroke: edge.color || '#666', "stroke-width": edge.thickness, "stroke-dasharray": this.getStrokeDashArray(edge) }, edge.animated && ((0, sprotty_1.svg)("animate", { attributeName: "stroke-dashoffset", values: "0;20", dur: "1s", repeatCount: "indefinite" })));
    }
    createPath(segments) {
        if (segments.length === 0)
            return '';
        let path = `M ${segments[0].x} ${segments[0].y}`;
        for (let i = 1; i < segments.length; i++) {
            path += ` L ${segments[i].x} ${segments[i].y}`;
        }
        return path;
    }
    getStrokeDashArray(edge) {
        switch (edge.style) {
            case 'dashed': return '10,5';
            case 'dotted': return '2,3';
            default: return 'none';
        }
    }
};
exports.StyledEdgeView = StyledEdgeView;
exports.StyledEdgeView = StyledEdgeView = __decorate([
    (0, inversify_1.injectable)()
], StyledEdgeView);
/**
 * Custom Label View - demonstrates label customization
 */
let CustomLabelView = class CustomLabelView {
    render(label, context, args) {
        if (!this.isVisible(label, context) || !label.text) {
            return undefined;
        }
        return (0, sprotty_1.svg)("g", { "class-sprotty-label": true, "class-custom-label": true },
            label.backgroundColor && ((0, sprotty_1.svg)("rect", { x: "-4", y: "-14", width: label.text.length * 6 + 8, height: "18", fill: label.backgroundColor, stroke: label.borderColor, "stroke-width": label.borderColor ? "1" : "0", rx: "3", ry: "3", "class-label-background": true })),
            (0, sprotty_1.svg)("text", { "class-label-text": true, "font-size": label.fontSize, "text-anchor": "middle" }, label.text));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
};
exports.CustomLabelView = CustomLabelView;
exports.CustomLabelView = CustomLabelView = __decorate([
    (0, inversify_1.injectable)()
], CustomLabelView);
//# sourceMappingURL=views.js.map