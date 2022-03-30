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

import { ElkEdge, ElkExtendedEdge, ElkNode, ElkPrimitiveEdge, ElkShape } from 'elkjs/lib/elk-api';
import { Dimension, Point } from 'sprotty-protocol';

/**
 * Data structure received in JSON format from an ELK server.
 */
export interface LayoutData {
    [id: string]: LayoutElement
}

export type LayoutElement = ShapeLayoutElement | EdgeLayoutElement;

export interface ShapeLayoutElement {
    position: Point
    size: Dimension
}

export function isShapeLayout(element: unknown): element is ShapeLayoutElement {
    return typeof element === 'object' && element !== null
        && (element as ShapeLayoutElement).position !== undefined;
}

export interface EdgeLayoutElement {
    route: Point[]
}

export function isEdgeLayout(element: unknown): element is EdgeLayoutElement {
    return typeof element === 'object' && element !== null
        && (element as EdgeLayoutElement).route !== undefined;
}

export function isError(element: unknown): element is Error {
    return typeof element === 'object' && element !== null
        && (element as Error).stack !== undefined;
}

/**
 * Apply the given layout data received from an ELK server to the original graph.
 */
export function applyLayoutData(data: LayoutData, node: ElkNode): void {
    const dataElem = data[node.id];
    if (isShapeLayout(dataElem)) {
        applyShapeLayout(dataElem, node);
    }
    if (node.ports) {
        for (const port of node.ports) {
            const portDataElem = data[port.id];
            if (isShapeLayout(portDataElem)) {
                applyShapeLayout(portDataElem, port);
            }
            if (port.labels) {
                for (const label of port.labels) {
                    const labelDataElem = data[label.id];
                    if (isShapeLayout(labelDataElem)) {
                        applyShapeLayout(labelDataElem, label);
                    }
                }
            }
        }
    }
    if (node.labels) {
        for (const label of node.labels) {
            const labelDataElem = data[label.id];
            if (isShapeLayout(labelDataElem)) {
                applyShapeLayout(labelDataElem, label);
            }
        }
    }
    if (node.edges) {
        for (const edge of node.edges) {
            const edgeDataElem = data[edge.id];
            if (isEdgeLayout(edgeDataElem)) {
                applyEdgeLayout(edgeDataElem, edge);
            }
            if (edge.labels) {
                for (const label of edge.labels) {
                    const labelDataElem = data[label.id];
                    if (isShapeLayout(labelDataElem)) {
                        applyShapeLayout(labelDataElem, label);
                    }
                }
            }
        }
    }
    if (node.children) {
        for (const child of node.children) {
            applyLayoutData(data, child);
        }
    }
}

function applyShapeLayout(dataElem: ShapeLayoutElement, shape: ElkShape): void {
    shape.x = dataElem.position.x;
    shape.y = dataElem.position.y;
    if (dataElem.size) {
        shape.width = dataElem.size.width;
        shape.height = dataElem.size.height;
    }
}

function applyEdgeLayout(dataElem: EdgeLayoutElement, edge: ElkEdge): void {
    if (isPrimitiveEdge(edge)) {
        if (dataElem.route.length >= 1) {
            edge.sourcePoint = dataElem.route[0];
        }
        edge.bendPoints = dataElem.route.slice(1, -1);
        if (dataElem.route.length >= 2) {
            edge.targetPoint = dataElem.route[dataElem.route.length - 1];
        }
    } else if (isExtendedEdge(edge) && edge.sections.length > 0) {
        const section = edge.sections[0];
        if (dataElem.route.length >= 1) {
            section.startPoint = dataElem.route[0];
        }
        section.bendPoints = dataElem.route.slice(1, -1);
        if (dataElem.route.length >= 2) {
            section.endPoint = dataElem.route[dataElem.route.length - 1];
        }
    }
}

function isPrimitiveEdge(edge: ElkEdge): edge is ElkPrimitiveEdge {
    return typeof (edge as ElkPrimitiveEdge).source === 'string'
        && typeof (edge as ElkPrimitiveEdge).target === 'string';
}

function isExtendedEdge(edge: ElkEdge): edge is ElkExtendedEdge {
    return Array.isArray((edge as ElkExtendedEdge).sources) && Array.isArray((edge as ElkExtendedEdge).targets);
}

/**
 * Utility function that looks for the end of a JSON object in an incoming stream.
 */
export function findObjectEnd(chunk: Buffer, state: ParseState): void {
    for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i];
        // TODO check whether inside a string
        if (ch === OPEN_BRACE) {
            state.objLevel++;
        } else if (ch === CLOSE_BRACE) {
            state.objLevel--;
        }
    }
}

export interface ParseState {
    objLevel: number
}

const OPEN_BRACE = '{'.charCodeAt(0);
const CLOSE_BRACE = '}'.charCodeAt(0);
