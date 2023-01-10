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

import { spawn, ChildProcess } from 'child_process';
import {
    ELK, ElkLayoutAlgorithmDescription, ElkLayoutCategoryDescription, ElkLayoutOptionDescription, ElkNode
} from 'elkjs/lib/elk-api';
import { applyLayoutData, findObjectEnd, isError, LayoutData, ParseState } from './layout-data';

const DEFAULT_TIMEOUT = 10_000;

/**
 * Use this together with the `ElkLayoutEngine` to spawn a Java process in the background:
 * ```
 * const elkFactory: ElkFactory = () => new StdioElkServer({ commandPath: './elk-server/bin/elk-server' });
 * ```
 * The `elk-server` application can be obtained here:
 * https://github.com/TypeFox/elk-server
 */
export class StdioElkServer implements ELK {

    protected process?: ChildProcess;
    protected readonly commandPath: string;
    protected readonly timeoutDelay: number;

    constructor(options: { commandPath: string, timeoutDelay?: number }) {
        this.commandPath = options.commandPath;
        this.timeoutDelay = options.timeoutDelay ?? DEFAULT_TIMEOUT;
        process.on('exit', () => {
            if (this.process) {
                this.process.kill();
            }
        });
    }

    async layout(graph: ElkNode): Promise<ElkNode> {
        const process = await this.createProcess();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new Error(`Timeout of ${this.timeoutDelay} ms elapsed while waiting for layout server.`)),
                this.timeoutDelay
            );
            const exitCallback = () => {
                clearTimeout(timeout);
                this.process = undefined;
                reject(new Error('The layout server process terminated.'));
            };
            process.on('exit', exitCallback);
            if (!process.stdin || !process.stdout) {
                reject('The layout server process is not available.');
                return;
            }
            process.stdin.on('error', reject);
            // Send the input graph to the layout server
            process.stdin.write(JSON.stringify(graph));

            // Wait for complete result
            const buffers: Buffer[] = [];
            const parseState: ParseState = { objLevel: 0 };
            const dataCallback = (chunk: Buffer) => {
                buffers.push(chunk);
                findObjectEnd(chunk, parseState);
                if (parseState.objLevel === 0) {
                    clearTimeout(timeout);
                    process.removeListener('exit', exitCallback);
                    process.stdout?.removeListener('data', dataCallback);
                    process.stdin?.removeListener('error', reject);
                    try {
                        const response = JSON.parse(Buffer.concat(buffers).toString()) as LayoutData | Error;
                        if (isError(response)) {
                            // The layout server responded an error
                            reject(response);
                        } else {
                            this.applyLayout(response, graph);
                            resolve(graph);
                        }
                    } catch (err) {
                        reject(err);
                    }
                }
            };
            process.stdout.on('data', dataCallback);
        });
    }

    protected applyLayout(data: LayoutData, graph: ElkNode) {
        applyLayoutData(data, graph);
    }

    protected createProcess(): Promise<ChildProcess> {
        if (this.process && !this.process.killed) {
            return Promise.resolve(this.process);
        }
        return new Promise((resolve, reject) => {
            const process = spawn(this.commandPath, ['--stdio']);
            process.on('error', reject);
            process.stderr.on('data', data => console.error(data.toString()));
            this.process = process;
            setImmediate(() => resolve(process));
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
