/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
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
import { ActionHandlerRegistry, LocalModelSource } from 'sprotty';
import {
    Action, CollapseExpandAction, CollapseExpandAllAction, SCompartment, SEdge, SGraph, SLabel,
    SModelElement, SModelIndex, SModelRoot, SNode, Expandable, EdgeLayoutable
} from 'sprotty-protocol';

@injectable()
export class ClassDiagramModelSource extends LocalModelSource {

    expansionState: {[key: string]: boolean};

    constructor() {
        super();
        this.currentRoot = this.initializeModel();
    }

    override initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);
        registry.register(CollapseExpandAction.KIND, this);
        registry.register(CollapseExpandAllAction.KIND, this);
    }

    override handle(action: Action) {
        switch (action.kind) {
            case CollapseExpandAction.KIND:
                this.handleCollapseExpandAction(action as CollapseExpandAction);
                break;
            case CollapseExpandAllAction.KIND:
                this.handleCollapseExpandAllAction(action as CollapseExpandAllAction);
                break;
            default: super.handle(action);
        }
    }

    protected handleCollapseExpandAction(action: CollapseExpandAction): void {
        action.expandIds.forEach(id => this.expansionState[id] = true );
        action.collapseIds.forEach(id => this.expansionState[id] = false );
        this.applyExpansionState();
        this.updateModel();
    }

    protected handleCollapseExpandAllAction(action: CollapseExpandAllAction): void {
        for (const id in this.expansionState) {
            if (Object.prototype.hasOwnProperty.call(this.expansionState, id)) {
                this.expansionState[id] === action.expand;
            }
        }

        this.applyExpansionState();
        this.updateModel();
    }

    protected applyExpansionState() {
        const index = new SModelIndex();
        index.add(this.currentRoot);
        for (const id in this.expansionState) {
            if (Object.prototype.hasOwnProperty.call(this.expansionState, id)) {
                const element = index.getById(id);
                if (element && element.children) {
                    const expanded = this.expansionState[id];
                    (element as any).expanded = expanded;
                    element.children = element.children.filter(child => child.type !== 'comp:comp');
                    if (expanded)
                        this.addExpandedChildren(element);
                }
            }
        }
    }

    protected addExpandedChildren(element: SModelElement) {
        if (!element.children)
            return;
        switch (element.id) {
            case 'node0':
                element.children.push(<SCompartment> {
                    id: 'node0_attrs',
                    type: 'comp:comp',
                    layout: 'vbox',
                    children: [
                        <SLabel> {
                            id: 'node0_op2',
                            type: 'label:text',
                            text: 'name: string'
                        }
                    ],
                });
                element.children.push(<SModelElement> {
                    id: 'node0_ops',
                    type: 'comp:comp',
                    layout: 'vbox',
                    children: [
                        <SLabel> {
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
                break;
            case 'node2':
                element.children.push(<SCompartment> {
                    id: 'node2_attrs',
                    type: 'comp:comp',
                    layout: 'vbox',
                    children: [
                        <SLabel> {
                            id: 'node2_op2',
                            type: 'label:text',
                            text: 'name: string'
                        }
                    ],
                });
                element.children.push(<SCompartment> {
                    id: 'node2_ops',
                    type: 'comp:comp',
                    layout: 'vbox',
                    children: [
                        <SLabel> {
                            id: 'node2_op0',
                            type: 'label:text',
                            text: '+ foo(): Foo'
                        }
                    ]
                });
                break;
        }
    }

    initializeModel(): SModelRoot {
        const node0: SNode & Expandable = {
            id: 'node0',
            type: 'node:class',
            expanded: false,
            position: {
                x: 150,
                y: 150
            },
            layout: 'vbox',
            children: [
                <SCompartment>{
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
                                <SLabel>{
                                    id: 'node0_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                }
                            ]
                        },
                        <SLabel>{
                            id: 'node0_classname',
                            type: 'label:heading',
                            text: 'Foo'
                        },
                        {
                            id: 'node0_expand',
                            type: 'button:expand'
                        }
                    ]
                }
            ]
        };
        const node1: SNode & Expandable = {
            id: 'node1',
            type: 'node:class',
            expanded: false,
            position: {
                x: 50,
                y: 50
            },
            layout: 'vbox',
            children: [
                <SCompartment>{
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
                                <SLabel>{
                                    id: 'node1_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                }
                            ]
                        },
                        <SLabel>{
                            id: 'node1_classname',
                            type: 'label:heading',
                            text: 'Qux'
                        },
                        {
                            id: 'node1_expand',
                            type: 'button:expand'
                        }
                    ]
                }
            ]
        };
        const node2: SNode & Expandable = {
            id: 'node2',
            type: 'node:class',
            expanded: false,
            position: {
                x: 100,
                y: 100
            },
            layout: 'vbox',
            children: [
                <SCompartment>{
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
                                <SLabel>{
                                    id: 'node2_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                },
                            ]
                        },
                        <SLabel>{
                            id: 'node2_classname',
                            type: 'label:heading',
                            text: 'Bar'
                        },
                        {
                            id: 'node2_expand',
                            type: 'button:expand'
                        }
                    ]
                }
            ]
        };
        const node3: SNode & Expandable = {
            id: 'node3',
            type: 'node:class',
            expanded: false,
            position: {
                x: 270,
                y: 200
            },
            layout: 'vbox',
            children: [
                <SCompartment>{
                    id: 'node3_header',
                    type: 'comp:header',
                    layout: 'hbox',
                    children: [
                        {
                            id: 'node3_icon',
                            type: 'icon',
                            layout: 'stack',
                            layoutOptions: {
                                hAlign: 'center',
                                resizeContainer: false
                            },
                            children: [
                                <SLabel>{
                                    id: 'node3_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                },
                            ]
                        },
                        <SLabel>{
                            id: 'node3_classname',
                            type: 'label:heading',
                            text: 'Baz'
                        },
                        {
                            id: 'node3_expand',
                            type: 'button:expand'
                        }
                    ]
                }
            ]
        };
        const node4: SNode & Expandable = {
            id: 'node4',
            type: 'node:class',
            expanded: false,
            position: {
                x: 740,
                y: 25
            },
            layout: 'vbox',
            children: [
                <SCompartment>{
                    id: 'node4_header',
                    type: 'comp:header',
                    layout: 'hbox',
                    children: [
                        {
                            id: 'node4_icon',
                            type: 'icon',
                            layout: 'stack',
                            layoutOptions: {
                                hAlign: 'center',
                                resizeContainer: false
                            },
                            children: [
                                <SLabel>{
                                    id: 'node4_ticon',
                                    type: 'label:icon',
                                    text: 'C'
                                },
                            ]
                        },
                        <SLabel>{
                            id: 'node4_classname',
                            type: 'label:heading',
                            text: 'Ada'
                        },
                        {
                            id: 'node4_expand',
                            type: 'button:expand'
                        }
                    ]
                }
            ]
        };
        const package0: SNode = {
            id: 'package0',
            type: 'node:package',
            position: {
                x: 600,
                y: 160
            },
            size: {
                width: 400,
                height: 300
            },
            children: [
                <SLabel>{
                    id: 'package0_pkgname',
                    type: 'label:heading',
                    text: 'com.example.package0',
                    position: {
                        x: 10,
                        y: 10
                    }
                },
                <SCompartment>{
                    id: 'package0_content',
                    type: 'comp:pkgcontent',
                    children: [
                        node2, node3
                    ]
                }
            ]
        };
        const edge0 = {
            id: 'edge0',
            type: 'edge:straight',
            routerKind: 'manhattan',
            sourceId: node0.id,
            targetId: node1.id,
            children: []
        } as SEdge;
        const package1: SNode = {
            id: 'package1',
            type: 'node:package',
            position: {
                x: 60,
                y: 10
            },
            size: {
                width: 300,
                height: 250
            },
            children: [
                <SLabel>{
                    id: 'package1_pkgname',
                    type: 'label:heading',
                    text: 'com.example.package1',
                    position: {
                        x: 10,
                        y: 10
                    }
                },
                <SCompartment>{
                    id: 'package1_content',
                    type: 'comp:pkgcontent',
                    children: [
                        node0,
                        node1,
                        edge0
                    ]
                }
            ]
        };
        const edge1 = {
            id: 'edge1',
            type: 'edge:straight',
            routerKind: 'manhattan',
            sourceId: node0.id,
            targetId: node2.id,
            children: []
        } as SEdge;
        const edge2 = {
            id: 'edge2',
            type: 'edge:straight',
            sourceId: node2.id,
            targetId: node3.id,
            routerKind: 'manhattan',
            children: []
        } as SEdge;
        const edge3 = {
            id: 'edge3',
            type: 'edge:bezier',
            sourceId: node0.id,
            targetId: node4.id,
            routerKind: 'bezier',
            routingPoints: [
                { x: 360, y: 140 },
                { x: 390, y: 80 },
                { x: 450, y: 100 },
                { x: 490, y: 120 },
                { x: 550, y: 40 }
            ],
            children: [
                <SLabel & EdgeLayoutable> {
                    id: 'edge3_label_free1',
                    type: 'label:text',
                    text: 'free1',
                    edgePlacement:  {
                        position: 0.9,
                        offset: 10,
                        side: 'top',
                        rotate: false,
                        moveMode: 'free'
                    }
                },
                <SLabel & EdgeLayoutable> {
                    id: 'edge3_label_edge',
                    type: 'label:text',
                    text: 'edge',
                    edgePlacement:  {
                        position: 0.1,
                        offset: 0,
                        side: 'right',
                        rotate: true,
                        moveMode: 'edge'
                    }
                },
                <SLabel & EdgeLayoutable> {
                    id: 'edge3_label_fix',
                    type: 'label:text',
                    text: 'fix',
                    edgePlacement:  {
                        position: 0.3,
                        offset: 10,
                        side: 'left',
                        rotate: true,
                        moveMode: 'none'
                    }
                },
                <SLabel> {
                    id: 'edge3_label_free2',
                    type: 'label:text',
                    text: 'free2'
                }
            ]
        } as SEdge;
        const graph: SGraph = {
            id: 'graph',
            type: 'graph',
            children: [package0, package1, node4, edge1, edge2, edge3],
            layoutOptions: {
                hGap: 5,
                hAlign: 'left',
                paddingLeft: 7,
                paddingRight: 7,
                paddingTop: 7,
                paddingBottom: 7
            }
        };
        this.expansionState = {
            node0: false,
            node2: false,
            node3: false
        };
        return graph;
    }
}
