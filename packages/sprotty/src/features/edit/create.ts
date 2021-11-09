/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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
import { Action } from "sprotty-protocol/lib/actions";
import { SModelElement as SModelElementSchema } from 'sprotty-protocol/lib/model';
import { Command, CommandExecutionContext, CommandReturn } from "../../base/commands/command";
import { SParentElement, SChildElement } from "../../base/model/smodel";
import { TYPES } from "../../base/types";

/**
 * Create an element with the given schema and add it to the diagram.
 */
 export interface CreateElementAction extends Action {
    kind: typeof CreateElementAction.KIND
    containerId: string
    elementSchema: SModelElementSchema
}
export namespace CreateElementAction {
    export const KIND = "createElement";

    export function create(elementSchema: SModelElementSchema, options: { containerId: string }): CreateElementAction {
        return {
            kind: KIND,
            elementSchema,
            containerId: options.containerId
        };
    }
}

@injectable()
export class CreateElementCommand extends Command {
    static readonly KIND = CreateElementAction.KIND;

    container: SParentElement;
    newElement: SChildElement;

    constructor(@inject(TYPES.Action) protected readonly action: CreateElementAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const container = context.root.index.getById(this.action.containerId);
        if (container instanceof SParentElement) {
            this.container = container;
            this.newElement = context.modelFactory.createElement(this.action.elementSchema);
            this.container.add(this.newElement);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        this.container.remove(this.newElement);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        this.container.add(this.newElement);
        return context.root;
    }
}
