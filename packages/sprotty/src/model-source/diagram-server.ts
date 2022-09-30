/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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

import { saveAs } from 'file-saver';
import { inject, injectable } from "inversify";
import { OpenAction } from 'sprotty-protocol';
import {
    Action, CollapseExpandAction, CollapseExpandAllAction, ComputedBoundsAction, RequestModelAction,
    RequestPopupModelAction, SetModelAction, UpdateModelAction
} from 'sprotty-protocol/lib/actions';
import { SModelRoot as SModelRootSchema } from 'sprotty-protocol/lib/model';
import { hasOwnProperty } from 'sprotty-protocol/lib/utils/object';
import { ActionHandlerRegistry } from "../base/actions/action-handler";
import { ICommand } from "../base/commands/command";
import { SetModelCommand } from "../base/features/set-model";
import { TYPES } from "../base/types";
import { RequestBoundsCommand } from '../features/bounds/bounds-manipulation';
import { ExportSvgAction } from '../features/export/svg-exporter';
import { UpdateModelCommand } from "../features/update/update-model";
import { ILogger } from "../utils/logging";
import { ComputedBoundsApplicator, ModelSource } from "./model-source";

/**
 * Wrapper for actions when transferring them between client and server via a DiagramServer.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export interface ActionMessage {
    clientId: string
    action: Action
}

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export function isActionMessage(object: unknown): object is ActionMessage {
    return hasOwnProperty(object, 'action');
}

/**
 * Sent by the external server when to signal a state change.
 */
export class ServerStatusAction {
    static KIND = 'serverStatus';
    kind = ServerStatusAction.KIND;
    severity: string;
    message: string;
}

const receivedFromServerProperty = '__receivedFromServer';

/**
 * A ModelSource that communicates with an external model provider, e.g.
 * a model editor.
 *
 * This class defines which actions are sent to and received from the
 * external model source.
 */
@injectable()
export abstract class DiagramServerProxy extends ModelSource {

    @inject(TYPES.ILogger) protected logger: ILogger;
    @inject(ComputedBoundsApplicator) protected readonly computedBoundsApplicator: ComputedBoundsApplicator;

    clientId: string;

    protected currentRoot: SModelRootSchema = {
        type: 'NONE',
        id: 'ROOT'
    };

    protected lastSubmittedModelType: string;

    override initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);

        // Register this model source
        registry.register(ComputedBoundsAction.KIND, this);
        registry.register(RequestBoundsCommand.KIND, this);
        registry.register(RequestPopupModelAction.KIND, this);
        registry.register(CollapseExpandAction.KIND, this);
        registry.register(CollapseExpandAllAction.KIND, this);
        registry.register(OpenAction.KIND, this);
        registry.register(ServerStatusAction.KIND, this);

        if (!this.clientId)
            this.clientId = this.viewerOptions.baseDiv;
    }

    handle(action: Action): void | ICommand | Action {
        const forwardToServer = this.handleLocally(action);
        if (forwardToServer)
            this.forwardToServer(action);
    }

    protected forwardToServer(action: Action): void {
        const message: ActionMessage = {
            clientId: this.clientId,
            action: action
        };
        this.logger.log(this, 'sending', message);
        this.sendMessage(message);
    }

    protected abstract sendMessage(message: ActionMessage): void;

    protected messageReceived(data: any): void {
        const object = typeof(data) === 'string' ? JSON.parse(data) : data;
        if (isActionMessage(object) && object.action) {
            if (!object.clientId || object.clientId === this.clientId) {
                (object.action as any)[receivedFromServerProperty] = true;
                this.logger.log(this, 'receiving', object);
                this.actionDispatcher.dispatch(object.action).then(() => {
                    this.storeNewModel(object.action);
                });
            }
        } else {
            this.logger.error(this, 'received data is not an action message', object);
        }
    }

    /**
     * Check whether the given action should be handled locally. Returns true if the action should
     * still be sent to the server, and false if it's only handled locally.
     */
    protected handleLocally(action: Action): boolean {
        this.storeNewModel(action);
        switch (action.kind) {
            case ComputedBoundsAction.KIND:
                return this.handleComputedBounds(action as ComputedBoundsAction);
            case RequestModelAction.KIND:
                return this.handleRequestModel(action as RequestModelAction);
            case RequestBoundsCommand.KIND:
                return false;
            case ExportSvgAction.KIND:
                return this.handleExportSvgAction(action as ExportSvgAction);
            case ServerStatusAction.KIND:
                return this.handleServerStateAction(action as ServerStatusAction);
        }
        return !(action as any)[receivedFromServerProperty];
    }

    /**
     * Put the new model contained in the given action into the model storage, if there is any.
     */
    protected storeNewModel(action: Action): void {
        if (action.kind === SetModelCommand.KIND
            || action.kind === UpdateModelCommand.KIND
            || action.kind === RequestBoundsCommand.KIND) {
            const newRoot = (action as any).newRoot;
            if (newRoot) {
                this.currentRoot = newRoot as SModelRootSchema;
                if (action.kind === SetModelCommand.KIND || action.kind === UpdateModelCommand.KIND) {
                    this.lastSubmittedModelType = newRoot.type;
                }
            }
        }
    }

    protected handleRequestModel(action: RequestModelAction): boolean {
        const newOptions = {
            needsClientLayout: this.viewerOptions.needsClientLayout,
            needsServerLayout: this.viewerOptions.needsServerLayout,
            ...action.options
        };
        const newAction = {
            ...action,
            options: newOptions
        };
        this.forwardToServer(newAction);
        return false;
    }

    /**
     * If the server requires to compute a layout, the computed bounds are forwarded. Otherwise they
     * are applied to the current model locally and a model update is triggered.
     */
    protected handleComputedBounds(action: ComputedBoundsAction): boolean {
        if (this.viewerOptions.needsServerLayout) {
            return true;
        } else {
            const root = this.currentRoot;
            this.computedBoundsApplicator.apply(root, action);
            if (root.type === this.lastSubmittedModelType) {
                this.actionDispatcher.dispatch(UpdateModelAction.create(root));
            } else {
                this.actionDispatcher.dispatch(SetModelAction.create(root));
            }
            this.lastSubmittedModelType = root.type;
            return false;
        }
    }

    protected handleExportSvgAction(action: ExportSvgAction): boolean {
        const blob = new Blob([action.svg], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "diagram.svg");
        return false;
    }

    protected handleServerStateAction(action: ServerStatusAction): boolean {
        return false;
    }

    commitModel(newRoot: SModelRootSchema): Promise<SModelRootSchema> | SModelRootSchema {
        const previousRoot = this.currentRoot;
        this.currentRoot = newRoot;
        return previousRoot;
    }
}

/**
 * @deprecated Use `DiagramServerProxy` instead.
 */
export const DiagramServer = DiagramServerProxy;
