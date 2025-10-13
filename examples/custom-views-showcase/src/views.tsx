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
import { IView, RenderingContext, IViewArgs, RectangularNodeView, PolylineEdgeView } from 'sprotty';
import { BasicShapeNode, EnhancedNode, ComplexNode, StatefulNode, StyledEdge, CustomLabel } from './model';

/**
 * Basic Shape View - demonstrates simple custom view creation
 */
@injectable()
export class BasicShapeView implements IView {
    render(node: Readonly<BasicShapeNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.size;
        const centerX = width / 2;
        const centerY = height / 2;

        let shape: VNode;
        switch (node.shape) {
            case 'circle':
                const radius = Math.min(centerX, centerY);
                shape = <circle
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    class-basic-shape={true}
                    class-shape-circle={true}
                    fill={node.color || '#e1f5fe'}
                    stroke="#01579b"
                    stroke-width="2" />;
                break;

            case 'triangle':
                const points = `${centerX},5 ${width - 5},${height - 5} 5,${height - 5}`;
                shape = <polygon
                    points={points}
                    class-basic-shape={true}
                    class-shape-triangle={true}
                    fill={node.color || '#f3e5f5'}
                    stroke="#4a148c"
                    stroke-width="2" />;
                break;

            case 'diamond':
                const path = `M ${centerX} 5 L ${width - 5} ${centerY} L ${centerX} ${height - 5} L 5 ${centerY} Z`;
                shape = <path
                    d={path}
                    class-basic-shape={true}
                    class-shape-diamond={true}
                    fill={node.color || '#e8f5e8'}
                    stroke="#1b5e20"
                    stroke-width="2" />;
                break;

            default:
                shape = <rect width={width} height={height} fill="#ccc" />;
        }

        return <g
            class-sprotty-node={true}
            class-basic-shape-node={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}>
            {shape}
            {context.renderChildren(node)}
        </g>;
    }

    protected isVisible(element: BasicShapeNode, context: RenderingContext): boolean {
        return context.targetKind !== 'hidden';
    }
}

/**
 * Enhanced View - demonstrates extending base views with decorations
 */
@injectable()
export class EnhancedNodeView extends RectangularNodeView {
    override render(node: Readonly<EnhancedNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const { width, height } = node.size;

        return <g
            class-sprotty-node={true}
            class-enhanced-node={true}
            class-status-normal={node.status === 'normal'}
            class-status-warning={node.status === 'warning'}
            class-status-error={node.status === 'error'}
            class-status-success={node.status === 'success'}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}>

            {/* Main rectangle */}
            <rect
                x="0" y="0"
                width={Math.max(width, 0)}
                height={Math.max(height, 0)}
                rx={node.cornerRadius}
                ry={node.cornerRadius}
                class-enhanced-rect={true} />

            {/* Status indicator */}
            {this.renderStatusIndicator(node)}

            {/* Border decoration */}
            {node.showBorder && this.renderBorder(node)}

            {/* Children */}
            {context.renderChildren(node)}
        </g>;
    }

    protected renderStatusIndicator(node: EnhancedNode): VNode | undefined {
        if (node.status === 'normal') return undefined;

        const size = 8;
        return <circle
            cx={node.size.width - size - 2}
            cy={size + 2}
            r={size}
            class-status-indicator={true}
            class-indicator-warning={node.status === 'warning'}
            class-indicator-error={node.status === 'error'}
            class-indicator-success={node.status === 'success'} />;
    }

    protected renderBorder(node: EnhancedNode): VNode {
        const { width, height } = node.size;
        return <rect
            x="-2" y="-2"
            width={width + 4}
            height={height + 4}
            rx={node.cornerRadius + 2}
            ry={node.cornerRadius + 2}
            class-enhanced-border={true}
            fill="none"
            stroke-width="2" />;
    }
}

/**
 * Complex View - demonstrates compositional view patterns
 */
