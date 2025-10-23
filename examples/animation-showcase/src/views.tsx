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
import { svg } from 'sprotty/lib/lib/jsx';

import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { IView, RenderingContext, SNodeImpl, SEdgeImpl, SModelElementImpl, IViewArgs, PolylineEdgeView, RoutedPoint } from 'sprotty';
import { toDegrees } from 'sprotty-protocol';
import { AnimatedNode, AnimatedEdge, AnimatedLabel, AnimationState } from './model';
import { STATE_COLORS, ICON_SIZE, ICON_PADDING, ICON_SPINNER_RADIUS_OFFSET, EDGE_DASH_ARRAY } from './constants';

/**
 * Custom view for animated nodes
 */
@injectable()
export class AnimatedNodeView implements IView {
    render(node: Readonly<SNodeImpl & AnimatedNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const state = node.state || 'idle';
        const scale = node.scale || 1;
        const rotation = node.rotation || 0;
        const color = node.color || this.getStateColor(state);
        const animationClass = node.animationClass || '';

        // Apply scale/rotation transforms centered on the node in an inner group
        const needsTransform = scale !== 1 || rotation !== 0;
        const transform = needsTransform ?
            `translate(${node.size.width / 2}, ${node.size.height / 2}) scale(${scale}) rotate(${rotation}) translate(${-node.size.width / 2}, ${-node.size.height / 2})` :
            undefined;

        return <g class-animated-node={true}
            class-state-idle={state === 'idle'}
            class-state-active={state === 'active'}
            class-state-success={state === 'success'}
            class-state-error={state === 'error'}
            class-state-loading={state === 'loading'}
            class-sprotty-node={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}
            class-glow-low={animationClass === 'glow-low'}
            class-glow-medium={animationClass === 'glow-medium'}
            class-glow-high={animationClass === 'glow-high'}>
            <g {...(transform ? { transform } : {})}>
                <rect x="0" y="0"
                    width={Math.max(node.size.width, 0)}
                    height={Math.max(node.size.height, 0)}
                    rx="8"
                    class-node-body={true}
                    style={{ fill: color }} />

                {/* State indicator icon */}
                {this.renderStateIndicator(state, node.size.width, node.size.height)}

                {context.renderChildren(node)}
            </g>
        </g>;
    }

    protected renderStateIndicator(state: AnimationState, width: number, height: number): VNode | undefined {
        const x = width - ICON_SIZE - ICON_PADDING;
        const y = ICON_PADDING;

        switch (state) {
            case 'loading':
                return <g transform={`translate(${x}, ${y})`}>
                    <circle cx={ICON_SIZE / 2} cy={ICON_SIZE / 2} r={ICON_SIZE / 2 - ICON_SPINNER_RADIUS_OFFSET}
                        class-loading-spinner={true}
                        fill="none"
                        stroke="#fff"
                        stroke-width="2"
                        stroke-dasharray="28 10"
                        stroke-linecap="round" />
                </g>;
            case 'success':
                return <g transform={`translate(${x}, ${y})`}>
                    <path d="M3,8 L7,12 L13,4"
                        class-success-checkmark={true}
                        fill="none"
                        stroke="#fff"
                        stroke-width="2"
                        stroke-linecap="round" />
                </g>;
            case 'error':
                return <g transform={`translate(${x}, ${y})`}>
                    <path d="M4,4 L12,12 M12,4 L4,12"
                        class-error-cross={true}
                        fill="none"
                        stroke="#fff"
                        stroke-width="2"
                        stroke-linecap="round" />
                </g>;
            case 'active':
                return <g transform={`translate(${x}, ${y})`}>
                    <circle cx={ICON_SIZE / 2} cy={ICON_SIZE / 2} r={4}
                        class-active-pulse={true}
                        fill="#fff" />
                </g>;
            default:
                return undefined;
        }
    }

    protected getStateColor(state: AnimationState): string {
        return STATE_COLORS[state];
    }

    protected isVisible(element: SNodeImpl, context: RenderingContext): boolean {
        return context.targetKind !== 'hidden';
    }
}

/**
 * Custom view for animated edges with flow effects
 */
@injectable()
export class AnimatedEdgeView extends PolylineEdgeView {
    protected override renderLine(edge: SEdgeImpl & AnimatedEdge, segments: RoutedPoint[], context: RenderingContext, args?: IViewArgs): VNode {
        const animated = (edge as AnimatedEdge).animated || false;
        const strokeDashOffset = (edge as AnimatedEdge).strokeDashOffset || 0;

        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }

        return <path class-animated-edge={true}
            class-edge-animated={animated}
            d={path}
            fill="none"
            stroke="#666"
            stroke-width="2"
            stroke-dasharray={animated ? EDGE_DASH_ARRAY : undefined}
            stroke-dashoffset={strokeDashOffset} />;
    }

    protected override renderAdditionals(edge: SEdgeImpl & AnimatedEdge, segments: RoutedPoint[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);

        // Add arrow head
        if (segments.length >= 2) {
            const lastPoint = segments[segments.length - 1];
            const secondLastPoint = segments[segments.length - 2];

            const dx = lastPoint.x - secondLastPoint.x;
            const dy = lastPoint.y - secondLastPoint.y;
            const angle = toDegrees(Math.atan2(dy, dx));

            additionals.push(
                <g transform={`translate(${lastPoint.x}, ${lastPoint.y}) rotate(${angle})`}>
                    <polygon points="-8,-4 0,0 -8,4"
                        class-arrow-head={true}
                        fill="#666" />
                </g>
            );
        }

        return additionals;
    }
}

/**
 * View for demonstration labels
 */
@injectable()
export class AnimatedLabelView implements IView {
    render(model: Readonly<SModelElementImpl>, context: RenderingContext): VNode | undefined {
        const label = model as unknown as AnimatedLabel;
        const fontSize = label.fontSize || 12;
        const color = label.color || '#333';

        return <text class-animated-label={true}
            class-sprotty-label={true}
            x={0}
            y={fontSize}
            font-size={fontSize}
            fill={color}>
            {label.text}
        </text>;
    }
}

