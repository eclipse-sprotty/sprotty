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
import {
    Action, generateRequestId, RequestAction, ResponseAction,
    RequestModelAction as ProtocolRequestModelAction, SetModelAction as ProtocolSetModelAction
} from "sprotty-protocol/lib/actions";
import { SModelRoot as SModelRootSchema } from 'sprotty-protocol/lib/model';
import { JsonPrimitive } from "sprotty-protocol/lib/utils/json";
import { CommandExecutionContext, ResetCommand } from "../commands/command";
import { SModelRootImpl } from "../model/smodel";
import { TYPES } from "../types";
import { InitializeCanvasBoundsCommand } from './initialize-canvas';

/**
 * Sent from the client to the model source (e.g. a DiagramServer) in order to request a model. Usually this
 * is the first message that is sent to the source, so it is also used to initiate the communication.
 * The response is a SetModelAction or an UpdateModelAction.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class RequestModelAction implements ProtocolRequestModelAction {
    static readonly KIND = 'requestModel';
    readonly kind = RequestModelAction.KIND;

    constructor(public readonly options?: { [key: string]: JsonPrimitive },
        public readonly requestId = '') { }

    /** Factory function to dispatch a request with the `IActionDispatcher` */
    static create(options?: { [key: string]: JsonPrimitive }): RequestAction<SetModelAction> {
        return new RequestModelAction(options, generateRequestId());
    }
}

/**
 * Sent from the model source to the client in order to set the model. If a model is already present, it is replaced.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class SetModelAction implements ResponseAction, ProtocolSetModelAction {
    static readonly KIND = 'setModel';
    readonly kind = SetModelAction.KIND;

    constructor(public readonly newRoot: SModelRootSchema,
        public readonly responseId = '') { }
}

@injectable()
export class SetModelCommand extends ResetCommand {
    static readonly KIND = ProtocolSetModelAction.KIND;

    oldRoot: SModelRootImpl;
    newRoot: SModelRootImpl;

    constructor(@inject(TYPES.Action) protected readonly action: ProtocolSetModelAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRootImpl {
        this.oldRoot = context.modelFactory.createRoot(context.root);
        this.newRoot = context.modelFactory.createRoot(this.action.newRoot);
        return this.newRoot;
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        return this.oldRoot;
    }

    redo(context: CommandExecutionContext): SModelRootImpl {
        return this.newRoot;
    }

    get blockUntil(): (action: Action) => boolean {
        return action => action.kind === InitializeCanvasBoundsCommand.KIND;
    }
}