@injectable()
export class ComplexNodeView implements IView {
    render(node: Readonly<ComplexNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g
            class-sprotty-node={true}
            class-complex-node={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}>

            {/* Main container */}
            <rect
                x="0" y="0"
                width={Math.max(node.size.width, 0)}
                height={Math.max(node.size.height, 0)}
                class-complex-container={true} />

            {/* Header section */}
            {node.showHeader && this.renderHeader(node)}

            {/* Body section */}
            {this.renderBody(node, context)}

            {/* Footer section */}
            {node.showFooter && this.renderFooter(node)}
        </g>;
    }

    protected renderHeader(node: ComplexNode): VNode {
        const headerHeight = 30;
        return <g class-complex-header={true}>
            <rect
                x="0" y="0"
                width={node.size.width}
                height={headerHeight}
                fill={node.headerColor || '#1976d2'}
                class-header-rect={true} />

            {/* Icon */}
            {node.icon && (
                <text x="8" y="20"
                    class-header-icon={true}
                    fill="white">
                    {node.icon}
                </text>
            )}

            {/* Title */}
            <text x={node.icon ? "28" : "8"} y="16"
                class-header-title={true}
                fill="white">
                {node.title}
            </text>

            {/* Subtitle */}
            {node.subtitle && (
                <text x={node.icon ? "28" : "8"} y="26"
                    class-header-subtitle={true}
                    fill="rgba(255,255,255,0.8)"
                    font-size="10">
                    {node.subtitle}
                </text>
            )}
        </g>;
    }

    protected renderBody(node: ComplexNode, context: RenderingContext): VNode {
        const headerHeight = node.showHeader ? 30 : 0;
        const footerHeight = node.showFooter ? 20 : 0;
        const bodyHeight = node.size.height - headerHeight - footerHeight;

        return <g class-complex-body={true} transform={`translate(0, ${headerHeight})`}>
            <rect
                x="0" y="0"
                width={node.size.width}
                height={bodyHeight}
                class-body-rect={true} />
            {context.renderChildren(node)}
        </g>;
    }

    protected renderFooter(node: ComplexNode): VNode {
        const footerY = node.size.height - 20;
        return <g class-complex-footer={true}>
            <line
                x1="0" y1={footerY}
                x2={node.size.width} y2={footerY}
                class-footer-line={true} />
        </g>;
    }

    protected isVisible(element: ComplexNode, context: RenderingContext): boolean {
        return context.targetKind !== 'hidden';
    }
}

/**
 * Stateful View - demonstrates conditional rendering based on state
 */
