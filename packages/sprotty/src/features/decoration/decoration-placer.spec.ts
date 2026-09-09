/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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

import { Container } from 'inversify';
import { h } from 'snabbdom';
import { SEdge, SIssueMarker, SNode } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { SModelElementImpl } from '../../base/model/smodel.js';
import { TYPES } from '../../base/types.js';
import { SEdgeImpl, SGraphImpl, SNodeImpl } from '../../graph/sgraph.js';
import routingModule from '../routing/di.config.js';
import { DecorationPlacer } from './decoration-placer.js';
import decorationModule from './di.config.js';

describe('DecorationPlacer', () => {
    const container = new Container();
    container.load(defaultModule, routingModule, decorationModule);
    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node', SNodeImpl);
    registerModelElement(container, 'edge', SEdgeImpl);
    const marker = (id: string): SIssueMarker => ({ id, type: 'marker', size: { width: 16, height: 16 }, issues: [] });
    const model = container.get<IModelFactory>(TYPES.IModelFactory).createRoot({
        id: 'graph', type: 'graph',
        children: [
            <SNode>{ id: 'node0', type: 'node', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, children: [marker('nodeMarker')] },
            <SNode>{ id: 'node1', type: 'node', position: { x: 200, y: 200 }, size: { width: 10, height: 10 } },
            <SEdge>{
                id: 'edge0', type: 'edge', sourceId: 'node0', targetId: 'node1',
                routingPoints: [{ x: 50, y: 50 }, { x: 50, y: 100 }],
                children: [marker('edgeMarker')]
            }
        ]
    });
    const placer = container.get(DecorationPlacer);

    function transformOf(element: SModelElementImpl): unknown {
        const vnode = h('g');
        placer.decorate(vnode, element);
        return vnode.data?.attrs?.transform;
    }

    it('leaves elements that are not decorations alone', () => {
        expect(transformOf(model.index.getById('node0')!)).toBeUndefined();
    });

    it('moves a decoration of a node towards its upper left corner', () => {
        expect(transformOf(model.index.getById('nodeMarker')!)).toBe('translate(-10.656, -10.656)');
    });

    it('centers a decoration of an edge on the middle segment of its route', () => {
        expect(transformOf(model.index.getById('edgeMarker')!)).toBe('translate(42, 67)');
    });
});
