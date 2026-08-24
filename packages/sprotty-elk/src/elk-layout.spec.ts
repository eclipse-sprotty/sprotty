/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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

import { expect, describe, it } from 'vitest';
import { Container } from 'inversify';
import ElkConstructor from 'elkjs';
import { LayoutOptions } from 'elkjs';
import { SCompartment, SEdge, SGraph, SLabel, SNode, SPort } from 'sprotty-protocol';
import { Point } from 'sprotty-protocol';
import { DefaultLayoutConfigurator, ElkFactory, ElkLayoutEngine, ILayoutConfigurator, ILayoutPreprocessor, elkLayoutModule } from './inversify.js';

/**
 * A layout configurator that enables cross-hierarchy edge routing, so an edge can connect a
 * deeply-nested node to a node inside another container. Used by the nested-nodes test below.
 */
class NestedLayoutConfigurator extends DefaultLayoutConfigurator {
    protected override graphOptions(): LayoutOptions {
        return {
            'org.eclipse.elk.algorithm': 'org.eclipse.elk.layered',
            'org.eclipse.elk.direction': 'RIGHT',
            'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'org.eclipse.elk.spacing.nodeNode': '80',
            'org.eclipse.elk.spacing.edgeNode': '20'
        };
    }
    protected override nodeOptions(): LayoutOptions {
        return {
            'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS MINIMUM_SIZE',
            'org.eclipse.elk.nodeSize.minimum': '(40, 40)',
            'org.eclipse.elk.nodeLabels.placement': 'INSIDE H_CENTER V_TOP',
            'org.eclipse.elk.padding': '[top=30,left=25,bottom=25,right=25]'
        };
    }
}

/** x of the point half-way along the polyline (by arc length) — i.e. `pointAt(0.5)`. */
function arcLengthMidpointX(points: Point[]): number {
    const seg: number[] = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        seg.push(d);
        total += d;
    }
    let target = total / 2;
    for (let i = 0; i < seg.length; i++) {
        if (target <= seg[i]) {
            const t = seg[i] === 0 ? 0 : target / seg[i];
            return points[i].x + t * (points[i + 1].x - points[i].x);
        }
        target -= seg[i];
    }
    return points[points.length - 1].x;
}