@injectable()
export class StatefulNodeView implements IView {
    render(node: Readonly<StatefulNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
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

    protected renderLoadingState(node: StatefulNode, context: RenderingContext): VNode {
        const { width, height } = node.size;
        const progress = node.progress || 0;
        const progressWidth = (width - 20) * (progress / 100);

        return <g
            class-sprotty-node={true}
            class-stateful-node={true}
            class-state-loading={true}>

            <rect
                x="0" y="0"
                width={width} height={height}
                class-loading-background={true} />

            {/* Progress bar background */}
            <rect
                x="10" y={height - 15}
                width={width - 20} height="5"
                class-progress-background={true} />

            {/* Progress bar fill */}
            <rect
                x="10" y={height - 15}
                width={progressWidth} height="5"
                class-progress-fill={true} />

            {/* Loading text */}
            <text
                x={width / 2} y={height / 2}
                text-anchor="middle"
                class-loading-text={true}>
                {node.message || `Loading... ${progress}%`}
            </text>

            {context.renderChildren(node)}
        </g>;
    }

    protected renderErrorState(node: StatefulNode, context: RenderingContext): VNode {
        const { width, height } = node.size;

        return <g
            class-sprotty-node={true}
            class-stateful-node={true}
            class-state-error={true}>

            <rect
                x="0" y="0"
                width={width} height={height}
                class-error-background={true} />

            {/* Error icon */}
            <text
                x="10" y="20"
                class-error-icon={true}>
                ⚠
            </text>

            {/* Error message */}
            <text
                x="30" y="20"
                class-error-text={true}>
                {node.message || 'Error occurred'}
            </text>

            {context.renderChildren(node)}
        </g>;
    }

    protected renderSuccessState(node: StatefulNode, context: RenderingContext): VNode {
        const { width, height } = node.size;

        return <g
            class-sprotty-node={true}
            class-stateful-node={true}
            class-state-success={true}>

            <rect
                x="0" y="0"
                width={width} height={height}
                class-success-background={true} />

            {/* Success icon */}
            <text
                x="10" y="20"
                class-success-icon={true}>
                ✓
            </text>

            {/* Success message */}
            <text
                x="30" y="20"
                class-success-text={true}>
                {node.message || 'Success!'}
            </text>

            {context.renderChildren(node)}
        </g>;
    }

    protected renderIdleState(node: StatefulNode, context: RenderingContext): VNode {
        const { width, height } = node.size;

        return <g
            class-sprotty-node={true}
            class-stateful-node={true}
            class-state-idle={true}>

            <rect
                x="0" y="0"
                width={width} height={height}
                class-idle-background={true} />

            <text
                x={width / 2} y={height / 2}
                text-anchor="middle"
                class-idle-text={true}>
                {node.message || 'Ready'}
            </text>

            {context.renderChildren(node)}
        </g>;
    }

    protected isVisible(element: StatefulNode, context: RenderingContext): boolean {
        return context.targetKind !== 'hidden';
    }
}

/**
 * Styled Edge View - demonstrates custom edge rendering
 */
@injectable()
export class StyledEdgeView extends PolylineEdgeView {
    protected override renderLine(edge: StyledEdge, segments: any[], context: RenderingContext): VNode {
        return <path
            class-sprotty-edge={true}
            class-styled-edge={true}
            class-edge-solid={edge.style === 'solid'}
            class-edge-dashed={edge.style === 'dashed'}
            class-edge-dotted={edge.style === 'dotted'}
            class-edge-animated={edge.animated}
            d={this.createPath(segments)}
            fill="none"
            stroke={edge.color || '#666'}
            stroke-width={edge.thickness}
            stroke-dasharray={this.getStrokeDashArray(edge)}>

            {/* Animation is handled via CSS for better performance */}
        </path>;
    }

    protected createPath(segments: any[]): string {
        if (segments.length === 0) return '';

        let path = `M ${segments[0].x} ${segments[0].y}`;
        for (let i = 1; i < segments.length; i++) {
            path += ` L ${segments[i].x} ${segments[i].y}`;
        }
        return path;
    }

    protected getStrokeDashArray(edge: StyledEdge): string {
        switch (edge.style) {
            case 'dashed': return '10,5';
            case 'dotted': return '2,3';
            default: return 'none';
        }
    }
}

/**
 * Custom Label View - demonstrates label customization
 */
@injectable()
export class CustomLabelView implements IView {
    render(label: Readonly<CustomLabel>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(label, context) || !label.text) {
            return undefined;
        }

        return <g class-sprotty-label={true} class-custom-label={true}>
            {/* Background */}
            {label.backgroundColor && (
                <rect
                    x={-(Math.min(label.text.length * 4 + 8, 45))}
                    y="-8"
                    width={Math.min(label.text.length * 8 + 16, 90)}
                    height="16"
                    fill={label.backgroundColor}
                    stroke={label.borderColor}
                    stroke-width={label.borderColor ? "1" : "0"}
                    rx="3" ry="3"
                    class-label-background={true} />
            )}

            {/* Text */}
            <text
                class-label-text={true}
                font-size={label.fontSize}
                text-anchor="middle">
                {label.text}
            </text>
        </g>;
    }

    protected isVisible(element: CustomLabel, context: RenderingContext): boolean {
        return context.targetKind !== 'hidden';
    }
}
