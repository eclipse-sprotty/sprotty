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

/** @jsx svg */
import { svg } from 'sprotty/lib/lib/jsx';

import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { Point } from 'sprotty-protocol/lib/utils/geometry';
import {
    IView,
    RenderingContext,
    SEdgeImpl,
    SNodeImpl,
    SLabelImpl,
    PolylineEdgeView,
    BezierCurveEdgeView,
    RectangularNodeView,
    CircularNodeView,
    IViewArgs
} from 'sprotty';
import { CustomEdge, ArrowType, EdgeType } from './model';

/**
 * Custom edge view with support for various arrow types and decorations
 */
@injectable()
export class CustomEdgeView extends PolylineEdgeView {
    override render(edge: Readonly<SEdgeImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        const route = this.edgeRouterRegistry.route(edge, args);
        if (route.length === 0) {
            return this.renderDanglingEdge('Cannot compute route', edge, context);
        }

        const customEdge = edge as any as CustomEdge;
        const edgeType = customEdge.edgeType || 'normal';
        const arrowType = customEdge.arrowType || 'standard';

        return <g class-sprotty-edge={true}
            class-custom-edge={true}
            class-edge-type-normal={edgeType === 'normal'}
            class-edge-type-dependency={edgeType === 'dependency'}
            class-edge-type-composition={edgeType === 'composition'}
            class-edge-type-aggregation={edgeType === 'aggregation'}
            class-edge-type-inheritance={edgeType === 'inheritance'}
            class-edge-type-association={edgeType === 'association'}
            class-edge-selected={edge.selected}
            class-edge-hover={edge.hoverFeedback}>
            {this.renderLine(edge, route, context, args)}
            {this.renderArrow(route, arrowType, edge)}
            {context.renderChildren(edge, { route })}
        </g>;
    }

    protected override renderLine(edge: SEdgeImpl, segments: Point[], context: RenderingContext, args?: IViewArgs): VNode {
        const pathData = this.createPathData(segments);
        const customEdge = edge as any as CustomEdge;
        const strokeStyle = customEdge.strokeStyle || 'solid';
        const color = customEdge.customColor || this.getColorForType(customEdge.edgeType || 'normal');

        return <path
            d={pathData}
            class-edge-path={true}
            class-stroke-solid={strokeStyle === 'solid'}
            class-stroke-dashed={strokeStyle === 'dashed'}
            class-stroke-dotted={strokeStyle === 'dotted'}
            stroke={color}
            fill="none" />;
    }

    /**
     * Render arrow based on type
     */
    protected renderArrow(route: Point[], arrowType: ArrowType, edge: SEdgeImpl): VNode | undefined {
        if (arrowType === 'none' || route.length < 2) {
            return undefined;
        }

        switch (arrowType) {
            case 'standard':
                return this.renderStandardArrow(route, edge);
            case 'hollow':
                return this.renderHollowArrow(route, edge);
            case 'diamond':
                return this.renderDiamondArrow(route, edge);
            case 'hollow-diamond':
                return this.renderHollowDiamondArrow(route, edge);
            case 'circle':
                return this.renderCircleArrow(route, edge);
            default:
                return this.renderStandardArrow(route, edge);
        }
    }

    /**
     * Standard filled arrow
     */
    protected renderStandardArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;