describe('ElkLayoutEngine', () => {
    function createContainer() {
        const container = new Container();
        container.load(elkLayoutModule);
        container.bind(ElkFactory).toConstantValue(() => new ElkConstructor.default({
            algorithms: ['layered']
        }));
        return container;
    }

    it('arranges a very simple graph', async () => {
        const graph: SGraph = {
            type: 'graph',
            id: 'graph',
            children: [
                <SNode> {
                    type: 'node',
                    id: 'node0',
                    size: { width: 10, height: 10 }
                },
                <SNode> {
                    type: 'node',
                    id: 'node1',
                    size: { width: 10, height: 10 }
                },
                <SEdge> {
                    type: 'edge',
                    id: 'edge0',
                    sourceId: 'node0',
                    targetId: 'node1'
                }
            ]
        };

        const container = createContainer();
        const elkEngine = container.get(ElkLayoutEngine);
        const result = await elkEngine.layout(graph);

        expect(result).to.deep.equal(<SGraph> {
            type: 'graph',
            id: 'graph',
            children: [
                <SNode> {
                    type: 'node',
                    id: 'node0',
                    position: { x: 12, y: 12 },
                    size: { width: 10, height: 10 }
                },
                <SNode> {
                    type: 'node',
                    id: 'node1',
                    position: { x: 42, y: 12 },
                    size: { width: 10, height: 10 }
                },
                <SEdge> {
                    type: 'edge',
                    id: 'edge0',
                    sourceId: 'node0',
                    targetId: 'node1',
                    routingPoints: [
                        { x: 22, y: 17 },
                        { x: 42, y: 17 }
                    ]
                }
            ]
        });
    });

    it('arranges a graph with ports', async () => {
        const graph: SGraph = {
            type: 'graph',
            id: 'graph',
            children: [
                <SNode> {
                    type: 'node',
                    id: 'node0',
                    size: { width: 10, height: 10 },
                    children: [
                        <SPort> {
                            type: 'port',
                            id: 'port0'
                        }
                    ]
                },
                <SNode> {
                    type: 'node',
                    id: 'node1',
                    size: { width: 10, height: 10 },
                    children: [
                        <SPort> {
                            type: 'port',
                            id: 'port1'
                        }
                    ]
                },
                <SEdge> {
                    type: 'edge',
                    id: 'edge0',
                    sourceId: 'port0',
                    targetId: 'port1'
                }
            ]
        };

        const container = createContainer();
        const elkEngine = container.get(ElkLayoutEngine);
        const result = await elkEngine.layout(graph);

        expect(result).to.deep.equal(<SGraph> {
            type: 'graph',
            id: 'graph',
            children: [
                <SNode> {
                    type: 'node',
                    id: 'node0',
                    position: { x: 12, y: 12 },
                    size: { width: 10, height: 10 },
                    children: [
                        <SPort> {
                            type: 'port',
                            id: 'port0',
                            position: { x: 10, y: 5 },
                            size: { height: 0, width: 0 }
                        }
                    ]
                },
                <SNode> {
                    type: 'node',
                    id: 'node1',
                    position: { x: 42, y: 12 },
                    size: { width: 10, height: 10 },
                    children: [
                        <SPort> {
                            type: 'port',
                            id: 'port1',
                            position: { x: -0, y: 5 },
                            size: { height: 0, width: 0 }
                        }
                    ]
                },
                <SEdge> {
                    type: 'edge',
                    id: 'edge0',
                    sourceId: 'port0',
                    targetId: 'port1',
                    routingPoints: [
                        { x: 22, y: 17 },
                        { x: 42, y: 17 }
                    ]
                }
            ]
        });
    });

    it('assigns an absolute position to an edge label (issue #514)', async () => {
        // Reproduces the minimal scenario from https://github.com/eclipse-sprotty/sprotty/issues/514:
        // two nodes with ports, one edge, and a `label:edge` child with no `edgePlacement`.
        // ELK is responsible for positioning that label; the engine-agnostic fix in
        // EdgeLayoutPostprocessor only kicks in when the label carries such a non-origin position.
        const graph: SGraph = {
            type: 'graph',
            id: 'graph',
            children: [
                <SNode> {
                    type: 'node',
                    id: 'node0',
                    size: { width: 30, height: 30 },
                    children: [
                        <SPort> { type: 'port', id: 'port0', size: { width: 8, height: 8 } }
                    ]
                },
                <SNode> {
                    type: 'node',
                    id: 'node1',
                    size: { width: 30, height: 30 },
                    children: [
                        <SPort> { type: 'port', id: 'port1', size: { width: 8, height: 8 } }
                    ]
                },
                <SEdge> {
                    type: 'edge',
                    id: 'edge0',
                    sourceId: 'port0',
                    targetId: 'port1',
                    children: [
                        <SLabel> {
                            type: 'label:edge',
                            id: 'edge0_label',
                            text: 'port0-->port1',
                            size: { width: 40, height: 12 }
                        }
                    ]
                }
            ]
        };

        const container = createContainer();
        const elkEngine = container.get(ElkLayoutEngine);
        const result = await elkEngine.layout(graph);

        const edge = (result as SGraph).children.find(c => c.id === 'edge0') as SEdge;
        const label = edge.children!.find(c => c.id === 'edge0_label') as SLabel;

        // ELK must give the label a real, absolute position (not the origin sentinel).
        // This is precisely the trigger that makes the postprocessor honor the engine position.
        expect(label.position).to.not.be.undefined;
        expect(label.position!.x !== 0 || label.position!.y !== 0).to.equal(true);
        expect(Number.isFinite(label.position!.x)).to.equal(true);
        expect(Number.isFinite(label.position!.y)).to.equal(true);
    });

    it('places a nested edge label in the free space between the outer nodes, not at the edge midpoint (issue #514)', async () => {
        // Reproduces the nested-nodes facet (issue #514, first/second images):
        // node "A" is nested deep inside a wide container "outerA" (which also holds the chain
        // A -> mid -> mid2); it connects to "B" inside "outerB". Because "outerA" is much wider
        // than the gap between the containers, the edge's geometric midpoint falls on top of
        // "outerA" — but ELK places the label center in the middle of the *free space* between
        // the two outer nodes. This locks in that behavior, which the engine-agnostic fix relies
        // on (it projects the label center onto the edge, keeping it in the gap).
        const withLabel = (id: string, text: string, w: number, h: number, lw: number, children: any[] = []): SNode => (<SNode>{
            type: 'node', id, size: { width: w, height: h },
            children: [<SLabel>{ type: 'label:node', id: `${id}_label`, text, size: { width: lw, height: 12 } }, ...children]
        });

        const graph: SGraph = {
            type: 'graph',
            id: 'graph',
            children: [
                withLabel('outerA', 'Outer A', 60, 60, 50, [
                    withLabel('innerA', 'A', 40, 40, 10),
                    withLabel('midA', 'mid', 40, 40, 20),
                    withLabel('mid2A', 'mid2', 40, 40, 24),
                    <SEdge>{ type: 'edge', id: 'ia_ma', sourceId: 'innerA', targetId: 'midA' },
                    <SEdge>{ type: 'edge', id: 'ma_m2a', sourceId: 'midA', targetId: 'mid2A' }
                ]),
                withLabel('outerB', 'Outer B', 60, 60, 50, [
                    withLabel('innerB', 'B', 40, 40, 10)
                ]),
                <SEdge>{
                    type: 'edge',
                    id: 'edge0',
                    sourceId: 'innerA',
                    targetId: 'innerB',
                    children: [
                        <SLabel>{ type: 'label:edge', id: 'edge0_label', text: 'A -> B', size: { width: 40, height: 12 } }
                    ]
                }
            ]
        };

        const container = new Container();
        container.load(elkLayoutModule);
        container.bind(ElkFactory).toConstantValue(() => new ElkConstructor.default({ algorithms: ['layered'] }));
        container.rebind(ILayoutConfigurator).to(NestedLayoutConfigurator).inSingletonScope();
        const elkEngine = container.get(ElkLayoutEngine);
        const result = await elkEngine.layout(graph) as SGraph;

        const outerA = result.children!.find(c => c.id === 'outerA') as SNode;
        const outerB = result.children!.find(c => c.id === 'outerB') as SNode;
        const edge = result.children!.find(c => c.id === 'edge0') as SEdge;
        const label = edge.children!.find(c => c.id === 'edge0_label') as SLabel;

        // outerA, outerB and the edge (with its label) are all direct children of the root graph,
        // so their positions share the same coordinate system.
        const outerARight = outerA.position!.x + outerA.size!.width;
        const outerBLeft = outerB.position!.x;
        const labelCenterX = label.position!.x + label.size!.width / 2;
        const midpointX = arcLengthMidpointX(edge.routingPoints!);

        // The label center sits in the free gap between the two outer nodes ...
        expect(labelCenterX).to.be.greaterThan(outerARight);
        expect(labelCenterX).to.be.lessThan(outerBLeft);
        // ... and clearly not at the edge's geometric midpoint, which is pulled left over outerA.
        expect(midpointX).to.be.lessThan(labelCenterX);
        expect(midpointX).to.be.lessThan(outerARight);
    });

    it('considers compartments for padding', async () => {
        const graph: SGraph = {
            type: 'graph',
            id: 'graph',
            children: [
                // Node with a child node in a compartment
                <SNode> {
                    type: 'node',
                    id: 'node0',
                    size: { width: 10, height: 10 },
                    layout: 'test',
                    children: [
                        <SCompartment> {
                            type: 'compartment',
                            id: 'compartment0',
                            position: { x: 5, y: 5 },
                            size: { width: 0, height: 0 },
                            children: [
                                <SNode> {
                                    type: 'node',
                                    id: 'node1',
                                    size: { width: 10, height: 10 }
                                }
                            ]
                        }
                    ]
                },
                // Node with a child node in two nested compartments
                <SNode> {
                    type: 'node',
                    id: 'node2',
                    size: { width: 27, height: 25 },
                    layout: 'test',
                    children: [
                        <SCompartment> {
                            type: 'compartment',
                            id: 'compartment1',
                            position: { x: 2, y: 1 },
                            size: { width: 21, height: 21 },
                            layout: 'test',
                            children: [
                                <SCompartment> {
                                    type: 'compartment',
                                    id: 'compartment2',
                                    position: { x: 10, y: 10 },
                                    size: { width: 1, height: 1 },
                                    children: [
                                        <SNode> {
                                            type: 'node',
                                            id: 'node3',
                                            size: { width: 10, height: 10 }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        // Capture the computed padding settings with a preprocessor
        let padding1: string | undefined;
        let padding2: string | undefined;
        const preprocessor: ILayoutPreprocessor = {
            preprocess: (elkNode) => {
                padding1 = elkNode.children![0].layoutOptions!['org.eclipse.elk.padding'];
                padding2 = elkNode.children![1].layoutOptions!['org.eclipse.elk.padding'];
            }
        };
        const container = createContainer();
        container.bind(ILayoutPreprocessor).toConstantValue(preprocessor);
        const elkEngine = container.get(ElkLayoutEngine);
        const result = await elkEngine.layout(graph);

        expect(padding1).to.equal('[top=5,left=5,bottom=5,right=5]');
        expect(padding2).to.equal('[top=11,left=12,bottom=13,right=14]');
        expect((result as any).children[0].size.width).to.equal(20);
        expect((result as any).children[0].size.height).to.equal(20);
        expect((result as any).children[1].size.width).to.equal(36);
        expect((result as any).children[1].size.height).to.equal(34);
    });
});
