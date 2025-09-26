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
import { VNode } from 'snabbdom';
import { RenderingContext, IView, IViewArgs, svg, PolylineEdgeView } from 'sprotty';
import { injectable } from 'inversify';
import { SEdgeImpl } from 'sprotty';
import { InteractiveNode, InteractiveButton, InteractiveLabel } from './model';

@injectable()
export class InteractiveNodeView implements IView {
    render(node: InteractiveNode, context: RenderingContext): VNode | undefined {
        const width = node.size.width;
        const height = node.size.height;

        return <g class-interactive-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            {/* Main node container */}
            <rect x="0" y="0" width={width} height={height}
                class-node-background={true} />

            {/* Header section */}
            <rect x="0" y="0" width={width} height="30"
                class-node-header={true} />

            {/* Icon */}
            {node.icon && (
                <text x="8" y="20" class-node-icon={true}>
                    {node.icon}
                </text>
            )}

            {/* Title */}
            {node.title && (
                <text x={node.icon ? "28" : "8"} y="20" class-node-title={true}>
                    {node.title}
                </text>
            )}

            {/* Status indicator */}
            {node.status && (
                <circle cx={width - 15} cy="15" r="4"
                    class-status-indicator={true}
                    class-status-online={node.status === 'online'}
                    class-status-offline={node.status === 'offline'}
                    class-status-warning={node.status === 'warning'}
                    class-status-error={node.status === 'error'} />
            )}

            {/* Description */}
            {node.description && (
                <text x="8" y="50" class-node-description={true}>
                    {node.description}
                </text>
            )}

            {/* Render child elements (buttons, labels) */}
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class InteractiveButtonView implements IView {
    render(button: InteractiveButton, context: RenderingContext): VNode | undefined {
        const icon = this.getIconForButton(button);

        return <g class-interactive-button={true}
            class-button-info={button.buttonType === 'info'}
            class-button-delete={button.buttonType === 'delete'}
            class-button-edit={button.buttonType === 'edit'}
            class-button-settings={button.buttonType === 'settings'}
            class-pressed={(button as any).pressed}>

            <circle cx="12" cy="12" r="10" class-button-background={true} />
            <text x="12" y="16" text-anchor="middle" class-button-icon={true}>
                {icon}
            </text>

            {/* Tooltip background (shown on hover) */}
            {button.tooltip && (
                <g class-button-tooltip={true}>
                    <rect x="25" y="2" width={button.tooltip.length * 6 + 8} height="20"
                        class-tooltip-background={true} rx="3" />
                    <text x="29" y="14" class-tooltip-text={true}>
                        {button.tooltip}
                    </text>
                </g>
            )}
        </g>;
    }

    private getIconForButton(button: InteractiveButton): string {
        switch (button.buttonType) {
            case 'info': return 'ℹ️';
            case 'delete': return '🗑️';
            case 'edit': return '✏️';
            case 'settings': return '⚙️';
            default: return '●';
        }
    }
}

@injectable()
export class InteractiveLabelView implements IView {
    render(label: InteractiveLabel, context: RenderingContext): VNode | undefined {
        return <text class-interactive-label={true}
            class-label-title={label.labelType === 'title'}
            class-label-description={label.labelType === 'description'}
            class-label-status={label.labelType === 'status'}
            class-label-button={label.labelType === 'button-label'}>
            {label.text}
        </text>;
    }
}

@injectable()
export class InteractiveEdgeView extends PolylineEdgeView {
    override render(edge: Readonly<SEdgeImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        const router = this.edgeRouterRegistry.get(edge.routerKind);
        const route = router.route(edge);
        if (route.length === 0) {
            return this.renderDanglingEdge('Cannot compute route', edge, context);
        }

        const color = this.getEdgeColor(edge);
        const strokeWidth = edge.selected ? 2 : 1;

        return <g class-sprotty-edge={true}
            class-interactive-edge={true}
            class-selected={edge.selected}
            class-mouseover={edge.hoverFeedback}>

            <path d={this.createPathForRoute(route)}
                fill="none"
                stroke={color}
                stroke-width={strokeWidth}
                class-edge-path={true} />

            {/* Arrow head */}
            {this.renderArrowHead(route, color)}

            {/* Render child elements (labels) */}
            {context.renderChildren(edge)}
        </g>;
    }

    protected getEdgeColor(edge: SEdgeImpl): string {
        if (edge.selected || edge.hoverFeedback) {
            return '#1976d2';
        }
        return '#999999';
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

        // Calculate angle from second-to-last to last point
        const angle = Math.atan2(
            lastPoint.y - secondLastPoint.y,
            lastPoint.x - secondLastPoint.x
        );

        const arrowLength = 8;
        const arrowAngle = Math.PI / 6; // 30 degrees

        // Calculate arrow head points
        const x1 = lastPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = lastPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = lastPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = lastPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        return <path d={`M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`}
            fill={color}
            class-arrow-head={true} />;
    }
}
