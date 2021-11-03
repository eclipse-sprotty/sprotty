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

import { Action } from "../actions/action";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer } from "../actions/action-handler";
import { injectable, multiInject, optional, interfaces, Container } from "inversify";
import { isInjectable } from "../../utils/inversify";
import { ICommand } from "./command";
import { TYPES } from "../types";

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
 * Use this method in your DI configuration to register a new command to the diagram.
 */
export function configureCommand<T extends Action>(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
        constr: ICommandConstructor<T>) {
    if (!isInjectable(constr)) {
        throw new Error(`Commands should be @injectable: ${constr.name}`);
    }
    if (!context.isBound(constr)) {
        context.bind(constr).toSelf();
    }
    context.bind(TYPES.CommandRegistration).toDynamicValue(ctx => ({
        kind: constr.KIND,
        factory: (action: Action) => {
            const childContainer = new Container();
            childContainer.parent = ctx.container;
            childContainer.bind(TYPES.Action).toConstantValue(action);
            return childContainer.get<ICommand>(constr);
        }
    }));
}
