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
import {
    IView, RenderingContext, SGraphView, PolylineEdgeView, SLabelView
} from 'sprotty';
import { VNode } from 'snabbdom';
import { Point, toDegrees, angleOfPoint } from 'sprotty-protocol';
import { AnimatableNode, AnimatableEdge, AnimatableLabel, isAnimatable, isAnimatableEdge, isAnimatableLabel } from './model';

/**
 * Enhanced graph view that supports animation contexts
 */
@injectable()
export class AnimatedGraphView extends SGraphView {
    override render(model: any, context: RenderingContext): VNode {
        // Animation context is stored globally via singleton

        return super.render(model, context);
    }
}

/**
 * Animated node view with support for various animation effects
 */
@injectable()
export class AnimatedNodeView implements IView {
    render(node: AnimatableNode, context: RenderingContext): VNode {
        if (!isAnimatable(node)) {
            return <g></g>;
        }

        const { width, height } = node.bounds;

        // Calculate transform based on current animation state
        const transform = this.calculateTransform(node);

        // Get current colors based on state
        const colors = this.getStateColors(node);

        // Build style object for glow effect
        const glowStyle: any = {};
        if (node.glowIntensity > 0) {
            const glowSize = Math.round(node.glowIntensity * 15);
            glowStyle.filter = `drop-shadow(0 0 ${glowSize}px #00aaff) drop-shadow(0 0 ${glowSize * 2}px #0088ff)`;
        }

        return <g class-sprotty-node={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}
            class-animating={!!node.currentAnimation}
            data-animation-state={node.animationState}
            transform={transform}
            style={glowStyle}>

            {/* Main node shape */}
            <rect x={0} y={0} width={width} height={height}
                fill={colors.fill}
                stroke={node.glowIntensity > 0 ? '#00aaff' : colors.stroke}
                stroke-width={node.glowIntensity > 0 ? (colors.strokeWidth + node.glowIntensity * 2) : colors.strokeWidth}
                class-node-shape={true} />

            {/* Node label */}
            <text x={width / 2} y={height / 2}
                text-anchor="middle"
                dominant-baseline="central"
                class-node-label={true}
                fill={colors.textFill}>
                {node.id}
            </text>
        </g>;
    }

    private calculateTransform(node: AnimatableNode): string | undefined {
        const transforms: string[] = [];

        // Scale transformation
        if (node.scale !== 1) {
            const centerX = node.bounds.width / 2;
            const centerY = node.bounds.height / 2;
            transforms.push(`translate(${centerX}, ${centerY}) scale(${node.scale}) translate(${-centerX}, ${-centerY})`);
        }

        // Rotation transformation
        if (node.rotation !== 0) {
            const centerX = node.bounds.width / 2;
            const centerY = node.bounds.height / 2;
            transforms.push(`rotate(${node.rotation} ${centerX} ${centerY})`);
        }

        return transforms.length > 0 ? transforms.join(' ') : undefined;
    }

    private getStateColors(node: AnimatableNode): { fill: string; stroke: string; strokeWidth: number; textFill: string } {
        // Use interpolated color if available (from state transitions)
        if ((node as any).interpolatedColor) {
            return {
                fill: (node as any).interpolatedColor,
                stroke: this.darkenColor((node as any).interpolatedColor, 0.2),
                strokeWidth: 2,
                textFill: '#333'
            };
        }

        // Default state colors - using more saturated colors for visible transitions
        const stateColors = {
            idle: { fill: '#b0b0b0', stroke: '#6c757d', strokeWidth: 2, textFill: '#000' },      // Medium gray
            processing: { fill: '#ffc107', stroke: '#ff9800', strokeWidth: 3, textFill: '#000' }, // Bright yellow/amber
            complete: { fill: '#4caf50', stroke: '#2e7d32', strokeWidth: 2, textFill: '#fff' },  // Green
            error: { fill: '#f44336', stroke: '#c62828', strokeWidth: 3, textFill: '#fff' }      // Red
        };

        return stateColors[node.animationState] || stateColors.idle;
    }

