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
exports.PerformanceMonitorView = exports.LayoutEdgeView = exports.LayoutAwareLabelView = exports.LayoutCompartmentView = exports.HybridLayoutNodeView = exports.ServerLayoutNodeView = exports.ClientLayoutNodeView = void 0;
/** @jsx svg */
const sprotty_1 = require("sprotty");
const inversify_1 = require("inversify");
const sprotty_2 = require("sprotty");
/**
 * Client Layout Node View - Rich content with micro-layout
 */
let ClientLayoutNodeView = class ClientLayoutNodeView {
    render(node, context, args) {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        const { width, height } = node.size;
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-client-layout-node": true, "class-selected": node.selected, "class-mouseover": node.hoverFeedback },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-node-background": true, "class-status-online": node.status === 'online', "class-status-offline": node.status === 'offline', "class-status-warning": node.status === 'warning', "class-status-error": node.status === 'error' }),
            context.targetKind !== 'main' && ((0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-debug-bounds": true })),
            context.renderChildren(node));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
};
exports.ClientLayoutNodeView = ClientLayoutNodeView;
exports.ClientLayoutNodeView = ClientLayoutNodeView = __decorate([
    (0, inversify_1.injectable)()
], ClientLayoutNodeView);
/**
 * Server Layout Node View - Minimal content, positioned by algorithms
 */
let ServerLayoutNodeView = class ServerLayoutNodeView {
    render(node, context, args) {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        const { width, height } = node.size;
        const icon = this.getNodeIcon(node.nodeType);
        const color = this.getNodeColor(node.nodeType);
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-server-layout-node": true, "class-selected": node.selected, "class-mouseover": node.hoverFeedback, "class-node-type": node.nodeType || 'default' },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, fill: color, stroke: "#333", "stroke-width": "2", rx: "4", ry: "4", "class-node-rect": true }),
            icon && ((0, sprotty_1.svg)("text", { x: width / 2, y: height / 2 - 8, "text-anchor": "middle", "class-node-icon": true, "font-size": "20" }, icon)),
            node.label && ((0, sprotty_1.svg)("text", { x: width / 2, y: height / 2 + 12, "text-anchor": "middle", "class-node-label": true, "font-size": "12", fill: "#333" }, node.label)),
            node.category && ((0, sprotty_1.svg)("text", { x: width / 2, y: height - 4, "text-anchor": "middle", "class-node-category": true, "font-size": "10", fill: "#666" }, node.category)));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
    getNodeIcon(nodeType) {
        switch (nodeType) {
            case 'service': return '⚙️';
            case 'database': return '🗄️';
            case 'client': return '💻';
            case 'router': return '🔀';
            case 'gateway': return '🚪';
            default: return '📦';
        }
    }
    getNodeColor(nodeType) {
        switch (nodeType) {
            case 'service': return '#e3f2fd';
            case 'database': return '#f3e5f5';
            case 'client': return '#e8f5e8';
            case 'router': return '#fff3e0';
            case 'gateway': return '#fce4ec';
            default: return '#f5f5f5';
        }
    }
};
exports.ServerLayoutNodeView = ServerLayoutNodeView;
exports.ServerLayoutNodeView = ServerLayoutNodeView = __decorate([
    (0, inversify_1.injectable)()
], ServerLayoutNodeView);
/**
 * Hybrid Layout Node View - Combines both approaches
 */
