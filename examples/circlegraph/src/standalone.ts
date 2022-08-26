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
    TYPES, IActionDispatcher, ElementMove, MoveAction, LocalModelSource, getBasicType
} from 'sprotty';
import { Bounds, Point, SEdge, SelectAction, SGraph, SNode } from 'sprotty-protocol';
import createContainer from "./di.config";

const NODE_SIZE = 60;

export default async function runCircleGraph() {
    let count = 2;
    function addNode(bounds: Bounds): [SNode, SEdge] {
        const newNode: SNode = {
            id: 'node' + count,
            type: 'node:circle',
            position: {
                x: bounds.x + Math.random() * (bounds.width - NODE_SIZE),
                y: bounds.y + Math.random() * (bounds.height - NODE_SIZE)
            },
            size: {
                width: NODE_SIZE,
                height: NODE_SIZE
            }
        };
        const newEdge: SEdge = {
            id: 'edge' + count,
            type: 'edge:straight',
            sourceId: 'node0',
            targetId: 'node' + count
        };
        count++;
        return [newNode, newEdge];
    }

    function focusGraph(): void {
        const graphElement = document.getElementById('graph');
        if (graphElement !== null && typeof graphElement.focus === 'function')
            graphElement.focus();
    }

    function getVisibleBounds({ canvasBounds, scroll, zoom }: { canvasBounds: Bounds; scroll: Point; zoom: number; }): Bounds {
        return {
            ...scroll,
            width: canvasBounds.width / zoom,
            height: canvasBounds.height / zoom
        };
    }

    const container = createContainer((point: Point) => {
        createNode(point);
    });
    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);

    // Initialize model
    const node0 = { id: 'node0', type: 'node:circle', position: { x: 100, y: 100 }, size: { width: NODE_SIZE, height: NODE_SIZE } };
    const graph: SGraph = { id: 'graph', type: 'graph', children: [node0] };

    const initialViewport = await modelSource.getViewport();
    for (let i = 0; i < 200; ++i) {
        const newElements = addNode(getVisibleBounds(initialViewport));
        graph.children.push(...newElements);
    }

    // Run
    modelSource.setModel(graph);

    async function createNode(point?: Point) {
        const viewport = await modelSource.getViewport();
        const newElements = addNode(getVisibleBounds(viewport));
        if(point) {
            const adjust = (offset:number) => {
                return (offset / viewport.zoom) - (NODE_SIZE / 2);
            }
            newElements[0].position = {
                x: viewport.scroll.x + adjust(point.x),
                y: viewport.scroll.y + adjust(point.y)
            };
        }
        modelSource.addElements(newElements);
        dispatcher.dispatch(SelectAction.create({ selectedElementsIDs: newElements.map(e => e.id) }));
        focusGraph();
    }

    // Button features
    document.getElementById('addNode')!.addEventListener('click', async () => {
        createNode()
    });

    document.getElementById('scrambleAll')!.addEventListener('click', async () => {
        const viewport = await modelSource.getViewport();
        const bounds = getVisibleBounds(viewport);
        const nodeMoves: ElementMove[] = [];
        graph.children.forEach(shape => {
            if (getBasicType(shape) === 'node') {
                nodeMoves.push({
                    elementId: shape.id,
                    toPosition: {
                        x: bounds.x + Math.random() * (bounds.width - NODE_SIZE),
                        y: bounds.y + Math.random() * (bounds.height - NODE_SIZE)
                    }
                });
            }
        });
        dispatcher.dispatch(MoveAction.create(nodeMoves, { animate: true }));
        focusGraph();
    });

    document.getElementById('scrambleSelection')!.addEventListener('click', async () => {
        const selection = await modelSource.getSelection();
        const viewport = await modelSource.getViewport();
        const bounds = getVisibleBounds(viewport);
        const nodeMoves: ElementMove[] = [];
        selection.forEach(shape => {
            if (getBasicType(shape) === 'node') {
                nodeMoves.push({
                    elementId: shape.id,
                    toPosition: {
                        x: bounds.x + Math.random() * (bounds.width - NODE_SIZE),
                        y: bounds.y + Math.random() * (bounds.height - NODE_SIZE)
                    }
                });
            }
        });
        dispatcher.dispatch(MoveAction.create(nodeMoves, { animate: true }));
        focusGraph();
    });

}
