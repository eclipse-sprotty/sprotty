/********************************************************************************
 * Copyright (c) 2019 TypeFox and others.
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

import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { SystemCommand, CommandExecutionContext, CommandReturn } from "./command";
import { ResponseAction } from "../actions/action";
import { IActionDispatcher } from "../actions/action-dispatcher";

/**
 * A command that does not modify the internal model, but retrieves information
 * from it by dispatching a response action.
 */
@injectable()
export abstract class ModelRequestCommand extends SystemCommand {

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;

    execute(context: CommandExecutionContext): CommandReturn {
        const result = this.retrieveResult(context);
        this.actionDispatcher.dispatch(result);
        return { model: context.root, modelChanged: false };
    }

    protected abstract retrieveResult(context: CommandExecutionContext): ResponseAction;

    undo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root, modelChanged: false };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root, modelChanged: false };
    }
}
