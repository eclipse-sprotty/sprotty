/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/** @jsx svg */
import { svg } from 'sprotty/lib/lib/jsx';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { ShapeView, PolylineEdgeView, RenderingContext, SNodeImpl, SEdgeImpl } from 'sprotty';
import { DebugNode, DebugEdge } from './model';

/**
 * Views for the Diagram Action Debugging/Monitoring Tool
 * This demonstrates how to create custom views for debugging applications
 */

@injectable()
export class DebugNodeView extends ShapeView {
    render(node: SNodeImpl & DebugNode, context: RenderingContext): VNode {
        // DEBUG: Log everything about the node
        console.log('🔍 DebugNodeView.render called with node:', {
            id: node.id,
            type: node.type,
            size: node.size,
            position: (node as any).position,
            nodeType: (node as any).nodeType,
            label: (node as any).label,
            status: (node as any).status,
            fullNode: node
        });

        const width = node.size?.width || 150;
        const height = node.size?.height || 100;
        const nodeType = (node as any).nodeType || 'client';
        const label = (node as any).label || 'Unknown';
        const status = (node as any).status || 'online';
        const createdAt = (node as any).createdAt || Date.now();
        const lastModified = (node as any).lastModified;

        // Status colors with debug-specific styling
        const statusColors = {
            online: '#28a745',
            offline: '#6c757d',
            error: '#dc3545',
            processing: '#ffc107'
        };

        // Node type icons and colors
        const nodeConfig = {
            client: { icon: '💻', color: '#007bff' },
            server: { icon: '🖥️', color: '#6f42c1' },
            database: { icon: '🗄️', color: '#fd7e14' }
        };

        const config = nodeConfig[nodeType as keyof typeof nodeConfig] || nodeConfig.client;
        const isModified = lastModified && lastModified > createdAt;

        try {
            return <g class-sprotty-node={true} class-debug-node={true} class-selected={node.selected}>
                {/* Main container with debug styling */}
                <rect x="0" y="0" width={width} height={height}
                    class-node-background={true}
                    fill="#f8f9fa"
                    stroke={config.color}
                    stroke-width={isModified ? "3" : "2"}
                    stroke-dasharray={isModified ? "5,3" : "none"}
                    rx="8" />

                {/* Header with node type */}
                <rect x="0" y="0" width={width} height="30"
                    class-node-header={true}
                    fill={config.color}
                    rx="8" />
                <rect x="0" y="22" width={width} height="8"
                    fill={config.color} />

                {/* Node type icon */}
                <text x="8" y="22" font-size="14" fill="white" class-node-icon={true}>
                    {config.icon}
                </text>

                {/* Node type label */}
                <text x="28" y="22" font-size="12" font-weight="bold" fill="white" class-node-type={true}>
                    {nodeType.toUpperCase()}
                </text>

                {/* Status indicator */}
                <circle cx={width - 15} cy="15" r="5"
                    fill={statusColors[status as keyof typeof statusColors]}
                    class-status-indicator={true}
                    class-status-processing={status === 'processing'}>
                    {status === 'processing' && (
                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                    )}
                </circle>

                {/* Main label */}
                <text x="8" y="50" font-size="14" font-weight="bold" fill="#212529" class-node-label={true}>
                    {label.length > 18 ? label.substring(0, 18) + '...' : label}
                </text>

                {/* Status text */}
                <text x="8" y="68" font-size="11" fill="#6c757d" class-status-text={true}>
                    Status: {status}
                </text>

                {/* Debug info - creation time */}
                <text x="8" y="85" font-size="9" fill="#868e96" class-debug-info={true}>
                    Created: {new Date(createdAt).toLocaleTimeString()}
                </text>

                {/* Modified indicator */}
                {isModified && (
                    <text x={width - 60} y="85" font-size="9" fill="#fd7e14" class-modified-indicator={true}>
                        MODIFIED
                    </text>
                )}

                {/* Debug overlay for selection */}
                {node.selected && (
                    <rect x="-2" y="-2" width={width + 4} height={height + 4}
                        fill="none"
                        stroke="#007bff"
                        stroke-width="2"
                        stroke-dasharray="8,4"
                        rx="10"
                        class-selection-overlay={true}>
                        <animate attributeName="stroke-dashoffset" values="0;12" dur="1s" repeatCount="indefinite" />
                    </rect>
                )}

                {/* Render children (buttons, compartments, etc.) */}
                {node.children && context.renderChildren(node)}
            </g>;
        } catch (error) {
            console.error('🚨 Error in DebugNodeView.render:', error);
            console.error('🚨 Node that caused error:', node);
            console.error('🚨 Stack trace:', error.stack);
            // Return a simple fallback
            return <g class-sprotty-node={true}>
                <rect x="0" y="0" width="100" height="50" fill="red" />
                <text x="10" y="30" fill="white">ERROR</text>
            </g>;
        }
    }
}

