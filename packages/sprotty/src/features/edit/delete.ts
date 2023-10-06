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

import { inject, injectable } from 'inversify';
import { DeleteElementAction } from 'sprotty-protocol/lib/actions';
import { Command, CommandExecutionContext, CommandReturn } from '../../base/commands/command';
import { SModelElementImpl, SParentElementImpl, SChildElementImpl } from '../../base/model/smodel';
import { TYPES } from '../../base/types';

export const deletableFeature = Symbol('deletableFeature');

/**
 *  Feature extension interface for {@link deletableFeature}.
 */
export interface Deletable {
}

export function isDeletable<T extends SModelElementImpl>(element: T): element is T & Deletable & SChildElementImpl {
    return element instanceof SChildElementImpl && element.hasFeature(deletableFeature);
}

export class ResolvedDelete {
    child: SChildElementImpl;
    parent: SParentElementImpl;
}

@injectable()
export class DeleteElementCommand extends Command {
    static readonly KIND = DeleteElementAction.KIND;

    resolvedDeletes: ResolvedDelete[] = [];

    constructor(@inject(TYPES.Action) protected readonly action: DeleteElementAction) {
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
