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

import {
    SNodeImpl,
    SEdgeImpl,
    selectFeature,
    moveFeature,
    hoverFeedbackFeature,
    fadeFeature,
    layoutContainerFeature,
    boundsFeature
} from 'sprotty';

/**
 * Client Layout Node - optimized for micro-layout with rich content
 */
export class ClientLayoutNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        moveFeature,
        hoverFeedbackFeature,
        fadeFeature,
        layoutContainerFeature,
        boundsFeature
    ];

    // Layout configuration
    override layout: string = 'vbox';
    override layoutOptions?: {
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        vGap?: number;
        hGap?: number;
        vAlign?: 'top' | 'center' | 'bottom';
        hAlign?: 'left' | 'center' | 'right';
    };

    // Content properties
    title?: string;
    subtitle?: string;
    icon?: string;
    status?: 'online' | 'offline' | 'warning' | 'error';
    metadata?: Array<{ key: string; value: string }>;
}

/**
 * Server Layout Node - minimal content, positioned by server algorithms
 */
export class ServerLayoutNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        moveFeature,
        hoverFeedbackFeature,
        fadeFeature,
        boundsFeature
    ];

    // Node type for layout algorithm hints
    nodeType?: 'service' | 'database' | 'client' | 'router' | 'gateway';

    // Layout constraints for server algorithms
    override layoutOptions?: {
        'elk.portConstraints'?: string;
        'elk.nodeLabels.placement'?: string;
        'elk.priority'?: number;
    };

    // Simple content
    label?: string;
    category?: string;
}

/**
 * Hybrid Layout Node - combines client content layout with server positioning
 */
export class HybridLayoutNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        moveFeature,
        hoverFeedbackFeature,
        fadeFeature,
        layoutContainerFeature,
        boundsFeature
    ];

    // Client layout for internal content
    override layout: string = 'vbox';
    override layoutOptions?: {
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        vGap?: number;
        hGap?: number;
    };

    // Server layout constraints
    serverLayoutOptions?: {
        'elk.portConstraints'?: string;
        'elk.priority'?: number;
    };

    // Rich content (client-managed)
    title?: string;
    description?: string;
    icon?: string;
    properties?: Array<{ name: string; value: string; type?: string }>;

    // Network properties (server-managed)
    nodeType?: 'service' | 'component' | 'interface';
    layer?: number;
}

/**
 * Connection Edge - works with all layout strategies
 */
export class LayoutEdge extends SEdgeImpl {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        hoverFeedbackFeature,
        fadeFeature
    ];

    // Edge styling
    edgeType?: 'dependency' | 'communication' | 'inheritance' | 'association';
    style?: 'solid' | 'dashed' | 'dotted';
    color?: string;
    thickness?: number;

    // Layout hints for server algorithms
    layoutOptions?: {
        'elk.edgeRouting'?: string;
        'elk.priority'?: number;
    };
}


/**
 * Layout Configuration - defines the active layout strategy
 */
export interface LayoutConfiguration {
    strategy: 'client' | 'server' | 'hybrid';
    clientLayoutEnabled: boolean;
    serverLayoutEnabled: boolean;

    // Client layout options
    clientOptions?: {
        defaultLayout: 'vbox' | 'hbox' | 'stack';
        defaultPadding: number;
        defaultGap: number;
    };

    // Server layout options
    serverOptions?: {
        algorithm: 'layered' | 'force' | 'stress' | 'mrtree' | 'radial';
        direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
        nodeSpacing: number;
        layerSpacing: number;
    };
}
