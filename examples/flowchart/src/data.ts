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

import {
    Decision,
    Process,
    Terminal
} from "sprotty-library";
import { SEdge, SGraph, SLabel, SModelRoot, SNode } from "sprotty-protocol";

export function initializeModel(): SModelRoot {
    const nodes: SNode[] = [];
    const edges: SEdge[] = [];

    const node0: Terminal = {
        id: '0',
        type: 'node:terminal',
        position: { x: 150, y: 10 },
        children: [
            <SLabel>{
                id: '0_label',
                text: 'Start',
                type: 'label',
            }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }
    };
    nodes.push(node0);

    const node1: Process = {
        id: '1',
        type: 'node:process',
        position: { x: 109.15, y: 153.9 },
        children: [<SLabel>{
            id: '1_label',
            text: 'Patient arrives',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }
    };
    nodes.push(node1);

    const node2: Decision = {
        id: '2',
        type: 'node:decision',
        position: { x: 71.4, y: 297.8 },
        children: [<SLabel>{
            id: '2_label',
            text: 'Registered patient',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 40,
            paddingRight: 40,
            minHeight: 100
        }

    };
    nodes.push(node2);

    const node3: Process = {
        id: '3',
        type: 'node:process',
        position: { x: 102.35, y: 517.8 },
        children: [<SLabel>{
            id: '3_label',
            text: 'Register patient',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }
    };
    nodes.push(node3);

    const node4: Decision = {
        id: '4',
        type: 'node:decision',
        position: { x: 411.1, y: 297.8 },
        children: [<SLabel>{
            id: '4_label',
            text: 'Available nurse',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 40,
            paddingRight: 40,
            minHeight: 100
        }

    };
    nodes.push(node4);

    const node5: Process = {
        id: '5',
        type: 'node:process',
        position: { x: 395.7, y: 517.8 },
        children: [<SLabel>{
            id: '5_label',
            text: 'Wait for available nurse',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node5);

    const node6: Process = {
        id: '6',
        type: 'node:process',
        position: { x: 722.3, y: 335.85 },
        children: [<SLabel>{
            id: '6_label',
            text: 'Record health condition',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node6);

    const node7: Decision = {
        id: '7',
        type: 'node:decision',
        position: { x: 736, y: 479.75 },
        children: [<SLabel>{
            id: '7_label',
            text: 'Available doctor',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 40,
            paddingRight: 40,
            minHeight: 100
        }

    };
    nodes.push(node7);

    const node8: Process = {
        id: '8',
        type: 'node:process',
        position: { x: 720.5, y: 699.75 },
        children: [<SLabel>{
            id: '8_label',
            text: 'Wait for available doctor',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node8);

    const node9: Process = {
        id: '9',
        type: 'node:process',
        position: { x: 1055.7, y: 517.8 },
        children: [<SLabel>{
            id: '9_label',
            text: 'Assign patient to doctor',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node9);

    const node10: Decision = {
        id: '10',
        type: 'node:decision',
        position: { x: 1074.9, y: 661.7 },
        children: [<SLabel>{
            id: '10_label',
            text: 'Need follow up',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 40,
            paddingRight: 40,
            minHeight: 100
        }

    };
    nodes.push(node10);

    const node11: Decision = {
        id: '11',
        type: 'node:decision',
        position: { x: 1065.75, y: 881.7 },
        children: [<SLabel>{
            id: '11_label',
            text: 'Need medication',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 40,
            paddingRight: 40,
            minHeight: 100
        }

    };
    nodes.push(node11);

    const node12: Process = {
        id: '12',
        type: 'node:process',
        position: { x: 1099.7, y: 1101.7 },
        children: [<SLabel>{
            id: '12_label',
            text: 'Patient leaves',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node12);

    const node13: Terminal = {
        id: '13',
        type: 'node:terminal',
        position: { x: 1143.25, y: 1245.6 },
        children: [<SLabel>{
            id: '13_label',
            text: 'End',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node13);

    const node14: Process = {
        id: '14',
        type: 'node:process',
        position: { x: 1385.4, y: 699.75 },
        children: [<SLabel>{
            id: '14_label',
            text: 'Arrange appointment',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node14);

    const node15: Process = {
        id: '15',
        type: 'node:process',
        position: { x: 1386.1, y: 919.75 },
        children: [<SLabel>{
            id: '15_label',
            text: 'Prescribe medication',
            type: 'label'
        }],
        layout: 'stack',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }

    };
    nodes.push(node15);

    const edge0: SEdge = {
        id: '0-1',
        type: 'edge',
        sourceId: '0',
        targetId: '1',
        routerKind: 'manhattan'
    };
    edges.push(edge0);

    const edge1: SEdge = {
        id: '1-2',
        type: 'edge',
        sourceId: '1',
        targetId: '2',
        routerKind: 'manhattan',
    };
    edges.push(edge1);

    const edge2: SEdge = {
        id: '2-3',
        type: 'edge',
        sourceId: '2',
        targetId: '3',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '2-3_label',
            text: 'No',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge2);

    const edge3: SEdge = {
        id: '3-2',
        type: 'edge',
        sourceId: '3',
        targetId: '2',
        routerKind: 'manhattan',
        routingPoints: [{ x: 52.35, y: 539.75 }, { x: 52.35, y: 357.8 }],
    };
    edges.push(edge3);

    const edge4: SEdge = {
        id: '2-4',
        type: 'edge',
        sourceId: '2',
        targetId: '4',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '2-4_label',
            text: 'Yes',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge4);

    const edge5: SEdge = {
        id: '4-5',
        type: 'edge',
        sourceId: '4',
        targetId: '5',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '4-5_label',
            text: 'No',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge5);

    const edge6: SEdge = {
        id: '5-4',
        type: 'edge',
        sourceId: '5',
        targetId: '4',
        routerKind: 'manhattan',
        routingPoints: [{ x: 362, y: 539.75 }, { x: 362, y: 357.8 }],
    };
    edges.push(edge6);

    const edge7: SEdge = {
        id: '4-6',
        type: 'edge',
        sourceId: '4',
        targetId: '6',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '4-6_label',
            text: 'Yes',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge7);

    const edge8: SEdge = {
        id: '6-7',
        type: 'edge',
        sourceId: '6',
        targetId: '7',
        routerKind: 'manhattan',
    };
    edges.push(edge8);

    const edge9: SEdge = {
        id: '7-8',
        type: 'edge',
        sourceId: '7',
        targetId: '8',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '7-8_label',
            text: 'No',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge9);

    const edge10: SEdge = {
        id: '8-7',
        type: 'edge',
        sourceId: '8',
        targetId: '7',
        routerKind: 'manhattan',
        routingPoints: [{ x: 670.5, y: 721.7 }, { x: 670.5, y: 539.75 }],
    };
    edges.push(edge10);

    const edge11: SEdge = {
        id: '7-9',
        type: 'edge',
        sourceId: '7',
        targetId: '9',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '7-9_label',
            text: 'Yes',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge11);

    const edge12: SEdge = {
        id: '9-10',
        type: 'edge',
        sourceId: '9',
        targetId: '10',
        routerKind: 'manhattan',
    };
    edges.push(edge12);

    const edge13: SEdge = {
        id: '10-11',
        type: 'edge',
        sourceId: '10',
        targetId: '11',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '10-11_label',
            text: 'No',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge13);

    const edge14: SEdge = {
        id: '11-12',
        type: 'edge',
        sourceId: '11',
        targetId: '12',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '11-12_label',
            text: 'No',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge14);

    const edge15: SEdge = {
        id: '12-13',
        type: 'edge',
        sourceId: '12',
        targetId: '13',
        routerKind: 'manhattan',
    };
    edges.push(edge15);

    const edge16: SEdge = {
        id: '10-14',
        type: 'edge',
        sourceId: '10',
        targetId: '14',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '10-14_label',
            text: 'Yes',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge16);

    const edge17: SEdge = {
        id: '14-11',
        type: 'edge',
        sourceId: '14',
        targetId: '11',
        routerKind: 'manhattan',
        routingPoints: [{ x: 1498.3, y: 831.7 }, { x: 1180.15, y: 831.7 }],
    };
    edges.push(edge17);

    const edge18: SEdge = {
        id: '11-15',
        type: 'edge',
        sourceId: '11',
        targetId: '15',
        routerKind: 'manhattan',
        children: [<SLabel>{
            id: '11-15_label',
            text: 'Yes',
            type: 'label:edge',
            edgePlacement: {
                position: 0.5,
                side: 'on',
                rotate: false
            }
        }]
    };
    edges.push(edge18);

    const edge19: SEdge = {
        id: '15-12',
        type: 'edge',
        sourceId: '15',
        targetId: '12',
        routerKind: 'manhattan',
        routingPoints: [{ x: 1498.3, y: 1051.7 }, { x: 1180.15, y: 1051.7 }],
    };
    edges.push(edge19);

    const graph: SGraph = {
        id: 'graph',
        type: 'graph',
        children: [...nodes, ...edges],
    };

    return graph;
}
