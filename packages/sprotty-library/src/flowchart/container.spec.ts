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
import toHTML from 'snabbdom-to-html';
import { IModelFactory, ModelRendererFactory, SModelRootImpl, TYPES, loadDefaultModules } from 'sprotty';
import { SEdge, SLabel, SNode } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { Flowchart } from '../index.js';
import { flowchartModule } from './container.js';

const nodeTypes = [
    'node:terminal', 'node:process', 'node:decision', 'node:input', 'node:output', 'node:comment',
    'node:predefined-process', 'node:on-page-connector', 'node:off-page-connector', 'node:delay',
    'node:alternate-process', 'node:data', 'node:document', 'node:multi-document', 'node:preparation',
    'node:display', 'node:manual-input', 'node:manual-operation', 'node:database'
];

describe('flowchartModule', () => {
    const container = new Container();
    loadDefaultModules(container);
    container.load(flowchartModule);
    const model = container.get<IModelFactory>(TYPES.IModelFactory).createRoot({
        id: 'graph', type: 'graph',
        children: [
            ...nodeTypes.map((type, index): SNode => ({
                id: type, type,
                position: { x: 100 * index, y: 0 }, size: { width: 80, height: 40 },
                children: [{ id: `${type}_label`, type: 'label', text: type } as SLabel]
            })),
            {
                id: 'edge', type: 'edge', sourceId: 'node:terminal', targetId: 'node:process',
                children: [{ id: 'edge_label', type: 'label:edge', text: 'yes' } as SLabel]
            } as SEdge
        ]
    });
    const context = container.get<ModelRendererFactory>(TYPES.ModelRendererFactory)('hidden', []);

    function render(id: string): string {
        return toHTML(context.renderElement(model.index.getById(id)!));
    }

    it('is exported as the Flowchart namespace of the package', () => {
        expect(Flowchart.flowchartModule).toBe(flowchartModule);
    });

    it('renders the graph root', () => {
        expect(model).toBeInstanceOf(SModelRootImpl);
        expect(render('graph')).toContain('<svg class="sprotty-graph">');
    });

    it.each(nodeTypes)('renders %s with its shape class and its label', type => {
        const html = render(type);
        expect(html).toContain(`class="sprotty-node ${type.substring('node:'.length)}"`);
        expect(html).toContain('sprotty-label');
        expect(html).toContain(`>${type}</text>`);
    });

    it('renders edges with an arrow head and a backed edge label', () => {
        const html = render('edge');
        expect(html).toContain('class="sprotty-edge"');
        expect(html).toContain('class="arrowhead"');
        expect(html).toContain('class="edge-label-background"');
        expect(html).toContain('>yes</text>');
    });
});
