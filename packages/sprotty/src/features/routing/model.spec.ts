/********************************************************************************
 * Copyright (c) 2020 TypeFox and others.
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

import 'mocha';
import { expect } from 'chai';
import { SModelRoot } from '../../base/model/smodel';
import { SShapeElement } from '../bounds/model';
import { SRoutableElement, getAbsoluteRouteBounds } from './model';
import { SEdge, SGraph, SNode } from '../../graph/sgraph';

describe('getAbsoluteRouteBounds', () => {
    function createModel(): SModelRoot {
        const root = new SModelRoot();
        const node1 = new TestNode();
        node1.bounds = { x: 100, y: 100, width: 100, height: 100 };
        root.add(node1);
        const edge1 = new TestEdge();
        edge1.routingPoints = [
            { x: 10, y: 30 },
            { x: 20, y: 10 },
            { x: 40, y: 20 }
        ];
        node1.add(edge1);
        return root;
    }

    it('should compute the absolute bounds of a routable element', () => {
        const model = createModel();
        const routable = model.children[0].children[0] as SRoutableElement;
        expect(getAbsoluteRouteBounds(routable)).to.deep.equal({
            x: 110, y: 110, width: 30, height: 20
        });
    });
});

class TestNode extends SShapeElement {
}

class TestEdge extends SRoutableElement {
}

describe('SConnectableElement', () => {
    function createModel(type: 'root' | 'graph'): SModelRoot {
        const root = type === 'graph' ? new SGraph() : new SModelRoot();
        const node1 = new SNode();
        node1.id = 'node1';
        root.add(node1);
        const node2 = new SNode();
        node2.id = 'node2';
        root.add(node2);
        const node3 = new SNode();
        node3.id = 'node3';
        root.add(node3);
        const node4 = new SNode();
        node4.id = 'node4';
        root.add(node4);
        const edge1 = new SEdge();
        edge1.id = 'edge1';
        edge1.sourceId = node1.id;
        edge1.targetId = node2.id;
        root.add(edge1);
        const edge2 = new SEdge();
        edge2.id = 'edge2';
        edge2.sourceId = node3.id;
        edge2.targetId = node4.id;
        root.add(edge2);
        return root;
    }

    it('should compute outgoing edges with SGraph', () => {
        const model = createModel('graph');
        const edges = Array.from((model.children[0] as SNode).outgoingEdges);
        expect(edges).to.have.length(1);
        expect(edges[0].id).to.equal('edge1');
    });

    it('should compute incoming edges with SGraph', () => {
        const model = createModel('graph');
        const edges = Array.from((model.children[1] as SNode).incomingEdges);
        expect(edges).to.have.length(1);
        expect(edges[0].id).to.equal('edge1');
    });

    it('should compute outgoing edges with SModelRoot', () => {
        const model = createModel('root');
        const edges = Array.from((model.children[0] as SNode).outgoingEdges);
        expect(edges).to.have.length(1);
        expect(edges[0].id).to.equal('edge1');
    });

    it('should compute incoming edges with SModelRoot', () => {
        const model = createModel('root');
        const edges = Array.from((model.children[1] as SNode).incomingEdges);
        expect(edges).to.have.length(1);
        expect(edges[0].id).to.equal('edge1');
    });
});
