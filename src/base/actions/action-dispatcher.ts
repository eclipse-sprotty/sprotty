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

import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ILogger } from "../../utils/logging";
import { EMPTY_ROOT } from '../model/smodel-factory';
import { ICommandStack } from "../commands/command-stack";
import { AnimationFrameSyncer } from "../animations/animation-frame-syncer";
import { SetModelAction } from '../features/set-model';
import { RedoAction, UndoAction } from "../../features/undo-redo/undo-redo";
import { Action, isAction } from "./action";
import { ActionHandlerRegistry } from "./action-handler";

export interface IActionDispatcher {
    dispatch(action: Action): Promise<void>
    dispatchAll(actions: Action[]): Promise<void>
}

/**
 * Collects actions, converts them to commands and dispatches them.
 * Also acts as the proxy to model sources such as diagram servers.
 */
@injectable()
export class ActionDispatcher implements IActionDispatcher {

    @inject(TYPES.ActionHandlerRegistryProvider) protected actionHandlerRegistryProvider: () => Promise<ActionHandlerRegistry>;
    @inject(TYPES.ICommandStack) protected commandStack: ICommandStack;
    @inject(TYPES.ILogger) protected logger: ILogger;
    @inject(TYPES.AnimationFrameSyncer) protected syncer: AnimationFrameSyncer;

    protected actionHandlerRegistry: ActionHandlerRegistry;

    protected blockUntil?: (action: Action) => boolean;
    protected postponedActions: PostponedAction[] = [];
    protected initialized: Promise<void> | undefined;

    initialize(): Promise<void> {
        if (!this.initialized) {
            this.initialized = this.actionHandlerRegistryProvider().then(registry => {
                this.actionHandlerRegistry = registry;
                this.handleAction(new SetModelAction(EMPTY_ROOT));
            });
        }
        return this.initialized;
    }

    dispatchAll(actions: Action[]): Promise<void> {
        return Promise.all(actions.map(action => this.dispatch(action))) as Promise<any>;
    }

    dispatch(action: Action): Promise<void> {
        return this.initialize().then(() => {
            if (this.blockUntil !== undefined) {
                return this.handleBlocked(action, this.blockUntil);
            } else if (action.kind === UndoAction.KIND) {
                return this.commandStack.undo().then(() => {});
            } else if (action.kind === RedoAction.KIND) {
                return this.commandStack.redo().then(() => {});
            } else {
                return this.handleAction(action);
            }
        });
    }

    protected handleAction(action: Action): Promise<void> {
        this.logger.log(this, 'handle', action);
        const handlers = this.actionHandlerRegistry.get(action.kind);
        if (handlers.length > 0) {
            const promises: Promise<any>[] = [];
            for (const handler of handlers) {
                const result = handler.handle(action);
                if (isAction(result)) {
                    promises.push(this.dispatch(result));
                } else if (result !== undefined) {
                    promises.push(this.commandStack.execute(result));
                    this.blockUntil = result.blockUntil;
                }
            }
            return Promise.all(promises) as Promise<any>;
        } else {
            this.logger.warn(this, 'Missing handler for action', action);
            return Promise.reject(`Missing handler for action '${action.kind}'`);
        }
    }

    protected handleBlocked(action: Action, predicate: (action: Action) => boolean): Promise<void> {
        if (predicate(action)) {
            this.blockUntil = undefined;
            const result = this.handleAction(action);
            const actions = this.postponedActions;
            this.postponedActions = [];
            for (const a of actions) {
                this.dispatch(a.action).then(a.resolve, a.reject);
            }
            return result;
        } else {
            this.logger.log(this, 'Action is postponed due to block condition', action);
            return new Promise((resolve, reject) => {
                this.postponedActions.push({ action, resolve, reject });
            });
        }
    }
}

export interface PostponedAction {
    action: Action
    resolve: () => void
    reject: (reason: any) => void
}

export type IActionDispatcherProvider = () => Promise<IActionDispatcher>;
