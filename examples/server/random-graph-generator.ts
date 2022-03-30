/********************************************************************************
 * Copyright (c) 2022 TypeFox and others.
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

import { GeneratorArguments, IDiagramGenerator, SEdge, SGraph, SLabel, SModelRoot, SNode } from 'sprotty-protocol';

const NODES = 50;
const EDGES = 100;

export class RandomGraphGenerator implements IDiagramGenerator {

    generate(args: GeneratorArguments): SModelRoot | Promise<SModelRoot> {
        const graph: SGraph = {
            type: 'graph',
            id: 'root',
            children: []
        };

        for (let i = 0; i < NODES; i++) {
            const node: SNode = {
                type: 'node',
                id: `node${i}`,
                size: { width: 28, height: 28 },
                children: [
                    <SLabel>{
                        type: 'label',
                        id: `node${i}_label`,
                        text: i.toString(),
                        size: { width: 18, height: 18 },
                        position: { x: 5, y: 5 },
                        alignment: { x: 0, y: 15 }
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

}
