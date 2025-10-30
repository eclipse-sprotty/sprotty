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

/** @jsx svg */
import { svg } from 'sprotty';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { IView, RenderingContext, IViewArgs, PolylineEdgeView, ShapeView } from 'sprotty';
import {
    ServerLayoutNode,
    LayoutEdge
} from './model';

/**
 * Client Layout Node View - Rich content with micro-layout
 */
@injectable()
export class ClientLayoutNodeView extends ShapeView {
    render(node: any, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <rect
                class-sprotty-node={true}
                class-client-layout-node={true}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
                rx="6"
                ry="6"
            />
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * Server Layout Node View - Minimal content, positioned by algorithms
 */
@injectable()
export class ServerLayoutNodeView implements IView {
    render(node: Readonly<ServerLayoutNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.size;
        const icon = this.getNodeIcon(node.nodeType);
        const color = this.getNodeColor(node.nodeType);

        return <g
            class-sprotty-node={true}
            class-server-layout-node={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}
            class-node-type={node.nodeType || 'default'}>

            {/* Simple styled rectangle */}
            <rect
                x="0" y="0"
                width={width} height={height}
                fill={color}
                stroke="#333"
                stroke-width="2"
                rx="4" ry="4"
                class-node-rect={true} />

            {/* Icon */}
            {icon && (
                <text
                    x={width / 2} y={height / 2 - 8}
                    text-anchor="middle"
                    class-node-icon={true}
                    font-size="20">
                    {icon}
                </text>
            )}

            {/* Label */}
            {node.label && (
                <text
                    x={width / 2} y={height / 2 + 12}
                    text-anchor="middle"
                    class-node-label={true}
                    font-size="12"
                    fill="#333">
                    {node.label}
                </text>
            )}

            {/* Category */}
            {node.category && (
                <text
                    x={width / 2} y={height - 4}
                    text-anchor="middle"
                    class-node-category={true}
                    font-size="10"
                    fill="#666">
                    {node.category}
                </text>
            )}
        </g>;
    }

    protected isVisible(element: ServerLayoutNode, context: RenderingContext): boolean {
        return context.targetKind !== 'hidden';
    }

    protected getNodeIcon(nodeType?: string): string {
        switch (nodeType) {
            case 'service': return '⚙️';
            case 'database': return '🗄️';
            case 'client': return '💻';
            case 'router': return '🔀';
            case 'gateway': return '🚪';
            default: return '📦';
        }
    }

    protected getNodeColor(nodeType?: string): string {
        switch (nodeType) {
            case 'service': return '#e3f2fd';
            case 'database': return '#f3e5f5';
            case 'client': return '#e8f5e8';
            case 'router': return '#fff3e0';
            case 'gateway': return '#fce4ec';
            default: return '#f5f5f5';
        }
    }
}

/**
 * Hybrid Layout Node View - Simple container, client layout handles content
 *
 * This view is intentionally the same as ClientLayoutNodeView to demonstrate that
 * hybrid layout uses the same client layout capabilities for internal content.
 * The difference is that ELK positions the nodes, while client layout arranges
 * the content inside each node.
 */
@injectable()
export class HybridLayoutNodeView extends ShapeView {
    render(node: any, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        // Simple container - client layout handles all internal structure
        return <g>
            <rect
                class-sprotty-node={true}
                class-hybrid-layout-node={true}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
                rx="6"
                ry="6"
            />
            {/* Client layout manages all child elements (same as client-only strategy) */}
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * Layout Edge View - Works with all layout strategies
 */
@injectable()
export class LayoutEdgeView extends PolylineEdgeView {
    override render(edge: Readonly<LayoutEdge>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        const router = this.edgeRouterRegistry.get(edge.routerKind);
        const route = router.route(edge);
        if (route.length === 0) {
            return this.renderDanglingEdge('Cannot compute route', edge, context);
        }

        const color = edge.color || this.getEdgeColor(edge.edgeType);
        const thickness = edge.thickness || 2;
        const strokeDashArray = this.getStrokeDashArray(edge.style);

        return <g
            class-sprotty-edge={true}
            class-layout-edge={true}
            class-selected={edge.selected}
            class-mouseover={edge.hoverFeedback}
            class-edge-type={edge.edgeType || 'default'}>

            <path
                d={this.createPathForRoute(route)}
                fill="none"
                stroke={color}
                stroke-width={thickness}
                stroke-dasharray={strokeDashArray}
                class-edge-path={true} />

            {/* Arrow marker */}
            {this.renderArrowHead(route, color)}
        </g>;
    }

    protected getEdgeColor(edgeType?: string): string {
        switch (edgeType) {
            case 'dependency': return '#1976d2';
            case 'communication': return '#388e3c';
            case 'inheritance': return '#7b1fa2';
            case 'association': return '#f57c00';
            default: return '#666';
        }
    }

    protected getStrokeDashArray(style?: string): string {
        switch (style) {
            case 'dashed': return '8,4';
            case 'dotted': return '2,3';
            case 'solid':
            default: return 'none';
        }
    }

    protected createPathForRoute(route: any[]): string {
        if (route.length === 0) return '';

        let path = `M ${route[0].x} ${route[0].y}`;
        for (let i = 1; i < route.length; i++) {
            path += ` L ${route[i].x} ${route[i].y}`;
        }
        return path;
    }

    protected renderArrowHead(route: any[], color: string): VNode | undefined {
        if (route.length < 2) return undefined;

        const lastPoint = route[route.length - 1];
        const secondLastPoint = route[route.length - 2];

        const angle = Math.atan2(
            lastPoint.y - secondLastPoint.y,
            lastPoint.x - secondLastPoint.x
        );

        const arrowLength = 8;

        const x1 = lastPoint.x - arrowLength * Math.cos(angle - Math.PI / 6);
        const y1 = lastPoint.y - arrowLength * Math.sin(angle - Math.PI / 6);
        const x2 = lastPoint.x - arrowLength * Math.cos(angle + Math.PI / 6);
        const y2 = lastPoint.y - arrowLength * Math.sin(angle + Math.PI / 6);

        return <path
            d={`M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`}
            fill={color}
            class-arrow-head={true} />;
    }
}

