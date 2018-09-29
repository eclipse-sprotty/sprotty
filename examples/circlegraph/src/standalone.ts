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

import {
    TYPES, IActionDispatcher, SModelElementSchema, SEdgeSchema, SNodeSchema, SGraphSchema, SGraphFactory,
    ElementMove, MoveAction, LocalModelSource
} from "../../../src";
import createContainer from "./di.config";

export default function runStandalone() {
    const container = createContainer(false);

    // Initialize gmodel
    const node0 = { id: 'node0', type: 'node:circle', position: { x: 100, y: 100 }, size: { width: 80, height: 80 } };
    const graph: SGraphSchema = { id: 'graph', type: 'graph', children: [node0] };

    let count = 2;
    function addNode(): SModelElementSchema[] {
        const newNode: SNodeSchema = {
            id: 'node' + count,
            type: 'node:circle',
            position: {
                x: Math.random() * 1024,
                y: Math.random() * 768
            },
            size: {
                width: 80,
                height: 80
            }
        };
        const newEdge: SEdgeSchema = {
            id: 'edge' + count,
            type: 'edge:straight',
            sourceId: 'node0',
            targetId: 'node' + count++
        };
        return [newNode, newEdge];
    }

    for (let i = 0; i < 200; ++i) {
        const newElements = addNode();
        for (const e of newElements) {
            graph.children.splice(0, 0, e);
        }
    }

    // Run
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    modelSource.setModel(graph);

    // Button features
    document.getElementById('addNode')!.addEventListener('click', () => {
        const newElements = addNode();
        modelSource.addElements(newElements);
        const graphElement = document.getElementById('graph');
        if (graphElement !== null && typeof graphElement.focus === 'function')
            graphElement.focus();
    });

    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    const factory = container.get<SGraphFactory>(TYPES.IModelFactory);
    document.getElementById('scrambleNodes')!.addEventListener('click', function (e) {
        const nodeMoves: ElementMove[] = [];
        graph.children.forEach(shape => {
            if (factory.isNodeSchema(shape)) {
                nodeMoves.push({
                    elementId: shape.id,
                    toPosition: {
                        x: Math.random() * 1024,
                        y: Math.random() * 768
                    }
                });
            }
        });
        dispatcher.dispatch(new MoveAction(nodeMoves, true));
        const graphElement = document.getElementById('graph');
        if (graphElement !== null && typeof graphElement.focus === 'function')
            graphElement.focus();
    });

}
