/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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

import { injectable } from 'inversify';
import { DiagramState, SModelRootSchema, SGraphSchema, IStateAwareModelProvider, SEdgeSchema, SLabelSchema } from "../../../src";

@injectable()
export class ModelProvider implements IStateAwareModelProvider {

    getModel(state?: DiagramState, currentRoot?: SModelRootSchema): SModelRootSchema {
        // Initialize model
        const node0 = {
            id: 'node0',
            type: 'node:class',
            expanded: false,
            position: {
                x: 100,
                y: 100
            },
            layout: 'vbox',
            children: [
                {
                    id: 'node0_header',
                    type: 'comp:header',
                    layout: 'hbox',
                    children: [
                        {
                            id: 'node0_icon',
                            type: 'icon',
                            layout: 'stack',
                            layoutOptions: {
                                hAlign: 'center',
                                resizeContainer: false
                            },
                            children: [
                                {
                                    id: 'node0_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                }
                            ]
                        },
                        {
                            id: 'node0_classname',
                            type: 'label:heading',
                            text: 'Foo'
                        }, {
                            id: 'node0_expand',
                            type: 'button:expand'
                        }
                    ]
                }
            ]
        };
        if (state !== undefined && state.expansionState.expandedElementIds.indexOf('node0') !== -1) {
            node0.expanded = true;
            node0.children.push({
                id: 'node0_attrs',
                type: 'comp:comp',
                layout: 'vbox',
                children: [
                    {
                        id: 'node0_op2',
                        type: 'label:text',
                        text: 'name: string'
                    }
                ],
            });
            node0.children.push({
                id: 'node0_ops',
                type: 'comp:comp',
                layout: 'vbox',
                children: [
                    {
                        id: 'node0_op0',
                        type: 'label:text',
                        text: '+ foo(): integer'
                    }, {
                        id: 'node0_op1',
                        type: 'label:text',
                        text: '# bar(x: string): void'
                    }
                ],
            });
        }
        const node1 = {
            id: 'node1',
            type: 'node:class',
            expanded: false,
            position: {
                x: 500,
                y: 200
            },
            layout: 'vbox',
            children: [
                {
                    id: 'node1_header',
                    type: 'comp:header',
                    layout: 'hbox',
                    children: [
                        {
                            id: 'node1_icon',
                            type: 'icon',
                            layout: 'stack',
                            layoutOptions: {
                                hAlign: 'center',
                                resizeContainer: false
                            },
                            children: [
                                {
                                    id: 'node1_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                },
                            ]
                        }, {
                        id: 'node1_classname',
                        type: 'label:heading',
                        text: 'Bar'
                    }, {
                        id: 'node1_expand',
                        type: 'button:expand'
                    }]
                }
            ]
        };
        if (state !== undefined && state.expansionState.expandedElementIds.indexOf('node1') !== -1) {
            node1.expanded = true;
            node1.children.push({
                id: 'node1_attrs',
                type: 'comp:comp',
                layout: 'vbox',
                children: [
                    {
                        id: 'node1_op2',
                        type: 'label:text',
                        text: 'name: string'
                    }
                ],
            });
            node1.children.push({
                id: 'node1_ops',
                type: 'comp:comp',
                layout: 'vbox',
                children: [
                    {
                        id: 'node1_op0',
                        type: 'label:text',
                        text: '+ foo(): Foo'
                    }

                ]
            });
        }
        const node2 = {
            id: 'node2',
            type: 'node:class',
            expanded: false,
            position: {
                x: 200,
                y: 350
            },
            layout: 'vbox',
            children: [
                {
                    id: 'node2_header',
                    type: 'comp:header',
                    layout: 'hbox',
                    children: [
                        {
                            id: 'node2_icon',
                            type: 'icon',
                            layout: 'stack',
                            layoutOptions: {
                                hAlign: 'center',
                                resizeContainer: false
                            },
                            children: [
                                {
                                    id: 'node2_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                },
                            ]
                        }, {
                        id: 'node2_classname',
                        type: 'label:heading',
                        text: 'Baz'
                    }, {
                        id: 'node2_expand',
                        type: 'button:expand'
                    }]
                }
            ]
        };
        const edge = {
            id: 'edge',
            type: 'edge:straight',
            sourceId: node0.id,
            targetId: node1.id,
            children: [
                <SLabelSchema> {
                    id: 'edge_label_on',
                    type: 'label:text',
                    text: 'on',
                    edgePlacement:  {
                        position: 0.5,
                        side: 'on',
                        rotate: false
                    }
                },
                <SLabelSchema> {
                    id: 'edge_label_top',
                    type: 'label:text',
                    text: 'top',
                    edgePlacement:  {
                        position: 0.3,
                        side: 'top',
                        rotate: false
                    }
                },
                <SLabelSchema> {
                    id: 'edge_label_bottom',
                    type: 'label:text',
                    text: 'bottom',
                    edgePlacement:  {
                        position: 0.3,
                        side: 'bottom',
                        rotate: false
                    }
                },
                <SLabelSchema> {
                    id: 'edge_label_left',
                    type: 'label:text',
                    text: 'left',
                    edgePlacement:  {
                        position: 0.7,
                        side: 'left',
                        rotate: false
                    }
                },
                <SLabelSchema> {
                    id: 'edge_label_right',
                    type: 'label:text',
                    text: 'right',
                    edgePlacement:  {
                        position: 0.7,
                        side: 'right',
                        rotate: false
                    }
                }
            ]
        } as SEdgeSchema;
        const edge1 = {
            id: 'edge1',
            type: 'edge:straight',
            sourceId: node0.id,
            targetId: node2.id,
            routerKind: 'manhattan',
            children: [
                <SLabelSchema> {
                    id: 'edge1_label_on',
                    type: 'label:text',
                    text: 'on',
                    edgePlacement:  {
                        position: 0.5,
                        side: 'on',
                        rotate: true
                    }
                },
                <SLabelSchema> {
                    id: 'edge1_label_top',
                    type: 'label:text',
                    text: 'top',
                    edgePlacement:  {
                        position: 0,
                        side: 'top',
                    }
                },
                <SLabelSchema> {
                    id: 'edge1_label_bottom',
                    type: 'label:text',
                    text: 'bottom',
                    edgePlacement:  {
                        position: 0,
                        side: 'bottom',
                    }
                },
                <SLabelSchema> {
                    id: 'edge1_label_left',
                    type: 'label:text',
                    text: 'left',
                    edgePlacement:  {
                        position: 1,
                        side: 'left'
                    }
                },
                <SLabelSchema> {
                    id: 'edge1_label_right',
                    type: 'label:text',
                    text: 'right',
                    edgePlacement:  {
                        position: 1,
                        side: 'right'
                    }
                }
            ]
        } as SEdgeSchema;
        const graph: SGraphSchema = {
            id: 'graph',
            type: 'graph',
            children: [node0, node1, node2, edge, edge1 ],
            layoutOptions: {
                hGap: 5,
                hAlign: 'left',
                paddingLeft: 7,
                paddingRight: 7,
                paddingTop: 7,
                paddingBottom: 7
            }
        };
        return graph;
    }
}
