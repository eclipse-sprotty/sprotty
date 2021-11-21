/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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

import { TYPES, LocalModelSource } from 'sprotty';
import { SEdge, SGraph, SLabel, SNode } from 'sprotty-protocol';
import createContainer from './di.config';

export default function runRandomGraph() {
    const container = createContainer('sprotty');

    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    modelSource.setModel(createRandomGraph());
}

const NODES = 50;
const EDGES = 100;

function createRandomGraph(): SGraph {
    const graph: SGraph = {
        type: 'graph',
        id: 'root',
        children: []
    };

    for (let i = 0; i < NODES; i++) {
        const node: SNode = {
            type: 'node',
            id: `node${i}`,
            layout: 'vbox',
            children: [
                <SLabel>{
                    type: 'label',
                    id: `node${i}_label`,
                    text: i.toString()
                }
            ]
        };
        graph.children.push(node);
    }

    for (let i = 0; i < EDGES; i++) {
        const edge: SEdge = {
            type: 'edge',
            id: `edge${i}`,
            sourceId: `node${Math.floor(Math.random() * NODES)}`,
            targetId: `node${Math.floor(Math.random() * NODES)}`
        };
        graph.children.push(edge);
    }

    return graph;
}
