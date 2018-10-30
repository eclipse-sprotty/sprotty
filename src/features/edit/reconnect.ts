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

import { Routable, isRoutable } from "./model";
import { SModelElement } from "../../base/model/smodel";
import { Action } from "../../base/actions/action";
import { Command, CommandExecutionContext, CommandResult } from "../../base/commands/command";

export const connectableFeature = Symbol('connectableFeature');

export interface Connectable {
    canConnect(routable: Routable, role: 'source' | 'target'): boolean;
}

export function isConnectable<T extends SModelElement>(element: T): element is Connectable & T {
    return element.hasFeature(connectableFeature) && (element as any).canConnect;
}


export class ReconnectAction implements Action {
    readonly kind =  ReconnectCommand.KIND;

    constructor(readonly routableId: string,
                readonly newSourceId?: string,
                readonly newTargetId?: string) {}
}

export class ReconnectCommand extends Command {
    static KIND = 'reconnect';

    routable?: Routable;
    newSource?: SModelElement;
    newTarget?: SModelElement;
    oldSource?: SModelElement;
    oldTarget?: SModelElement;

    constructor(readonly action: ReconnectAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        this.resolve(context);
        this.doExecute();
        return context.root;
    }

    private resolve(context: CommandExecutionContext) {
        const routable = context.root.index.getById(this.action.routableId);
        if (routable && isRoutable(routable)) {
            this.routable = routable;
            if (this.action.newSourceId) {
                this.newSource = context.root.index.getById(this.action.newSourceId);
                this.oldSource = routable.source;
            }
            if (this.action.newTargetId) {
                this.newTarget = context.root.index.getById(this.action.newTargetId);
                this.oldTarget = routable.target;
            }
        }
    }

    private doExecute() {
        if (this.routable) {
            if (this.newSource)
                this.routable.sourceId = this.newSource.id;
            if (this.newTarget)
                this.routable.targetId = this.newTarget.id;
        }
    }

    undo(context: CommandExecutionContext): CommandResult {
        if (this.routable) {
            if (this.oldSource)
                this.routable.sourceId = this.oldSource.id;
            if (this.oldTarget)
                this.routable.targetId = this.oldTarget.id;
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        this.doExecute();
        return context.root;
    }
}
