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

 /** @jsx svg */
import { svg } from '../lib/jsx';

import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { Container } from 'inversify';
import { VNode } from 'snabbdom';
import { TYPES } from '../base/types';
import { IVNodePostprocessor } from '../base/views/vnode-postprocessor';
import { CircularNodeView, RectangularNodeView } from '../lib/svg-views';
import { CircularNode, RectangularNode, RectangularPort } from '../lib/model';
import { RenderingContext, configureView, ViewRegistry, configureModelElement } from '../base/views/view';
import { ModelRendererFactory } from '../base/views/viewer';
import { PolylineEdgeView, SGraphView } from './views';
import { SModelElementImpl, SParentElementImpl } from '../base/model/smodel';
import { IModelFactory, SModelElementRegistration } from '../base/model/smodel-factory';
import defaultModule from '../base/di.config';
import selectModule from '../features/select/di.config';
import moveModule from '../features/move/di.config';
import { SEdgeImpl, SGraphImpl, SNodeImpl, SPortImpl } from './sgraph';
import routingModule from '../features/routing/di.config';

import toHTML from 'snabbdom-to-html';
import { SEdge, SNode, SPort } from 'sprotty-protocol';

describe('graph views', () => {
    class CircleNodeView extends CircularNodeView {
        override render(node: SNodeImpl, renderContext: RenderingContext): VNode {
            const radius = this.getRadius(node);
            return <g>
                    <circle class-sprotty-node={true} class-selected={node.selected} r={radius} cx={radius} cy={radius} />
                </g>;
        }
        protected override getRadius(node: SNodeImpl) {
            return 40;
        }
    }

    const container = new Container();
    container.load(defaultModule, selectModule, moveModule, routingModule);

    configureModelElement(container, 'graph', SGraphImpl, SGraphView);
    configureModelElement(container, 'node:circle', CircularNode, CircleNodeView);
    configureModelElement(container, 'edge:straight', SEdgeImpl, PolylineEdgeView);
    configureModelElement(container, 'port', SPortImpl, RectangularNodeView);

    const postprocessors = container.getAll<IVNodePostprocessor>(TYPES.IVNodePostprocessor);
    const context = container.get<ModelRendererFactory>(TYPES.ModelRendererFactory)('hidden', postprocessors);
    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);
    const viewRegistry = container.get<ViewRegistry>(TYPES.ViewRegistry);

    it('render an empty graph', () => {
        const schema = {
            type: 'graph',
            id: 'mygraph',
            children: []
        };
        const graph = graphFactory.createRoot(schema) as SGraphImpl;
        const view = viewRegistry.get(graph.type);
        const vnode = view.render(graph, context);
        expect(toHTML(vnode)).to.be.equal('<svg class="sprotty-graph"><g transform="scale(1) translate(0,0)"></g></svg>');
    });

    function createModel() {
        const node0 = { id: 'node0', type: 'node:circle', position: { x: 100, y: 100 }, size: { width: 80, height: 80 } };
        const node1 = { id: 'node1', type: 'node:circle', position: { x: 200, y: 150 }, size: { width: 80, height: 80 }, selected: true };
        const edge0 = { id: 'edge0', type: 'edge:straight', sourceId: 'node0', targetId: 'node1' };
        const graph = graphFactory.createRoot({ id: 'graph', type: 'graph', children: [node0, node1, edge0] }) as SGraphImpl;
        return graph;
    }

    it('render a straight edge', () => {
        const graph = createModel();

        const view = viewRegistry.get('edge:straight');
        const vnode = view.render(graph.index.getById('edge0') as SEdgeImpl, context);
        expect(toHTML(vnode)).to.be.equal(
            '<g class="sprotty-edge"><path d="M 175.77708763999664,157.88854381999832 L 204.22291236000336,172.11145618000168" /></g>');
    });

    it('render a circle node', () => {
        const graph = createModel();
        const view = viewRegistry.get('node:circle');
        const vnode = view.render(graph.index.getById('node0') as SNodeImpl, context);
        expect(toHTML(vnode)).to.be.equal('<g><circle class="sprotty-node" r="40" cx="40" cy="40" /></g>');
    });

    it('render a whole graph', () => {
        const graph = createModel();
        const vnode = context.renderElement(graph);
        const expectation = '<svg id="sprotty_graph" class="sprotty-graph" tabindex="0">'
            + '<g transform="scale(1) translate(0,0)">'
            +   '<g id="sprotty_node0" class="circle" transform="translate(100, 100)">'
            +     '<circle class="sprotty-node" r="40" cx="40" cy="40" />'
            +   '</g>'
            +   '<g id="sprotty_node1" class="circle selected" transform="translate(200, 150)">'
            +     '<circle class="sprotty-node selected" r="40" cx="40" cy="40" />'
            +   '</g>'
            +   '<g id="sprotty_edge0" class="sprotty-edge straight">'
            +     '<path d="M 175.77708763999664,157.88854381999832 L 204.22291236000336,172.11145618000168" />'
            +   '</g>'
            + '</g>'
            + '</svg>';
        expect(toHTML(vnode)).to.be.equal(expectation);
    });
});