@injectable()
export class DebugEdgeView extends PolylineEdgeView {
    override render(edge: SEdgeImpl & DebugEdge, context: RenderingContext): VNode {
        // Calculate the route using the edge router (this is the key fix!)
        const router = this.edgeRouterRegistry.get(edge.routerKind);
        const route = router.route(edge);

        // DEBUG: Log everything about the edge
        console.log('🔍 DebugEdgeView.render called with edge:', {
            id: edge.id,
            type: edge.type,
            sourceId: (edge as any).sourceId,
            targetId: (edge as any).targetId,
            routerKind: edge.routerKind,
            calculatedRoute: route,
            routeLength: route.length,
            edgeType: (edge as any).edgeType,
            fullEdge: edge
        });

        const edgeType = (edge as any).edgeType || 'communication';
        const createdAt = (edge as any).createdAt || Date.now();
        const lastActivity = (edge as any).lastActivity;

        // Edge styling based on type
        const edgeStyles = {
            communication: {
                stroke: '#007bff',
                strokeWidth: '2',
                strokeDasharray: 'none'
            },
            dependency: {
                stroke: '#6c757d',
                strokeWidth: '2',
                strokeDasharray: '8,4'
            }
        };

        const style = edgeStyles[edgeType as keyof typeof edgeStyles] || edgeStyles.communication;
        const isActive = lastActivity && (Date.now() - lastActivity) < 5000; // Active within last 5 seconds

        if (route.length === 0) {
            return this.renderDanglingEdge('Cannot compute route', edge, context);
        }

        return <g class-sprotty-edge={true} class-debug-edge={true} class-edge-active={isActive}>
            {/* Arrow marker definition */}
            <defs>
                <marker id={`arrowhead-${edgeType}`} markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={style.stroke} />
                </marker>

                {/* Activity pulse marker for active edges */}
                {isActive && (
                    <marker id={`pulse-${edgeType}`} markerWidth="12" markerHeight="12"
                        refX="6" refY="6" orient="auto">
                        <circle cx="6" cy="6" r="4" fill={style.stroke} opacity="0.7">
                            <animate attributeName="r" values="2;6;2" dur="1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite" />
                        </circle>
                    </marker>
                )}
            </defs>

            {/* Main edge path */}
            <path d={this.createPathForRoute(route)}
                fill="none"
                stroke={style.stroke}
                stroke-width={isActive ? "3" : style.strokeWidth}
                stroke-dasharray={style.strokeDasharray}
                marker-end={`url(#arrowhead-${edgeType})`}
                class-edge-path={true}
                opacity={isActive ? "1" : "0.8"}>

                {/* Activity animation */}
                {isActive && (
                    <animate attributeName="stroke-width" values="2;4;2" dur="1s" repeatCount="indefinite" />
                )}
            </path>

            {/* Debug info - edge type badge */}
            {route.length > 1 && route[Math.floor(route.length / 2)] && route[Math.floor(route.length / 2)].x !== undefined && (
                <g transform={`translate(${route[Math.floor(route.length / 2)].x}, ${route[Math.floor(route.length / 2)].y - 15})`}>
                    <rect x="-20" y="-8" width="40" height="16"
                        fill="white"
                        stroke={style.stroke}
                        stroke-width="1"
                        rx="8" />
                    <text x="0" y="3" text-anchor="middle" font-size="9" fill={style.stroke} font-weight="bold">
                        {edgeType.toUpperCase()}
                    </text>
                </g>
            )}

            {/* Creation timestamp (visible on hover) */}
            <title>
                {`${edgeType} edge created at ${new Date(createdAt).toLocaleString()}`}
                {lastActivity && ` | Last activity: ${new Date(lastActivity).toLocaleString()}`}
            </title>

            {/* Render children (labels) */}
            {edge.children && context.renderChildren(edge)}
        </g>;
    }

    private createPathForRoute(route: any[]): string {
        if (route.length === 0) return '';

        // Safety check for route points
        if (!route[0] || route[0].x === undefined || route[0].y === undefined) {
            return '';
        }

        let path = `M ${route[0].x} ${route[0].y}`;
        for (let i = 1; i < route.length; i++) {
            if (route[i] && route[i].x !== undefined && route[i].y !== undefined) {
                path += ` L ${route[i].x} ${route[i].y}`;
            }
        }
        return path;
    }
}