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

import {
    Action, isResponseAction, ResponseAction, RequestModelAction, ComputedBoundsAction, LayoutAction, RequestBoundsAction,
    RequestAction, generateRequestId, SetModelAction, UpdateModelAction, RejectAction, isRequestAction
} from './actions';
import { SModelRoot } from './model';
import { Deferred } from './utils/async';
import { applyBounds, cloneModel, SModelIndex } from './utils/model-utils';

/**
 * An instance of this class is responsible for handling a single diagram client. It holds the current
 * state of the diagram and manages communication with the client via actions.
 */
export class DiagramServer {

    protected readonly requests = new Map<string, Deferred<ResponseAction>>();
    protected options: DiagramOptions | undefined;
    protected currentRoot: SModelRoot;

    private revision = 0;
    private lastSubmittedModelType?: string;

    constructor(readonly dispatch: <A extends Action>(action: A) => Promise<void>,
                readonly services: DiagramServices) {
        this.currentRoot = {
            type: 'NONE',
            id: 'ROOT'
        };
    }

    setModel(newRoot: SModelRoot): Promise<void> {
        newRoot.revision = ++this.revision;
        this.currentRoot = newRoot;
        return this.submitModel(newRoot, false);
    }

    updateModel(newRoot: SModelRoot): Promise<void> {
        newRoot.revision = ++this.revision;
        this.currentRoot = newRoot;
        return this.submitModel(newRoot, true);
    }

    get needsClientLayout(): boolean {
        if (this.options) {
            return !!this.options.needsClientLayout;
        }
        return true;
    }

    get needsServerLayout(): boolean {
        if (this.options) {
            return !!this.options.needsServerLayout;
        }
        return false;
    }

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

    protected rejectRemoteRequest(action: Action | undefined, error: Error): void {
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
        switch (action.kind) {
            case RequestModelAction.KIND:
                return this.handleRequestModel(action as RequestModelAction);
            case ComputedBoundsAction.KIND:
                return this.handleComputedBounds(action as ComputedBoundsAction);
            case LayoutAction.KIND:
                return this.handleLayout(action as LayoutAction);
            default:
                console.warn(`Unhandled action from client: ${action.kind}`);
        }
        return Promise.resolve();
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        this.options = action.options;
        try {
            const newRoot = await this.services.diagramGenerator.generate({
                options: this.options ?? {}
            });
            newRoot.revision = ++this.revision;
            this.currentRoot = newRoot;
            await this.submitModel(this.currentRoot, false, action);
        } catch (err) {
            this.rejectRemoteRequest(action, err as Error);
            console.error('Failed to generate diagram:', err);
        }
    }

    protected async submitModel(newRoot: SModelRoot, update: boolean, cause?: Action): Promise<void> {
        if (this.needsClientLayout) {
            if (!this.needsServerLayout) {
                // In this case the client won't send us the computed bounds
                this.dispatch({ kind: RequestBoundsAction.KIND, newRoot });
            } else {
                const request = RequestBoundsAction.create(newRoot);
                const response = await this.request<ComputedBoundsAction>(request);
                if (response.revision === this.currentRoot.revision) {
                    applyBounds(this.currentRoot, response);
                    await this.doSubmitModel(this.currentRoot, update, cause);
                } else {
                    this.rejectRemoteRequest(cause, new Error(`Model revision does not match: ${response.revision}`));
                }
            }
        } else {
            await this.doSubmitModel(newRoot, update, cause);
        }
    }

    private async doSubmitModel(newRoot: SModelRoot, update: boolean, cause?: Action): Promise<void> {
        if (newRoot.revision !== this.revision) {
            return;
        }
        if (this.needsServerLayout) {
            newRoot = await this.services.layoutEngine.layout(newRoot);
        }
        const modelType = newRoot.type;
        if (cause && cause.kind === RequestModelAction.KIND) {
            const requestId = (cause as RequestModelAction).requestId;
            const response = SetModelAction.create(newRoot, requestId);
            await this.dispatch(response);
        } else if (update && modelType === this.lastSubmittedModelType) {
            await this.dispatch({ kind: UpdateModelAction.KIND, newRoot, cause });
        } else {
            await this.dispatch({ kind: SetModelAction.KIND, newRoot });
        }
        this.lastSubmittedModelType = modelType;
    }

    protected handleComputedBounds(action: ComputedBoundsAction): Promise<void> {
        if (action.revision !== this.currentRoot.revision) {
            return Promise.reject();
        }
        applyBounds(this.currentRoot, action);
        return Promise.resolve();
    }

    protected handleLayout(action: LayoutAction): Promise<void> {
        if (!this.needsServerLayout) {
            return Promise.resolve();
        }
        const newRoot = cloneModel(this.currentRoot);
        newRoot.revision = ++this.revision;
        this.currentRoot = newRoot;
        return this.doSubmitModel(newRoot, true, action);
    }

}

export type DiagramOptions = { [key: string]: string | number | boolean };

export interface IModelLayoutEngine {
    layout(model: SModelRoot, index?: SModelIndex): SModelRoot | Promise<SModelRoot>;
}

export interface IDiagramGenerator {
    generate(args: { options: DiagramOptions }): SModelRoot | Promise<SModelRoot>
}

export interface DiagramServices {
    readonly diagramGenerator: IDiagramGenerator
    readonly layoutEngine: IModelLayoutEngine;
}
