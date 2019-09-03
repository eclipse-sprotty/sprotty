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
import { Action } from "../../base/actions/action";
import { Command, CommandExecutionContext, CommandReturn } from "../../base/commands/command";
import { TYPES } from "../../base/types";
import { SRoutableElement } from "../routing/model";
import { EdgeMemento, EdgeRouterRegistry } from "../routing/routing";

export class ReconnectAction implements Action {
    static readonly KIND = 'reconnect';
    readonly kind =  ReconnectAction.KIND;

    constructor(readonly routableId: string,
                readonly newSourceId?: string,
                readonly newTargetId?: string) {}
}

@injectable()
export class ReconnectCommand extends Command {
    static readonly KIND = ReconnectAction.KIND;

    @inject(EdgeRouterRegistry) edgeRouterRegistry: EdgeRouterRegistry;

    memento: EdgeMemento | undefined;

    constructor(@inject(TYPES.Action) protected readonly action: ReconnectAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.doExecute(context);
        return context.root;
    }

    private doExecute(context: CommandExecutionContext) {
        const index = context.root.index;
        const edge = index.getById(this.action.routableId);
        if (edge instanceof SRoutableElement) {
            const router = this.edgeRouterRegistry.get(edge.routerKind);
            const before = router.takeSnapshot(edge);
            router.applyReconnect(edge, this.action.newSourceId, this.action.newTargetId);
            const after = router.takeSnapshot(edge);
            this.memento = {
                edge: edge,
                before,
                after
            };
        }
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.memento) {
            const router = this.edgeRouterRegistry.get(this.memento.edge.routerKind);
            router.applySnapshot(this.memento.edge, this.memento.before);
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.memento) {
            const router = this.edgeRouterRegistry.get(this.memento.edge.routerKind);
            router.applySnapshot(this.memento.edge, this.memento.after);
        }
        return context.root;
    }
}
