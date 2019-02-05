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

import { injectable, multiInject, optional } from "inversify";
import { TYPES } from "../types";
import { MultiInstanceRegistry } from "../../utils/registry";
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
 * Initializes and registers action handlers.
 */
export interface IActionHandlerInitializer {
    initialize(registry: ActionHandlerRegistry): void
}

/**
 * The action handler registry maps actions to their handlers using the Action.kind property.
 */
@injectable()
export class ActionHandlerRegistry extends MultiInstanceRegistry<IActionHandler> {

    constructor(@multiInject(TYPES.IActionHandlerInitializer) @optional() initializers: (IActionHandlerInitializer)[]) {
        super();

        initializers.forEach(
            initializer => this.initializeActionHandler(initializer)
        );
    }

    initializeActionHandler(initializer: IActionHandlerInitializer): void {
        initializer.initialize(this);
    }
}
