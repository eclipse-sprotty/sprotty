/********************************************************************************
 * Copyright (c) 2021 TypeFox and others.
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

import { Action } from './actions';
import { DiagramServer } from './diagram-server';
import { DiagramState } from './diagram-services';

export type ServerActionHandler<A extends Action = Action> = (action: A, state: DiagramState, server: DiagramServer) => Promise<void>;

/**
 * Use this service to register handlers to specific actions. The `DiagramServer` queries this registry
 * when an action is received from the client, and falls back to the built-in behavior if no handlers
 * are found.
 */
export class ServerActionHandlerRegistry {

    protected readonly handlers = new Map<string, ServerActionHandler[]>();

    /**
     * Returns the action handlers for the given action kind, or `undefined` if there are none.
     */
    getHandler(kind: string): ServerActionHandler[] | undefined {
        return this.handlers.get(kind);
    }

    /**
     * Add an action handler to be called when an action of the specified kind is received.
     */
    onAction<A extends Action>(kind: string, handler: ServerActionHandler<A>) {
        if (this.handlers.has(kind)) {
            this.handlers.get(kind)!.push(handler);
        } else {
            this.handlers.set(kind, [handler]);
        }
    }

    /**
     * Remove an action handler that was previously added with `onAction`.
     */
    removeActionHandler<A extends Action>(kind: string, handler: ServerActionHandler<A>) {
        const list = this.handlers.get(kind);
        if (list) {
            const index = list.indexOf(handler);
            if (index >= 0) {
                list.splice(index, 1);
            }
        }
    }

}