        const x1 = lastPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = lastPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = lastPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = lastPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        return <path
            class-arrow-head={true}
            class-arrow-standard={true}
            d={`M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`}
            fill={this.getArrowColor(edge)} />;
    }

    /**
     * Hollow arrow
     */
    protected renderHollowArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;

        const x1 = lastPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = lastPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = lastPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = lastPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        return <path
            class-arrow-head={true}
            class-arrow-hollow={true}
            d={`M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`}
            fill="white"
            stroke={this.getArrowColor(edge)}
            stroke-width="2" />;
    }

    /**
     * Filled diamond arrow
     */
    protected renderDiamondArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const size = 6;
        const length = 10;

        const p1 = { x: lastPoint.x, y: lastPoint.y };
        const p2 = {
            x: lastPoint.x - length * Math.cos(angle) + size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) - size * Math.cos(angle)
        };
        const p3 = {
            x: lastPoint.x - length * 2 * Math.cos(angle),
            y: lastPoint.y - length * 2 * Math.sin(angle)
        };
        const p4 = {
            x: lastPoint.x - length * Math.cos(angle) - size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) + size * Math.cos(angle)
        };

        return <path
            class-arrow-head={true}
            class-arrow-diamond={true}
            d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
            fill={this.getArrowColor(edge)} />;
    }

    /**
     * Hollow diamond arrow
     */
    protected renderHollowDiamondArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const size = 6;
        const length = 10;

        const p1 = { x: lastPoint.x, y: lastPoint.y };
        const p2 = {
            x: lastPoint.x - length * Math.cos(angle) + size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) - size * Math.cos(angle)
        };
        const p3 = {
            x: lastPoint.x - length * 2 * Math.cos(angle),
            y: lastPoint.y - length * 2 * Math.sin(angle)
        };
        const p4 = {
            x: lastPoint.x - length * Math.cos(angle) - size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) + size * Math.cos(angle)
        };

        return <path
            class-arrow-head={true}
            class-arrow-hollow-diamond={true}
            d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
            fill="white"
            stroke={this.getArrowColor(edge)}
            stroke-width="2" />;
    }

    /**
     * Circle arrow
     */
    protected renderCircleArrow(route: Point[], edge: SEdgeImpl): VNode {
        const lastPoint = route[route.length - 1];
        const radius = 5;

        return <circle
            class-arrow-head={true}
            class-arrow-circle={true}
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={radius}
            fill={this.getArrowColor(edge)} />;
    }

    /**
     * Get arrow angle and last point
     */
    protected getArrowInfo(route: Point[]): { lastPoint: Point; angle: number } {
        const lastPoint = route[route.length - 1];
        const secondLastPoint = route[route.length - 2];

        const angle = Math.atan2(
            lastPoint.y - secondLastPoint.y,
            lastPoint.x - secondLastPoint.x
        );

        return { lastPoint, angle };
    }

    /**
     * Create SVG path data from route points
     */
    protected createPathData(route: Point[]): string {
        if (route.length === 0) return '';

        let path = `M ${route[0].x} ${route[0].y}`;
        for (let i = 1; i < route.length; i++) {
            path += ` L ${route[i].x} ${route[i].y}`;
        }
        return path;
    }

    /**
     * Get color based on edge type
     */
    protected getColorForType(edgeType: EdgeType): string {
        switch (edgeType) {
            case 'dependency':
                return '#ff9800';
            case 'composition':
                return '#4caf50';
            case 'aggregation':
                return '#2196f3';
            case 'inheritance':
                return '#9c27b0';
            case 'association':
                return '#795548';
            default:
                return '#666';
        }
    }

    /**
     * Get arrow color (accounts for selection)
     */
    protected getArrowColor(edge: SEdgeImpl): string {
        if (edge.selected) {
            return '#1976d2';
        }
        const customEdge = edge as any as CustomEdge;
        return customEdge.customColor || this.getColorForType(customEdge.edgeType || 'normal');
    }
}

/**
 * Rectangular node view
 */