let HybridLayoutNodeView = class HybridLayoutNodeView {
    render(node, context, args) {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        const { width, height } = node.size;
        const headerHeight = 30;
        const icon = this.getNodeIcon(node.nodeType);
        return (0, sprotty_1.svg)("g", { "class-sprotty-node": true, "class-hybrid-layout-node": true, "class-selected": node.selected, "class-mouseover": node.hoverFeedback, "class-node-type": node.nodeType || 'default' },
            (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-node-container": true }),
            (0, sprotty_1.svg)("g", { "class-node-header": true },
                (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: headerHeight, "class-header-background": true }),
                icon && ((0, sprotty_1.svg)("text", { x: "8", y: "20", "class-header-icon": true, "font-size": "16" }, icon)),
                (0, sprotty_1.svg)("text", { x: icon ? "28" : "8", y: "20", "class-header-title": true, "font-size": "14", fill: "white" }, node.title || 'Hybrid Node')),
            (0, sprotty_1.svg)("g", { "class-node-body": true, transform: `translate(0, ${headerHeight})` },
                (0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height - headerHeight, "class-body-background": true }),
                context.renderChildren(node)));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
    getNodeIcon(nodeType) {
        switch (nodeType) {
            case 'service': return '⚙️';
            case 'component': return '🧩';
            case 'interface': return '🔌';
            default: return '📋';
        }
    }
};
exports.HybridLayoutNodeView = HybridLayoutNodeView;
exports.HybridLayoutNodeView = HybridLayoutNodeView = __decorate([
    (0, inversify_1.injectable)()
], HybridLayoutNodeView);
/**
 * Layout Compartment View - Organizes content within nodes
 */
