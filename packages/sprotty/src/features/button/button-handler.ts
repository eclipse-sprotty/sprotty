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

import { Bind, injectable, IsBound, multiInject, optional, ServiceIdentifier } from 'inversify';
import { Action } from 'sprotty-protocol';
import { TYPES } from '../../base/types.js';
import { bindInjectable } from '../../utils/inversify.js';
import { InstanceRegistry } from '../../utils/registry.js';
import { SButtonImpl } from './model.js';

export interface IButtonHandler {
    buttonPressed(button: SButtonImpl): (Action | Promise<Action>)[]
}

export interface IButtonHandlerRegistration {
    TYPE: string
    factory: () => IButtonHandler
}

@injectable()
export class ButtonHandlerRegistry extends InstanceRegistry<IButtonHandler> {

    constructor(
        @multiInject(TYPES.IButtonHandlerRegistration)@optional() buttonHandlerRegistrations: IButtonHandlerRegistration[]) {
        super();
        buttonHandlerRegistrations.forEach(factory => this.register(factory.TYPE, factory.factory()));
    }
}

/**
 * Utility function to register a button handler for an button type.
 */
export function configureButtonHandler(context: { bind: Bind, isBound: IsBound },
    type: string, constr: ServiceIdentifier<IButtonHandler>): void {
    bindInjectable(context, constr, 'Button handlers');
    context.bind(TYPES.IButtonHandlerRegistration).toDynamicValue(ctx => ({
        TYPE: type,
        factory: () => ctx.get(constr)
    }));
}
