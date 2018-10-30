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

import { Action } from "../../base/actions/action";
import { Command, CommandExecutionContext, CommandResult } from "../../base/commands/command";
import { SParentElement, SChildElement } from "../../base/model/smodel";
import { SEdgeSchema } from "../../graph/sgraph";

export class CreateElementAction implements Action {
    readonly kind = CreateElementCommand.KIND;

    constructor(readonly containerId: string, readonly edgeSchema: SEdgeSchema) {}
}

export class CreateElementCommand extends Command {
    static readonly KIND = "createElement";

    container: SParentElement;
    newElement: SChildElement;

    constructor(readonly action: CreateElementAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        const container = context.root.index.getById(this.action.containerId);
        if (container instanceof SParentElement) {
            this.container = container;
            this.newElement = context.modelFactory.createElement(this.action.edgeSchema);
            this.container.add(this.newElement);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandResult {
        this.container.remove(this.newElement);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        this.container.add(this.newElement);
        return context.root;
    }
}