let LayoutCompartmentView = class LayoutCompartmentView {
    render(compartment, context, args) {
        if (!this.isVisible(compartment, context)) {
            return undefined;
        }
        const { width, height } = compartment.size;
        return (0, sprotty_1.svg)("g", { "class-sprotty-compartment": true, "class-layout-compartment": true, "class-compartment-type": compartment.compartmentType || 'default' },
            context.targetKind !== 'main' && ((0, sprotty_1.svg)("rect", { x: "0", y: "0", width: width, height: height, "class-compartment-debug": true })),
            context.renderChildren(compartment));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
};
exports.LayoutCompartmentView = LayoutCompartmentView;
exports.LayoutCompartmentView = LayoutCompartmentView = __decorate([
    (0, inversify_1.injectable)()
], LayoutCompartmentView);
/**
 * Layout Aware Label View - Adapts to layout context
 */
let LayoutAwareLabelView = class LayoutAwareLabelView {
    render(label, context, args) {
        if (!this.isVisible(label, context) || !label.text) {
            return undefined;
        }
        const fontSize = label.fontSize || this.getDefaultFontSize(label.labelType);
        const fontWeight = label.fontWeight || this.getDefaultFontWeight(label.labelType);
        const color = label.color || this.getDefaultColor(label.labelType);
        const alignment = label.textAlignment || 'left';
        return (0, sprotty_1.svg)("g", { "class-sprotty-label": true, "class-layout-aware-label": true, "class-label-type": label.labelType || 'default' },
            (0, sprotty_1.svg)("text", { "class-label-text": true, "font-size": fontSize, "font-weight": fontWeight, fill: color, "text-anchor": alignment === 'center' ? 'middle' : alignment === 'right' ? 'end' : 'start' }, label.text));
    }
    isVisible(element, context) {
        return context.targetKind !== 'hidden';
    }
    getDefaultFontSize(labelType) {
        switch (labelType) {
            case 'title': return 16;
            case 'subtitle': return 14;
            case 'property': return 12;
            case 'value': return 12;
            case 'caption': return 10;
            default: return 12;
        }
    }
    getDefaultFontWeight(labelType) {
        switch (labelType) {
            case 'title': return 'bold';
            case 'subtitle': return 'normal';
            case 'property': return 'bold';
            case 'value': return 'normal';
            case 'caption': return 'light';
            default: return 'normal';
        }
    }
    getDefaultColor(labelType) {
        switch (labelType) {
            case 'title': return '#1976d2';
            case 'subtitle': return '#424242';
            case 'property': return '#666';
            case 'value': return '#333';
            case 'caption': return '#999';
            default: return '#333';
        }
    }
};
exports.LayoutAwareLabelView = LayoutAwareLabelView;
exports.LayoutAwareLabelView = LayoutAwareLabelView = __decorate([
    (0, inversify_1.injectable)()
], LayoutAwareLabelView);
/**
 * Layout Edge View - Works with all layout strategies
 */
let LayoutEdgeView = class LayoutEdgeView extends sprotty_2.PolylineEdgeView {
    render(edge, context, args) {
        const router = this.edgeRouterRegistry.get(edge.routerKind);
        const route = router.route(edge);
        if (route.length === 0) {
            return this.renderDanglingEdge('Cannot compute route', edge, context);
        }
        const color = edge.color || this.getEdgeColor(edge.edgeType);
        const thickness = edge.thickness || 2;
        const strokeDashArray = this.getStrokeDashArray(edge.style);
        return (0, sprotty_1.svg)("g", { "class-sprotty-edge": true, "class-layout-edge": true, "class-selected": edge.selected, "class-mouseover": edge.hoverFeedback, "class-edge-type": edge.edgeType || 'default' },
            (0, sprotty_1.svg)("path", { d: this.createPathForRoute(route), fill: "none", stroke: color, "stroke-width": thickness, "stroke-dasharray": strokeDashArray, "class-edge-path": true }),
            this.renderArrowHead(route, color));
    }
    getEdgeColor(edgeType) {
        switch (edgeType) {
            case 'dependency': return '#1976d2';
            case 'communication': return '#388e3c';
            case 'inheritance': return '#7b1fa2';
            case 'association': return '#f57c00';
            default: return '#666';
        }
    }
    getStrokeDashArray(style) {
        switch (style) {
            case 'dashed': return '8,4';
            case 'dotted': return '2,3';
            case 'solid':
            default: return 'none';
        }
    }
    createPathForRoute(route) {
        if (route.length === 0)
            return '';
        let path = `M ${route[0].x} ${route[0].y}`;
        for (let i = 1; i < route.length; i++) {
            path += ` L ${route[i].x} ${route[i].y}`;
        }
        return path;
    }
    renderArrowHead(route, color) {
        if (route.length < 2)
            return undefined;
        const lastPoint = route[route.length - 1];
        const secondLastPoint = route[route.length - 2];
        const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
        const arrowLength = 8;
        const x1 = lastPoint.x - arrowLength * Math.cos(angle - Math.PI / 6);
        const y1 = lastPoint.y - arrowLength * Math.sin(angle - Math.PI / 6);
        const x2 = lastPoint.x - arrowLength * Math.cos(angle + Math.PI / 6);
        const y2 = lastPoint.y - arrowLength * Math.sin(angle + Math.PI / 6);
        return (0, sprotty_1.svg)("path", { d: `M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`, fill: color, "class-arrow-head": true });
    }
};
exports.LayoutEdgeView = LayoutEdgeView;
exports.LayoutEdgeView = LayoutEdgeView = __decorate([
    (0, inversify_1.injectable)()
], LayoutEdgeView);
/**
 * Performance Monitor View - Shows layout performance metrics
 */
let PerformanceMonitorView = class PerformanceMonitorView {
    render(monitor, context, args) {
        var _a;
        return (0, sprotty_1.svg)("g", { "class-performance-monitor": true },
            (0, sprotty_1.svg)("rect", { x: "10", y: "10", width: "200", height: "80", fill: "rgba(0,0,0,0.8)", rx: "4", ry: "4" }),
            (0, sprotty_1.svg)("text", { x: "20", y: "30", fill: "white", "font-size": "12", "font-weight": "bold" }, "Layout Performance"),
            (0, sprotty_1.svg)("text", { x: "20", y: "45", fill: "white", "font-size": "10" },
                "Strategy: ",
                monitor.layoutStrategy),
            (0, sprotty_1.svg)("text", { x: "20", y: "60", fill: "white", "font-size": "10" },
                "Total Time: ",
                ((_a = monitor.totalLayoutTime) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 0,
                "ms"),
            (0, sprotty_1.svg)("text", { x: "20", y: "75", fill: "white", "font-size": "10" },
                "Nodes: ",
                monitor.nodeCount,
                " | Edges: ",
                monitor.edgeCount));
    }
};
exports.PerformanceMonitorView = PerformanceMonitorView;
exports.PerformanceMonitorView = PerformanceMonitorView = __decorate([
    (0, inversify_1.injectable)()
], PerformanceMonitorView);
//# sourceMappingURL=views.js.map