@injectable()
export class CustomRectangleNodeView extends RectangularNodeView {
    override render(node: Readonly<SNodeImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g class-sprotty-node={true}
            class-node-rectangle={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}>
            <rect
                x={0}
                y={0}
                width={Math.max(node.size.width, 0)}
                height={Math.max(node.size.height, 0)}
                class-node-body={true} />
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * Circular node view
 */
@injectable()
export class CustomCircleNodeView extends CircularNodeView {
    override render(node: Readonly<SNodeImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const radius = Math.max(node.size.width, node.size.height) / 2;

        return <g class-sprotty-node={true}
            class-node-circle={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}>
            <circle
                cx={radius}
                cy={radius}
                r={radius}
                class-node-body={true} />
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * Hexagon node view
 */
@injectable()
export class HexagonNodeView implements IView {
    render(node: Readonly<SNodeImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        const width = node.size.width;
        const height = node.size.height;

        // Hexagon points (flat-top orientation)
        const cx = width / 2;
        const cy = height / 2;
        const w2 = width / 2;
        const h2 = height / 2;
        const w4 = width / 4;

        const points = [
            { x: cx + w2, y: cy },
            { x: cx + w4, y: cy + h2 },
            { x: cx - w4, y: cy + h2 },
            { x: cx - w2, y: cy },
            { x: cx - w4, y: cy - h2 },
            { x: cx + w4, y: cy - h2 }
        ];

        const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

        return <g class-sprotty-node={true}
            class-node-hexagon={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}>
            <path d={pathData} class-node-body={true} />
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * Diamond node view
 */
@injectable()
export class DiamondNodeView implements IView {
    render(node: Readonly<SNodeImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        const width = node.size.width;
        const height = node.size.height;

        // Diamond points
        const cx = width / 2;
        const cy = height / 2;

        const pathData = `M ${cx},0 L ${width},${cy} L ${cx},${height} L 0,${cy} Z`;

        return <g class-sprotty-node={true}
            class-node-diamond={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}>
            <path d={pathData} class-node-body={true} />
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * Node label view
 */
@injectable()
export class NodeLabelView implements IView {
    render(label: Readonly<SLabelImpl>, context: RenderingContext): VNode | undefined {
        const parent = label.parent as SNodeImpl;
        if (!parent) {
            return undefined;
        }

        const x = parent.size.width / 2;
        const y = parent.size.height / 2;

        return <text
            class-node-label={true}
            transform={`translate(${x}, ${y})`}
            text-anchor="middle"
            dominant-baseline="middle">
            {label.text}
        </text>;
    }
}

/**
 * Port view
 */
@injectable()
export class PortView implements IView {
    render(port: Readonly<SNodeImpl>, context: RenderingContext): VNode | undefined {
        const size = Math.max(port.size.width, port.size.height);
        const radius = size / 2;

        return <circle
            class-sprotty-port={true}
            class-port={true}
            cx={radius}
            cy={radius}
            r={radius} />;
    }
}

/**
 * Custom bezier edge view with support for arrow types and decorations
 */
@injectable()
export class BezierCustomEdgeView extends BezierCurveEdgeView {
    override render(edge: Readonly<SEdgeImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        const route = this.edgeRouterRegistry.route(edge, args);
        if (route.length === 0) {
            return this.renderDanglingEdge('Cannot compute route', edge, context);
        }

        const customEdge = edge as any as CustomEdge;
        const edgeType = customEdge.edgeType || 'normal';
        const arrowType = customEdge.arrowType || 'standard';

        return <g class-sprotty-edge={true}
            class-custom-edge={true}
            class-edge-type-normal={edgeType === 'normal'}
            class-edge-type-dependency={edgeType === 'dependency'}
            class-edge-type-composition={edgeType === 'composition'}
            class-edge-type-aggregation={edgeType === 'aggregation'}
            class-edge-type-inheritance={edgeType === 'inheritance'}
            class-edge-type-association={edgeType === 'association'}
            class-edge-selected={edge.selected}
            class-edge-hover={edge.hoverFeedback}>
            {this.renderLine(edge, route, context, args)}
            {this.renderArrow(route, arrowType, edge)}
            {context.renderChildren(edge, { route })}
        </g>;
    }

    protected override renderLine(edge: SEdgeImpl, segments: Point[], context: RenderingContext, args?: IViewArgs): VNode {
        // Build bezier path directly (same logic as parent BezierCurveEdgeView)
        let path = '';
        if (segments.length >= 4) {
            const s = segments[0];
            const h1 = segments[1];
            const h2 = segments[2];
            const t = segments[3];
            path += `M${s.x},${s.y} C${h1.x},${h1.y} ${h2.x},${h2.y} ${t.x},${t.y}`;

            const pointsLeft = segments.length - 4;
            if (pointsLeft > 0 && pointsLeft % 3 === 0) {
                for (let i = 4; i < segments.length; i += 3) {
                    const c = segments[i + 1];
                    const p = segments[i + 2];
                    path += ` S${c.x},${c.y} ${p.x},${p.y}`;
                }
            }
        }

        // Add our custom styling
        const customEdge = edge as any as CustomEdge;
        const strokeStyle = customEdge.strokeStyle || 'solid';
        const color = customEdge.customColor || this.getColorForType(customEdge.edgeType || 'normal');

        return <path
            d={path}
            class-edge-path={true}
            class-stroke-solid={strokeStyle === 'solid'}
            class-stroke-dashed={strokeStyle === 'dashed'}
            class-stroke-dotted={strokeStyle === 'dotted'}
            stroke={color}
            fill="none" />;
    }

    protected renderArrow(route: Point[], arrowType: ArrowType, edge: SEdgeImpl): VNode | undefined {
        if (arrowType === 'none' || route.length < 2) {
            return undefined;
        }

        switch (arrowType) {
            case 'standard':
                return this.renderStandardArrow(route, edge);
            case 'hollow':
                return this.renderHollowArrow(route, edge);
            case 'diamond':
                return this.renderDiamondArrow(route, edge);
            case 'hollow-diamond':
                return this.renderHollowDiamondArrow(route, edge);
            case 'circle':
                return this.renderCircleArrow(route, edge);
            default:
                return this.renderStandardArrow(route, edge);
        }
    }

    protected renderStandardArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;

        const x1 = lastPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = lastPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = lastPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = lastPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        return <path
            class-arrow-head={true}
            class-arrow-standard={true}
            d={`M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`}
            fill={this.getArrowColor(edge)} />;
    }

    protected renderHollowArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;

        const x1 = lastPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = lastPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = lastPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = lastPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        return <path
            class-arrow-head={true}
            class-arrow-hollow={true}
            d={`M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`}
            fill="white"
            stroke={this.getArrowColor(edge)}
            stroke-width="2" />;
    }

    protected renderDiamondArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const size = 6;
        const length = 10;

        const p1 = { x: lastPoint.x, y: lastPoint.y };
        const p2 = {
            x: lastPoint.x - length * Math.cos(angle) + size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) - size * Math.cos(angle)
        };
        const p3 = {
            x: lastPoint.x - length * 2 * Math.cos(angle),
            y: lastPoint.y - length * 2 * Math.sin(angle)
        };
        const p4 = {
            x: lastPoint.x - length * Math.cos(angle) - size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) + size * Math.cos(angle)
        };

        return <path
            class-arrow-head={true}
            class-arrow-diamond={true}
            d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
            fill={this.getArrowColor(edge)} />;
    }

    protected renderHollowDiamondArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const size = 6;
        const length = 10;

        const p1 = { x: lastPoint.x, y: lastPoint.y };
        const p2 = {
            x: lastPoint.x - length * Math.cos(angle) + size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) - size * Math.cos(angle)
        };
        const p3 = {
            x: lastPoint.x - length * 2 * Math.cos(angle),
            y: lastPoint.y - length * 2 * Math.sin(angle)
        };
        const p4 = {
            x: lastPoint.x - length * Math.cos(angle) - size * Math.sin(angle),
            y: lastPoint.y - length * Math.sin(angle) + size * Math.cos(angle)
        };

        return <path
            class-arrow-head={true}
            class-arrow-hollow-diamond={true}
            d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
            fill="white"
            stroke={this.getArrowColor(edge)}
            stroke-width="2" />;
    }

    protected renderCircleArrow(route: Point[], edge: SEdgeImpl): VNode {
        const { lastPoint, angle } = this.getArrowInfo(route);
        const radius = 5;
        const offset = radius;

        const cx = lastPoint.x - offset * Math.cos(angle);
        const cy = lastPoint.y - offset * Math.sin(angle);

        return <circle
            class-arrow-head={true}
            class-arrow-circle={true}
            cx={cx}
            cy={cy}
            r={radius}
            fill={this.getArrowColor(edge)} />;
    }

    protected getArrowInfo(route: Point[]): { lastPoint: Point; angle: number } {
        const lastPoint = route[route.length - 1];
        const secondLastPoint = route[route.length - 2];
        const angle = Math.atan2(
            lastPoint.y - secondLastPoint.y,
            lastPoint.x - secondLastPoint.x
        );
        return { lastPoint, angle };
    }

    protected getArrowColor(edge: SEdgeImpl): string {
        const customEdge = edge as any as CustomEdge;
        if (customEdge.customColor) {
            return customEdge.customColor;
        }
        return this.getColorForType(customEdge.edgeType || 'normal');
    }

    protected getColorForType(type: EdgeType): string {
        switch (type) {
            case 'dependency':
                return '#999';
            case 'composition':
                return '#2a5490';
            case 'aggregation':
                return '#6c8ebf';
            case 'inheritance':
                return '#2a5490';
            case 'association':
                return '#666';
            default:
                return '#333';
        }
    }
}

