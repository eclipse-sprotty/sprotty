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
import { SNodeImpl, SLabelImpl, SEdgeImpl, SCompartmentImpl } from 'sprotty';
/**
 * Client Layout Node - optimized for micro-layout with rich content
 */
export declare class ClientLayoutNode extends SNodeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    layout: string;
    layoutOptions?: {
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        vGap?: number;
        hGap?: number;
        vAlign?: 'top' | 'center' | 'bottom';
        hAlign?: 'left' | 'center' | 'right';
    };
    title?: string;
    subtitle?: string;
    icon?: string;
    status?: 'online' | 'offline' | 'warning' | 'error';
    metadata?: Array<{
        key: string;
        value: string;
    }>;
}
/**
 * Server Layout Node - minimal content, positioned by server algorithms
 */
export declare class ServerLayoutNode extends SNodeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    nodeType?: 'service' | 'database' | 'client' | 'router' | 'gateway';
    layoutOptions?: {
        'elk.portConstraints'?: string;
        'elk.nodeLabels.placement'?: string;
        'elk.priority'?: number;
    };
    label?: string;
    category?: string;
}
/**
 * Hybrid Layout Node - combines client content layout with server positioning
 */
export declare class HybridLayoutNode extends SNodeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    layout: string;
    layoutOptions?: {
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        vGap?: number;
        hGap?: number;
    };
    serverLayoutOptions?: {
        'elk.portConstraints'?: string;
        'elk.priority'?: number;
    };
    title?: string;
    description?: string;
    icon?: string;
    properties?: Array<{
        name: string;
        value: string;
        type?: string;
    }>;
    nodeType?: 'service' | 'component' | 'interface';
    layer?: number;
}
/**
 * Compartment for organizing content within nodes
 */
export declare class LayoutCompartment extends SCompartmentImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    layout: string;
    layoutOptions?: {
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        vGap?: number;
        hGap?: number;
    };
    compartmentType?: 'header' | 'body' | 'footer' | 'properties' | 'actions';
}
/**
 * Smart Label - adjusts to layout context
 */
export declare class LayoutAwareLabel extends SLabelImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    labelType?: 'title' | 'subtitle' | 'property' | 'value' | 'caption';
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | 'light';
    color?: string;
    wrap?: boolean;
    maxWidth?: number;
    textAlignment?: 'left' | 'center' | 'right';
}
/**
 * Connection Edge - works with all layout strategies
 */
export declare class LayoutEdge extends SEdgeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    edgeType?: 'dependency' | 'communication' | 'inheritance' | 'association';
    style?: 'solid' | 'dashed' | 'dotted';
    color?: string;
    thickness?: number;
    layoutOptions?: {
        'elk.edgeRouting'?: string;
        'elk.priority'?: number;
    };
}
/**
 * Performance Monitor - tracks layout computation times
 */
export declare class PerformanceInfo {
    layoutStrategy: 'client' | 'server' | 'hybrid';
    clientLayoutTime?: number;
    serverLayoutTime?: number;
    totalLayoutTime?: number;
    nodeCount: number;
    edgeCount: number;
    boundsComputations: number;
}
/**
 * Layout Configuration - defines the active layout strategy
 */
export interface LayoutConfiguration {
    strategy: 'client' | 'server' | 'hybrid';
    clientLayoutEnabled: boolean;
    serverLayoutEnabled: boolean;
    debugMode: boolean;
    performanceMonitoring: boolean;
    clientOptions?: {
        defaultLayout: 'vbox' | 'hbox' | 'stack';
        defaultPadding: number;
        defaultGap: number;
    };
    serverOptions?: {
        algorithm: 'layered' | 'force' | 'stress' | 'mrtree' | 'radial';
        direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
        nodeSpacing: number;
        layerSpacing: number;
    };
}
//# sourceMappingURL=model.d.ts.map