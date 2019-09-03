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

import { Command, CommandExecutionContext, CommandReturn } from "../../base/commands/command";
import { Action } from "../../base/actions/action";
import { SModelElement, SParentElement, SChildElement } from "../../base/model/smodel";
import { SModelExtension } from "../../base/model/smodel-extension";
import { TYPES } from "../../base/types";
import { inject, injectable } from "inversify";

export const deletableFeature = Symbol('deletableFeature');

export interface Deletable extends SModelExtension {
}

export function isDeletable<T extends SModelElement>(element: T): element is T & Deletable & SChildElement {
    return element instanceof SChildElement && element.hasFeature(deletableFeature);
}

export class DeleteElementAction implements Action {
    static readonly KIND = 'delete';
    kind = DeleteElementAction.KIND;

    constructor(readonly elementIds: string[]) {}
}

export class ResolvedDelete {
    child: SChildElement;
    parent: SParentElement;
}

@injectable()
export class DeleteElementCommand extends Command {
    static readonly KIND = DeleteElementAction.KIND;

    resolvedDeletes: ResolvedDelete[] = [];

    constructor(@inject(TYPES.Action) protected readonly action: DeleteElementAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        for (const id of this.action.elementIds) {
            const element = index.getById(id);
            if (element && isDeletable(element)) {
                this.resolvedDeletes.push({ child: element, parent: element.parent });
                element.parent.remove(element);
            }
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        for (const resolvedDelete of this.resolvedDeletes)
            resolvedDelete.parent.add(resolvedDelete.child);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        for (const resolvedDelete of this.resolvedDeletes)
            resolvedDelete.parent.remove(resolvedDelete.child);
        return context.root;
    }
}