    private darkenColor(color: string, factor: number): string {
        // Simple color darkening - in a real app, use a proper color library
        const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (match) {
            const r = Math.max(0, parseInt(match[1]) * (1 - factor));
            const g = Math.max(0, parseInt(match[2]) * (1 - factor));
            const b = Math.max(0, parseInt(match[3]) * (1 - factor));
            return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
        return color;
    }

}

/**
 * Animated edge view with flow effects
 */
@injectable()
export class AnimatedEdgeView extends PolylineEdgeView {
    protected override renderLine(edge: AnimatableEdge, segments: Point[], context: RenderingContext): VNode {
        if (!isAnimatableEdge(edge)) {
            return super.renderLine(edge as any, segments, context);
        }

        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }

        // Calculate stroke properties based on animation state
        const strokeWidth = edge.thickness + (edge.pulseIntensity * 2);
        const opacity = 0.7 + (edge.pulseIntensity * 0.3);

        return <g class-sprotty-edge={true} class-animated-edge={true}>
            {/* Main edge line */}
            <path d={path}
                fill="none"
                stroke="#666"
                stroke-width={strokeWidth}
                opacity={opacity}
                class-edge-line={true} />

            {/* Flow animation overlay */}
            {edge.animationProgress > 0 && this.renderFlowEffect(edge, path)}

            {/* Pulse effect */}
            {edge.pulseIntensity > 0 && this.renderPulseEffect(edge, path)}
        </g>;
    }

    private renderFlowEffect(edge: AnimatableEdge, path: string): VNode {
        const dashArray = "10,5";
        const dashOffset = -edge.animationProgress * 15;

        return <path d={path}
            fill="none"
            stroke="#007bff"
            stroke-width={edge.thickness + 1}
            stroke-dasharray={dashArray}
            stroke-dashoffset={dashOffset}
            opacity={0.8}
            class-flow-effect={true} />;
    }

    private renderPulseEffect(edge: AnimatableEdge, path: string): VNode {
        const glowWidth = edge.thickness + (edge.pulseIntensity * 4);

        return <path d={path}
            fill="none"
            stroke="#007bff"
            stroke-width={glowWidth}
            opacity={edge.pulseIntensity * 0.3}
            filter="blur(2px)"
            class-pulse-effect={true} />;
    }

    protected override renderAdditionals(edge: AnimatableEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge as any, segments, context);

        if (isAnimatableEdge(edge) && edge.flowDirection !== 'forward') {
            // Add directional indicators for bidirectional or backward flow
            additionals.push(this.renderDirectionIndicators(edge, segments));
        }

        return additionals;
    }

    private renderDirectionIndicators(edge: AnimatableEdge, segments: Point[]): VNode {
        if (segments.length < 2) return <g></g>;

        const midIndex = Math.floor(segments.length / 2);
        const midPoint = segments[midIndex];
        const nextPoint = segments[midIndex + 1] || segments[midIndex - 1];

        const angle = toDegrees(angleOfPoint({ x: nextPoint.x - midPoint.x, y: nextPoint.y - midPoint.y }));

        return <g transform={`translate(${midPoint.x}, ${midPoint.y}) rotate(${angle})`}>
            <polygon points="-5,-3 5,0 -5,3"
                fill="#007bff"
                opacity={0.7}
                class-direction-indicator={true} />
        </g>;
    }
}

/**
 * Animated label view with typewriter effects
 */
@injectable()
export class AnimatedLabelView extends SLabelView {
    override render(label: AnimatableLabel, context: RenderingContext): VNode | undefined {
        if (!isAnimatableLabel(label)) {
            return super.render(label as any, context);
        }

        const vnode = super.render(label as any, context);

        if (!vnode) return undefined;

        // Add animation-specific classes and effects
        if (vnode && vnode.data) {
            vnode.data.class = {
                ...vnode.data.class,
                'animated-label': true,
                'typewriter-active': label.typewriterProgress > 0 && label.typewriterProgress < 1
            };

            // Add text glow effect
            if (label.textGlow > 0) {
                if (!vnode.data) vnode.data = {};
                if (!vnode.data.style) vnode.data.style = {};
                (vnode.data.style as any).filter = `drop-shadow(0 0 ${label.textGlow * 5}px rgba(0, 123, 255, 0.6))`;
            }

            // Add text scale effect
            if (label.textScale !== 1) {
                const transform = vnode.data.attrs?.transform || '';
                vnode.data.attrs = {
                    ...vnode.data.attrs,
                    transform: `${transform} scale(${label.textScale})`
                };
            }
        }

        return vnode;
    }
}

/**
 * Control panel view for animation settings
 */
// Control panel view removed - controls are in HTML
