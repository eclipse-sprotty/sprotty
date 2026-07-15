/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
 ********************************************************************************/

import 'reflect-metadata';

import { Container } from 'inversify';
import { VNode } from 'snabbdom';
import { Action, ComputedBoundsAction, RequestBoundsAction, RequestExportSvgAction } from 'sprotty-protocol/lib/actions';
import { describe, expect, it } from 'vitest';
import defaultModule from '../../base/di.config';
import { SModelRootImpl } from '../../base/model/smodel';
import { createFeatureSet } from '../../base/model/smodel-factory';
import { SNodeImpl } from '../../graph/sgraph';
import boundsModule from './di.config';
import { HiddenBoundsUpdater } from './hidden-bounds-updater';

describe('HiddenBoundsUpdater', () => {

    function createNode(id: string): SNodeImpl {
        const node = new SNodeImpl();
        node.id = id;
        node.features = createFeatureSet(SNodeImpl.DEFAULT_FEATURES);
        node.bounds = { x: 0, y: 0, width: -1, height: -1 };
        return node;
    }

    function createRoot(...nodes: SNodeImpl[]): SModelRootImpl {
        const root = new SModelRootImpl();
        root.id = 'root';
        nodes.forEach(node => root.add(node));
        return root;
    }

    function fakeVNode(): VNode {
        // duck-typed SVG element: isSVGGraphicsElement only checks for a getBBox function
        return { elm: { getBBox: () => ({ x: 0, y: 0, width: 10, height: 20 }) } } as unknown as VNode;
    }

    function createUpdater(dispatched: Action[]): HiddenBoundsUpdater {
        const container = new Container();
        container.load(defaultModule, boundsModule);
        const updater = container.get(HiddenBoundsUpdater);
        (updater as any).actionDispatcher = { dispatch: (action: Action) => dispatched.push(action) };
        return updater;
    }

    it('computes bounds for the rendered elements on a request bounds rendering', () => {
        const dispatched: Action[] = [];
        const updater = createUpdater(dispatched);

        const node = createNode('node1');
        updater.decorate(fakeVNode(), node);
        updater.decorate(fakeVNode(), createRoot(node));
        updater.postUpdate(RequestBoundsAction.create({ type: 'graph', id: 'root' }));

        expect(dispatched).to.have.lengthOf(1);
        const computedBounds = dispatched[0] as ComputedBoundsAction;
        expect(computedBounds.bounds.map(b => b.elementId)).to.deep.equal(['node1']);
    });

    it('does not dispatch anything on a hidden rendering with a different cause', () => {
        const dispatched: Action[] = [];
        const updater = createUpdater(dispatched);

        const node = createNode('node1');
        updater.decorate(fakeVNode(), node);
        updater.decorate(fakeVNode(), createRoot(node));
        updater.postUpdate(RequestExportSvgAction.create());

        expect(dispatched).to.be.empty;
    });

    it('discards bounds collected by a hidden rendering with a different cause (e.g. SVG export)', () => {
        const dispatched: Action[] = [];
        const updater = createUpdater(dispatched);

        // hidden rendering caused by an SVG export: no bounds computation is requested
        const staleNode = createNode('staleNode');
        updater.decorate(fakeVNode(), staleNode);
        updater.decorate(fakeVNode(), createRoot(staleNode));
        updater.postUpdate(RequestExportSvgAction.create());

        // next hidden rendering answers a bounds request for a model that no longer contains staleNode
        const currentNode = createNode('currentNode');
        updater.decorate(fakeVNode(), currentNode);
        updater.decorate(fakeVNode(), createRoot(currentNode));
        updater.postUpdate(RequestBoundsAction.create({ type: 'graph', id: 'root' }));

        expect(dispatched).to.have.lengthOf(1);
        const computedBounds = dispatched[0] as ComputedBoundsAction;
        expect(computedBounds.bounds.map(b => b.elementId)).to.deep.equal(['currentNode']);
    });
});
