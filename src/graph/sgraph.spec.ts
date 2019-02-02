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

import "mocha";
import { expect } from "chai";
import { SRoutingHandle } from '../features/routing/model';
import { RectangularNode, RectangularPort } from '../lib/model';
import { SNode, SEdge, SGraph, SPort } from './sgraph';
import { RoutedPoint } from "../features/routing/routing";
import { PolylineEdgeRouter } from "../features/routing/polyline-edge-router";
import { Container } from "inversify";
import { AnchorComputerRegistry } from "../features/routing/anchor";
import { RectangleAnchor } from "../features/routing/polyline-anchors";
import { TYPES } from "../base/types";
import routingModule from "../features/routing/di.config";

describe('SEdge', () => {
    const graph = new SGraph();
    const source = new SNode();
    source.id = 'node0';
    source.position = { x: 10, y: 10 };
    source.size = { width: 0, height: 0 };
    graph.add(source);
    const target = new SNode();
    target.id = 'node1';
    target.position = { x: 20, y: 20 };
    target.size = { width: 0, height: 0 };
    graph.add(target);
    const edge = new SEdge();
    edge.id = 'edge0';
    edge.sourceId = 'node0';
    edge.targetId = 'node1';
    graph.add(edge);
    const container = new Container();
    container.load(routingModule);
    const router = container.get<PolylineEdgeRouter>(PolylineEdgeRouter);

    it('computes a simple route', () => {
        edge.routingPoints = [{ x: 14, y: 12 }, { x: 16, y: 18 }];
        const route = router.route(edge);
        expect(route).to.deep.equal(<RoutedPoint[]>[
            { x: 10, y: 10, kind: 'source' },
            { x: 14, y: 12, kind: 'linear', pointIndex: 0 },
            { x: 16, y: 18, kind: 'linear', pointIndex: 1 },
            { x: 20, y: 20, kind: 'target' }
        ]);
    });

    it('skips a routing handle that is dragged for removal', () => {
        edge.routingPoints = [{ x: 12, y: 15 }, { x: 15, y: 15 }, { x: 18, y: 15 }];
        router.createRoutingHandles(edge);
        const route1 = router.route(edge);
        expect(route1).to.deep.equal(<RoutedPoint[]>[
            { x: 10, y: 10, kind: 'source' },
            { x: 12, y: 15, kind: 'linear', pointIndex: 0 },
            { x: 15, y: 15, kind: 'linear', pointIndex: 1 },
            { x: 18, y: 15, kind: 'linear', pointIndex: 2 },
            { x: 20, y: 20, kind: 'target' }
        ]);
        const handle1 = edge.children.find(child => (child as SRoutingHandle).pointIndex === 1) as SRoutingHandle;
        handle1.editMode = true;
        const route2 = router.route(edge);
        expect(route2).to.deep.equal(<RoutedPoint[]>[
            { x: 10, y: 10, kind: 'source' },
            { x: 12, y: 15, kind: 'linear', pointIndex: 0 },
            { x: 18, y: 15, kind: 'linear', pointIndex: 2 },
            { x: 20, y: 20, kind: 'target' }
        ]);
    });
});

describe('SGraphIndex', () => {
    function setup() {
        const root = new SGraph();
        const node1 = new SNode();
        node1.id = 'node1';
        root.add(node1);
        const node2 = new SNode();
        node2.id = 'node2';
        root.add(node2);
        const edge1 = new SEdge();
        edge1.id = 'edge1';
        edge1.sourceId = node1.id;
        edge1.targetId = node2.id;
        root.add(edge1);
        return { root, node1, node2, edge1 };
    }

    it('tracks outgoing edges of a node', () => {
        const ctx = setup();
        const a = Array.from(ctx.node1.outgoingEdges);
        expect(a).to.be.of.length(1);
        expect(a[0].id).to.equal('edge1');
    });
    it('tracks incoming edges of a node', () => {
        const ctx = setup();
        const a = Array.from(ctx.node2.incomingEdges);
        expect(a).to.be.of.length(1);
        expect(a[0].id).to.equal('edge1');
    });
    it('does not contain outgoing or incoming edges after removing them', () => {
        const ctx = setup();
        ctx.root.remove(ctx.edge1);
        expect(Array.from(ctx.node1.outgoingEdges)).to.be.of.length(0);
        expect(Array.from(ctx.node2.incomingEdges)).to.be.of.length(0);
    });
});

describe('anchor computation', () => {
    const container = new Container();
    container.bind(PolylineEdgeRouter).toSelf().inSingletonScope();
    container.bind(AnchorComputerRegistry).toSelf().inSingletonScope();
    container.bind(TYPES.IAnchorComputer).to(RectangleAnchor).inSingletonScope();
    const router = container.get<PolylineEdgeRouter>(PolylineEdgeRouter);

    function createModel() {
        const model = new SGraph();
        model.type = 'graph';
        model.id = 'graph';
        const node1 = new RectangularNode();
        node1.type = 'node';
        node1.id = 'node1';
        node1.position = { x: 10, y: 10 };
        node1.size = { width: 10, height: 10 };
        model.add(node1);
        const port1 = new RectangularPort();
        port1.type = 'port';
        port1.id = 'port1';
        port1.position = { x: 10, y: 4 };
        port1.size = { width: 2, height: 2 };
        port1.strokeWidth = 0;
        node1.add(port1);
        const node2 = new RectangularNode();
        node2.type = 'node';
        node2.id = 'node2';
        node2.position = { x: 30, y: 10 };
        node2.size = { width: 10, height: 10 };
        model.add(node2);
        const port2 = new RectangularPort();
        port2.type = 'port';
        port2.id = 'port2';
        port2.position = { x: -2, y: 4 };
        port2.size = { width: 2, height: 2 };
        port2.strokeWidth = 0;
        node2.add(port2);
        const edge1 = new SEdge();
        edge1.type = 'edge';
        edge1.id = 'edge1';
        edge1.sourceId = 'port1';
        edge1.targetId = 'port2';
        model.add(edge1);
        return model;
    }

    it('correctly translates edge source position', () => {
        const model = createModel();
        const edge = model.index.getById('edge1') as SEdge;
        const sourcePort = model.index.getById('port1') as SPort;
        const refPoint = { x: 30, y: 15 };
        const translated = router.getTranslatedAnchor(sourcePort, refPoint, edge.parent, edge);
        expect(translated).to.deep.equal({ x: 22, y: 15, width: -1, height: -1 });
    });

    it('correctly translates edge target position', () => {
        const model = createModel();
        const edge = model.index.getById('edge1') as SEdge;
        const targetPort = model.index.getById('port2') as SPort;
        const refPoint = { x: 20, y: 15 };
        const translated = router.getTranslatedAnchor(targetPort, refPoint, edge.parent, edge);
        expect(translated).to.deep.equal({ x: 28, y: 15, width: -1, height: -1 });
    });

    it('correctly translates edge source to target position', () => {
        const model = createModel();
        const edge = model.index.getById('edge1') as SEdge;
        const sourcePort = model.index.getById('port1') as SPort;
        const targetPort = model.index.getById('port2') as SPort;
        const refPoint = { x: 10, y: 5 };
        const translated = router.getTranslatedAnchor(targetPort, refPoint, sourcePort.parent, edge);
        expect(translated).to.deep.equal({ x: 28, y: 15, width: -1, height: -1 });
    });
});
