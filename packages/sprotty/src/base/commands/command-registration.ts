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

import { Bind, injectable, IsBound, multiInject, optional } from "inversify";
import { Action } from "sprotty-protocol";
import { bindInjectable } from "../../utils/inversify.js";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer } from "../actions/action-handler.js";
import { TYPES } from "../types.js";
import { ICommand } from "./command.js";

export class CommandActionHandler implements IActionHandler {
    constructor(private commandRegistration: CommandRegistration) {
    }

    handle(action: Action): ICommand {
        return this.commandRegistration.factory(action);
    }
}

@injectable()
export class CommandActionHandlerInitializer implements IActionHandlerInitializer {

    constructor(@multiInject(TYPES.CommandRegistration) @optional() protected registrations: CommandRegistration[]) {
    }

    initialize(registry: ActionHandlerRegistry): void {
        this.registrations.forEach(registration =>
            registry.register(registration.kind, new CommandActionHandler(registration))
        );
    }
}

export interface CommandRegistration {
    kind: string
    factory: (a: Action) => ICommand
}

export interface ICommandConstructor<T extends Action> {
    KIND: string
    new (a: T, ...args: any[]): ICommand
}

/**
 * Carries the action a command is currently being created for. Bound once per container, it lets
 * `TYPES.Action` resolve for the duration of the synchronous `get` call that builds the command.
 * InversifyJS 8 offers no way to reach the container from a resolution, so a contextual binding
 * cannot be provided by a per-action child container any more.
 */
const ACTION_HOLDER = Symbol.for('ActionHolder');

interface ActionHolder {
    action?: Action
}

/**
 * Use this method in your DI configuration to register a new command to the diagram.
 */
export function configureCommand<T extends Action>(context: { bind: Bind, isBound: IsBound },
        constr: ICommandConstructor<T>) {
    bindInjectable(context, constr, 'Commands');
    if (!context.isBound(ACTION_HOLDER)) {
        context.bind<ActionHolder>(ACTION_HOLDER).toConstantValue({});
        context.bind<Action>(TYPES.Action).toDynamicValue(ctx => ctx.get<ActionHolder>(ACTION_HOLDER).action!);
    }
    context.bind(TYPES.CommandRegistration).toDynamicValue(ctx => ({
        kind: constr.KIND,
        factory: (action: Action) => {
            const holder = ctx.get<ActionHolder>(ACTION_HOLDER);
            // Restore rather than clear: property injection runs after the constructor body, so a
            // command constructor that dispatches an action must not blank the outer action.
            const previous = holder.action;
            holder.action = action;
            try {
                return ctx.get<ICommand>(constr);
            } finally {
                holder.action = previous;
            }
        }
    }));
}
