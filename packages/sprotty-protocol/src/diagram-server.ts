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

import { ServerActionHandlerRegistry } from './action-handler';
import {
    Action, isResponseAction, ResponseAction, RequestModelAction, ComputedBoundsAction, LayoutAction, RequestBoundsAction,
    RequestAction, generateRequestId, SetModelAction, UpdateModelAction, RejectAction, isRequestAction
} from './actions';
import { DiagramServices, DiagramState, IDiagramGenerator, IModelLayoutEngine } from './diagram-services';
import { SModelRoot } from './model';
import { Deferred } from './utils/async';
import { applyBounds, cloneModel } from './utils/model-utils';

/**
 * An instance of this class is responsible for handling a single diagram client. It holds the current
 * state of the diagram and manages communication with the client via actions.
 */
export class DiagramServer {

    readonly state: DiagramState & {
        lastSubmittedModelType?: string
    } = {
        currentRoot: {
            type: 'NONE',
            id: 'ROOT'
        },
        revision: 0
    };
    readonly dispatch: <A extends Action>(action: A) => Promise<void>;

    protected readonly diagramGenerator: IDiagramGenerator;
    protected readonly layoutEngine?: IModelLayoutEngine;
    protected actionHandlerRegistry?: ServerActionHandlerRegistry;
    protected readonly requests = new Map<string, Deferred<ResponseAction>>();

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
                services: DiagramServices) {
        this.dispatch = dispatch;
        this.diagramGenerator = services.DiagramGenerator;
        this.layoutEngine = services.ModelLayoutEngine;
        this.actionHandlerRegistry = services.ServerActionHandlerRegistry;
    }

    /**
     * Set the model and submit it to the client.
     */
    setModel(newRoot: SModelRoot): Promise<void> {
        newRoot.revision = ++this.state.revision;
        this.state.currentRoot = newRoot;
        return this.submitModel(newRoot, false);
    }

    /**
     * Update the model to a new state and submit it to the client.
     */
    updateModel(newRoot: SModelRoot): Promise<void> {
        newRoot.revision = ++this.state.revision;
        this.state.currentRoot = newRoot;
        return this.submitModel(newRoot, true);
    }

    /**
     * Whether the client needs to compute the layout of parts of the model. This affects the behavior
     * of `submitModel`.
     *
     * This setting is determined by the `DiagramOptions` that are received with the `RequestModelAction`
     * from the client. If the client does not specify whether it needs client layout, the default value
     * is `true`.
     */
    get needsClientLayout(): boolean {
        if (this.state.options && this.state.options.needsClientLayout !== undefined) {
            return !!this.state.options.needsClientLayout;
        }
        return true;
    }

    /**
     * Whether the server needs to compute the layout of parts of the model. This affects the behavior
     * of `submitModel`.
     *
     * This setting is determined by the `DiagramOptions` that are received with the `RequestModelAction`
     * from the client. If the client does not specify whether it needs server layout, the default value
     * is `false`.
     */
    get needsServerLayout(): boolean {
        if (this.state.options && this.state.options.needsServerLayout !== undefined) {
            return !!this.state.options.needsServerLayout;
        }
        return false;
    }

    /**
     * Called when an action is received from the client.
     */
    accept(action: Action): Promise<void> {
        if (isResponseAction(action)) {
            const id = action.responseId;
            const future = this.requests.get(id);
            if (future) {
                this.requests.delete(id);
                if (action.kind === RejectAction.KIND) {
                    const rejectAction: RejectAction = action as any;
                    future.reject(new Error(rejectAction.message));
                    console.warn(`Request with id ${action.responseId} failed: ${rejectAction.message}`, rejectAction.detail);
                } else {
                    future.resolve(action);
                }
                return Promise.resolve();
            }
            console.info('No matching request for response:', action);
        }
        return this.handleAction(action);
    }

    /**
     * Send a request action to the client. The resulting promise is resolved when a matching
     * response is received and rejected when a `RejectAction` is received.
     */
    request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res> {
        if (!action.requestId) {
            action.requestId = 'server_' + generateRequestId();
        }
        const future = new Deferred<Res>();
        this.requests.set(action.requestId, future as any);
        this.dispatch(action).catch(err => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.requests.delete(action.requestId!);
            future.reject(err);
        });
        return future.promise;
    }

    /**
     * Send a `RejectAction` to the client to notify that a request could not be fulfilled.
     */
    rejectRemoteRequest(action: Action | undefined, error: Error): void {
        if (action && isRequestAction(action)) {
            this.dispatch({
                kind: RejectAction.KIND,
                responseId: action.requestId,
                message: error.message,
                detail: error.stack
            });
        }
    }

    protected handleAction(action: Action): Promise<void> {
        // Find a matching action handler in the registry
        const handlers = this.actionHandlerRegistry?.getHandler(action.kind);
        if (handlers && handlers.length === 1) {
            return handlers[0](action, this.state, this);
        } else if (handlers && handlers.length > 1) {
            return Promise.all(handlers.map(h => h(action, this.state, this))) as Promise<any>;
        }
        // If no handler is registered, call one of the default handling methods
        switch (action.kind) {
            case RequestModelAction.KIND:
                return this.handleRequestModel(action as RequestModelAction);
            case ComputedBoundsAction.KIND:
                return this.handleComputedBounds(action as ComputedBoundsAction);
            case LayoutAction.KIND:
                return this.handleLayout(action as LayoutAction);
        }
        // We don't know this action kind, sigh
        console.warn(`Unhandled action from client: ${action.kind}`);
        return Promise.resolve();
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        this.state.options = action.options;
        try {
            const newRoot = await this.diagramGenerator.generate({
                options: this.state.options ?? {},
                state: this.state
            });
            newRoot.revision = ++this.state.revision;
            this.state.currentRoot = newRoot;
            await this.submitModel(this.state.currentRoot, false, action);
        } catch (err) {
            this.rejectRemoteRequest(action, err as Error);
            console.error('Failed to generate diagram:', err);
        }
    }

    /**
     * Submit a model to the client after it has been updated in the server state.
     */
     protected async submitModel(newRoot: SModelRoot, update: boolean, cause?: Action): Promise<void> {
        if (this.needsClientLayout) {
            if (!this.needsServerLayout) {
                // In this case the client won't send us the computed bounds
                this.dispatch({ kind: RequestBoundsAction.KIND, newRoot });
            } else {
                const request = RequestBoundsAction.create(newRoot);
                const response = await this.request<ComputedBoundsAction>(request);
                const currentRoot = this.state.currentRoot;
                if (response.revision === currentRoot.revision) {
                    applyBounds(currentRoot, response);
                    await this.doSubmitModel(currentRoot, update, cause);
                } else {
                    this.rejectRemoteRequest(cause, new Error(`Model revision does not match: ${response.revision}`));
                }
            }
        } else {
            await this.doSubmitModel(newRoot, update, cause);
        }
    }

    private async doSubmitModel(newRoot: SModelRoot, update: boolean, cause?: Action): Promise<void> {
        if (newRoot.revision !== this.state.revision) {
            return;
        }
        if (this.needsServerLayout && this.layoutEngine) {
            newRoot = await this.layoutEngine.layout(newRoot);
        }
        const modelType = newRoot.type;
        if (cause && cause.kind === RequestModelAction.KIND) {
            const requestId = (cause as RequestModelAction).requestId;
            const response = SetModelAction.create(newRoot, requestId);
            await this.dispatch(response);
        } else if (update && modelType === this.state.lastSubmittedModelType) {
            await this.dispatch({ kind: UpdateModelAction.KIND, newRoot, cause });
        } else {
            await this.dispatch({ kind: SetModelAction.KIND, newRoot });
        }
        this.state.lastSubmittedModelType = modelType;
    }

    protected handleComputedBounds(action: ComputedBoundsAction): Promise<void> {
        if (action.revision !== this.state.currentRoot.revision) {
            return Promise.reject();
        }
        applyBounds(this.state.currentRoot, action);
        return Promise.resolve();
    }

    protected async handleLayout(action: LayoutAction): Promise<void> {
        if (!this.layoutEngine) {
            return;
        }
        if (!this.needsServerLayout) {
            let newRoot = cloneModel(this.state.currentRoot);
            newRoot = await this.layoutEngine.layout(newRoot);
            newRoot.revision = ++this.state.revision;
            this.state.currentRoot = newRoot;
        }
        await this.doSubmitModel(this.state.currentRoot, true, action);
    }

}
