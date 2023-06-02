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
import { SEdge, SGraph, SLabel, SNode, SPort } from 'sprotty-protocol';
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
            children: [
                <SLabel>{
                    type: 'label:node',
                    id: `node${i}_label`,
                    text: i.toString()
                }
            ]
        };
        graph.children.push(node);
    }

    for (let i = 0; i < EDGES; i++) {
        const sourceNo = Math.floor(Math.random() * NODES);
        const targetNo = Math.floor(Math.random() * NODES);
        if (sourceNo === targetNo) {
            continue;
        }
        const edge: SEdge = {
            type: 'edge',
            id: `edge${i}`,
            sourceId: `port${sourceNo}-${i}`,
            targetId: `port${targetNo}-${i}`
        };
        graph.children.push(edge);

        const sourcePort: SPort = {
            type: 'port',
            id: `port${sourceNo}-${i}`,
            size: { width: 8, height: 8 },
            children: [
                <SLabel>{
                    type: 'label:port',
                    id: `port${sourceNo}-${i}-label`,
                    text: `out${i}`
                }
            ]
        };
        graph.children.find(c => c.id === `node${sourceNo}`)!.children!.push(sourcePort);

        const targetPort: SPort = {
            type: 'port',
            id: `port${targetNo}-${i}`,
            size: { width: 8, height: 8 },
            children: [
                <SLabel>{
                    type: 'label:port',
                    id: `port${targetNo}-${i}-label`,
                    text: `in${i}`
                }
            ]
        };
        graph.children.find(c => c.id === `node${targetNo}`)!.children!.push(targetPort);
    }

    return graph;
}
