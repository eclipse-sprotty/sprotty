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

import { SEdge, SGraph, SNode, SLabel } from 'sprotty-protocol';

/**
 * Extended edge interface with custom properties for demonstrations
 */
export interface CustomEdge extends SEdge {
    edgeType?: EdgeType;
    arrowType?: ArrowType;
    strokeStyle?: StrokeStyle;
    customColor?: string;
}

/**
 * Extended node interface with anchor type
 */
export interface CustomNode extends SNode {
    anchorKind?: string;
    shape?: NodeShape;
    nodeType?: string;
}

/**
 * Edge type definitions for different semantic meanings
 */
export type EdgeType =
    | 'normal'
    | 'dependency'
    | 'composition'
    | 'aggregation'
    | 'association'
    | 'inheritance';

/**
 * Arrow decoration types
 */
export type ArrowType =
    | 'standard'
    | 'hollow'
    | 'diamond'
    | 'hollow-diamond'
    | 'circle'
    | 'none';

/**
 * Stroke style options
 */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Node shape types
 */
export type NodeShape = 'rectangle' | 'circle' | 'hexagon' | 'diamond';

/**
 * Router types available in the showcase
 */
export type RouterType = 'polyline' | 'manhattan' | 'bezier' | 'arc' | 'step';

/**
 * Create a standard node
 */
function createNode(
    id: string,
    x: number,
    y: number,
    shape: NodeShape,
    anchorKind: string
): CustomNode {
    const sizes: Record<NodeShape, { width: number; height: number }> = {
        rectangle: { width: 100, height: 60 },
        circle: { width: 80, height: 80 },
        hexagon: { width: 90, height: 90 },
        diamond: { width: 80, height: 80 }
    };

    const size = sizes[shape];

    return {
        id,
        type: `node:${shape}`,
        position: { x, y },
        size,
        anchorKind,
        shape,
        children: [
            {
                id: `${id}-label`,
                type: 'label:node',
                text: id.toUpperCase()
            } as SLabel
        ]
    };
}

/**
 * Create an edge with custom properties
 */
function createEdge(
    id: string,
    sourceId: string,
    targetId: string,
    routerKind: string,
    edgeType: EdgeType,
    arrowType: ArrowType
): CustomEdge {
    return {
        id,
        type: `edge:${routerKind}`,
        sourceId,
        targetId,
        routerKind,
        edgeType,
        arrowType,
        strokeStyle: getStrokeStyleForType(edgeType)
    };
}

/**
 * Get stroke style based on edge type
 */
function getStrokeStyleForType(edgeType: EdgeType): StrokeStyle {
    switch (edgeType) {
        case 'dependency':
            return 'dashed';
        case 'association':
            return 'dotted';
        default:
            return 'solid';
    }
}

/**
 * Create a simple comparison model with one router type
 */
export function createComparisonModel(routerType: RouterType): SGraph {
    const nodes = [
        createNode('src', 100, 100, 'rectangle', 'rectangular'),   // center: 150, 130
        createNode('tgt1', 300, 50, 'rectangle', 'rectangular'),   // center: 350, 80
        createNode('tgt2', 300, 150, 'rectangle', 'rectangular'),  // center: 350, 180
        createNode('tgt3', 500, 100, 'circle', 'elliptic'),        // center: 540, 140
    ];

    const edges = [
        createEdge('e1', 'src', 'tgt1', routerType, 'normal', 'standard'),
        createEdge('e2', 'src', 'tgt2', routerType, 'normal', 'standard'),
        createEdge('e3', 'tgt1', 'tgt3', routerType, 'normal', 'standard'),
        createEdge('e4', 'tgt2', 'tgt3', routerType, 'normal', 'standard'),
    ];

    // Add routing points for bezier edges
    if (routerType === 'bezier') {
        // e1: src (150,130) -> tgt1 (350,80)
        edges[0].routingPoints = [
            { x: 225, y: 130 },  // control after source (1/3 along X, same Y)
            { x: 275, y: 80 }    // control before target (2/3 along X, same Y)
        ];

        // e2: src (150,130) -> tgt2 (350,180)
        edges[1].routingPoints = [
            { x: 225, y: 130 },
            { x: 275, y: 180 }
        ];

        // e3: tgt1 (350,80) -> tgt3 (540,140)
        edges[2].routingPoints = [
            { x: 410, y: 80 },
            { x: 480, y: 140 }
        ];

        // e4: tgt2 (350,180) -> tgt3 (540,140)
        edges[3].routingPoints = [
            { x: 410, y: 180 },
            { x: 480, y: 140 }
        ];
    }

    return {
        id: 'graph',
        type: 'graph',
        children: [...nodes, ...edges]
    };
}

/**
 * Create intersection demonstration model
 */
export function createIntersectionModel(useJumps: boolean): SGraph {
    const edgeType = useJumps ? 'edge:jumping' : 'edge:gaps';

    return {
        id: 'graph',
        type: 'graph',
        children: [
            createNode('n1', 50, 100, 'rectangle', 'rectangular'),
            createNode('n2', 550, 100, 'rectangle', 'rectangular'),
            createNode('n3', 300, 50, 'rectangle', 'rectangular'),
            createNode('n4', 300, 250, 'rectangle', 'rectangular'),

            {
                ...createEdge('e1', 'n1', 'n2', 'polyline', 'normal', 'standard'),
                type: edgeType
            },
            {
                ...createEdge('e2', 'n3', 'n4', 'polyline', 'normal', 'standard'),
                type: edgeType
            }
        ]
    };
}