describe('PolylineEdgeView', () => {
    const container = new Container();
    container.load(defaultModule, routingModule);

    configureModelElement(container, 'graph', SGraphImpl, SGraphView);
    configureModelElement(container, 'node', RectangularNode, RectangularNodeView);
    configureModelElement(container, 'edge', SEdgeImpl, PolylineEdgeView);
    configureModelElement(container, 'edge:straight', SEdgeImpl, PolylineEdgeView);
    configureModelElement(container, 'port', RectangularPort, RectangularNodeView);

    const factory = container.get<IModelFactory>(TYPES.IModelFactory);
    const model = factory.createRoot({
        type: 'graph',
        id: 'graph',
        children: [
            {
                type: 'node',
                id: 'node1',
                position: { x: 10, y: 10 },
                size: { width: 10, height: 10 },
                children: [
                    {
                        type: 'port',
                        id: 'port1',
                        position: { x: 10, y: 4 }
                    } as SPort,
                    {
                        type: 'edge',
                        id: 'edge1',
                        sourceId: 'port1',
                        targetId: 'port2'
                    } as SEdge
                ]
            } as SNode,
            {
                type: 'node',
                id: 'node2',
                position: { x: 30, y: 20 },
                size: { width: 10, height: 10 },
                children: [
                    {
                        type: 'port',
                        id: 'port2',
                        position: { x: -2, y: 4 }
                    } as SPort,
                    {
                        type: 'edge',
                        id: 'edge2',
                        sourceId: 'port1',
                        targetId: 'port2'
                    } as SEdge
                ]
            } as SNode,
        ]
    });

    const viewRegistry = container.get<ViewRegistry>(TYPES.ViewRegistry);
    const edgeView = viewRegistry.get('edge:straight');
    const context = {
        targetKind: 'hidden',
        viewRegistry,
        decorate: function(vnode: VNode, element: SModelElementImpl): VNode { return vnode; },
        renderElement: function(element: SModelElementImpl): VNode { return <g></g>; },
        renderChildren: function(element: SParentElementImpl): VNode[] { return []; }
    } as RenderingContext;

    it('correctly translates edge source and target position', () => {
        const edge = model.index.getById('edge1') as SEdgeImpl;
        const vnode = edgeView.render(edge, context);
        expect(toHTML(vnode)).to.equal('<g class="sprotty-edge"><path d="M 10,4 L 18,14" /></g>');
    });

    it('correctly translates edge target and source position', () => {
        const edge = model.index.getById('edge2') as SEdgeImpl;
        const vnode = edgeView.render(edge, context);
        expect(toHTML(vnode)).to.equal('<g class="sprotty-edge"><path d="M -10,-6 L -2,4" /></g>');
    });
});
