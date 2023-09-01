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
import { Action, SetModelAction } from "sprotty-protocol/lib/actions";
import { CommandExecutionContext, ResetCommand } from "../commands/command";
import { SModelRootImpl } from "../model/smodel";
import { TYPES } from "../types";
import { InitializeCanvasBoundsCommand } from './initialize-canvas';

@injectable()
export class SetModelCommand extends ResetCommand {
    static readonly KIND = SetModelAction.KIND;

    oldRoot: SModelRootImpl;
    newRoot: SModelRootImpl;

    constructor(@inject(TYPES.Action) protected readonly action: SetModelAction) {
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
