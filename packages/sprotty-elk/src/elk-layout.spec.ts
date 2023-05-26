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

import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { Container } from 'inversify';
import ElkConstructor from 'elkjs/lib/elk.bundled';
import { SCompartment, SEdge, SGraph, SNode, SPort } from 'sprotty-protocol/lib/model';
import { ElkFactory, ElkLayoutEngine, ILayoutPreprocessor, elkLayoutModule } from './inversify';

describe('ElkLayoutEngine', () => {
    function createContainer() {
        const container = new Container();
        container.load(elkLayoutModule);
        container.bind(ElkFactory).toConstantValue(() => new ElkConstructor({
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
