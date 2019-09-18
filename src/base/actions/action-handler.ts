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

import { injectable, multiInject, optional, interfaces } from "inversify";
import { TYPES } from "../types";
import { MultiInstanceRegistry } from "../../utils/registry";
import { isInjectable } from "../../utils/inversify";
import { ICommand } from "../commands/command";
import { Action } from "./action";

/**
 * An action handler accepts an action and reacts to it by returning either a command to be
 * executed, or another action to be dispatched.
 */
export interface IActionHandler {
    handle(action: Action): ICommand | Action | void
}

/**
 * Used to bind an action kind to an action handler factory in the ActionHandlerRegistry.
 */
export interface ActionHandlerRegistration {
    actionKind: string
    factory: () => IActionHandler
}

/**
 * Initializes and registers an action handler for multiple action kinds. In most cases
 * `ActionHandlerRegistration` should be used instead.
 */
export interface IActionHandlerInitializer {
    initialize(registry: ActionHandlerRegistry): void
}

/**
 * The action handler registry maps actions to their handlers using the Action.kind property.
 */
@injectable()
export class ActionHandlerRegistry extends MultiInstanceRegistry<IActionHandler> {

    constructor(@multiInject(TYPES.ActionHandlerRegistration) @optional() registrations: ActionHandlerRegistration[],
                @multiInject(TYPES.IActionHandlerInitializer) @optional() initializers: IActionHandlerInitializer[]) {
        super();
        registrations.forEach(registration =>
            this.register(registration.actionKind, registration.factory())
        );
        initializers.forEach(initializer =>
            this.initializeActionHandler(initializer)
        );
    }

    initializeActionHandler(initializer: IActionHandlerInitializer): void {
        initializer.initialize(this);
    }
}

/**
 * Utility function to register an action handler for an action kind.
 */
export function configureActionHandler(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
        kind: string, constr: interfaces.ServiceIdentifier<IActionHandler>): void {
    if (typeof constr === 'function') {
        if (!isInjectable(constr)) {
            throw new Error(`Action handlers should be @injectable: ${constr.name}`);
        }
        if (!context.isBound(constr)) {
            context.bind(constr).toSelf();
        }
    }
    context.bind(TYPES.ActionHandlerRegistration).toDynamicValue(ctx => ({
        actionKind: kind,
        factory: () => ctx.container.get(constr)
    }));
}
