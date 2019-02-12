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
import { Command, CommandExecutionContext, CommandResult } from "../base/commands/command";
import { TYPES } from "../base/types";
import { ModelSource } from "./model-source";
import { SModelRootSchema } from "../base/model/smodel";
import { IModelFactory } from "../base/model/smodel-factory";

/**
 * Commit the current SModel back to the model source.
 *
 * The SModel (AKA internal model) contains a lot of dirty/transitional state, such
 * as intermediate move postions or handles. When a user interaction that spans multiple
 * commands finishes, it fires a CommitModelAction to write the final changes back to
 * the model source.
 */
export class CommitModelAction {
    kind = CommitModelCommand.KIND;
}

@injectable()
export class CommitModelCommand extends Command {
    static KIND = 'commitModel';

    @inject(TYPES.IModelFactory) modelFactory: IModelFactory;
    @inject(TYPES.ModelSource) modelSource: ModelSource;

    originalModel: SModelRootSchema;
    newModel: SModelRootSchema;

    constructor(@inject(TYPES.Action) action: CommitModelAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        this.newModel = this.modelFactory.createSchema(context.root);
        this.originalModel = this.modelSource.commitModel(this.newModel);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandResult {
        this.modelSource.commitModel(this.originalModel);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        this.modelSource.commitModel(this.newModel);
        return context.root;
    }
}
