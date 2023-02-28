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

import { Socket } from 'net';
import {
    ELK, ElkLayoutAlgorithmDescription, ElkLayoutCategoryDescription, ElkLayoutOptionDescription, ElkNode
} from 'elkjs/lib/elk-api';
import { applyLayoutData, findObjectEnd, isError, LayoutData, ParseState } from './layout-data';

const DEFAULT_PORT = 5008;
const DEFAULT_TIMEOUT = 10_000;

/**
 * Use this together with the `ElkLayoutEngine` to connect to a Java process via socket:
 * ```
 * const elkFactory: ElkFactory = () => new SocketElkServer();
 * ```
 * The `elk-server` application can be obtained here:
 * https://github.com/TypeFox/elk-server
 */
export class SocketElkServer implements ELK {

    protected socket?: Socket;
    protected readonly port: number;
    protected readonly timeoutDelay: number;

    constructor(options: { port?: number, timeoutDelay?: number } = {}) {
        const envPort = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : undefined;
        this.port = options.port ?? envPort ?? DEFAULT_PORT;
        this.timeoutDelay = options.timeoutDelay ?? DEFAULT_TIMEOUT;
    }

    async layout(graph: ElkNode): Promise<ElkNode> {
        const socket = await this.createSocket();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new Error(`Timeout of ${this.timeoutDelay} ms elapsed while waiting for layout server.`)),
                this.timeoutDelay
            );
            const closeCallback = () => {
                clearTimeout(timeout);
                this.socket = undefined;
                reject(new Error('The layout server socket was closed.'));
            };
            socket.on('close', closeCallback);
            // Send the input graph to the layout server
            socket.write(JSON.stringify(graph));

            // Wait for complete result
            const buffers: Buffer[] = [];
            const parseState: ParseState = { objLevel: 0 };
            const dataCallback = (chunk: Buffer) => {
                buffers.push(chunk);
                findObjectEnd(chunk, parseState);
                if (parseState.objLevel === 0) {
                    clearTimeout(timeout);
                    socket.removeListener('close', closeCallback);
                    socket.removeListener('data', dataCallback);
                    try {
                        const response = JSON.parse(Buffer.concat(buffers).toString()) as LayoutData | Error;
                        if (isError(response)) {
                            // The layout server responded an error
                            reject(response);
                        } else {
                            applyLayoutData(response, graph);
                            resolve(graph);
                        }
                    } catch (err) {
                        reject(err);
                    }
                }
            };
            socket.on('data', dataCallback);
        });
    }

    protected createSocket(): Promise<Socket> {
        if (this.socket && !this.socket.destroyed) {
            return Promise.resolve(this.socket);
        }
        return new Promise((resolve, reject) => {
            const socket = new Socket();
            socket.on('error', err => {
                this.socket = undefined;
                reject(err);
            });
            socket.connect(this.port, "127.0.0.1");
            this.socket = socket;
            socket.on('ready', () => resolve(socket));
        });
    }

    knownLayoutAlgorithms(): Promise<ElkLayoutAlgorithmDescription[]> {
        throw new Error('Method not implemented.');
    }
    knownLayoutOptions(): Promise<ElkLayoutOptionDescription[]> {
        throw new Error('Method not implemented.');
    }
    knownLayoutCategories(): Promise<ElkLayoutCategoryDescription[]> {
        throw new Error('Method not implemented.');
    }

}
