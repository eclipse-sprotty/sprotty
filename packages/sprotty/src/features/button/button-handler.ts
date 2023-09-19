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

import { injectable, interfaces, multiInject, optional } from 'inversify';
import { Action } from 'sprotty-protocol/lib/actions';
import { InstanceRegistry } from '../../utils/registry';
import { TYPES } from '../../base/types';
import { SButtonImpl } from './model';
import { isInjectable } from '../../utils/inversify';

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
export function configureButtonHandler(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
    type: string, constr: interfaces.ServiceIdentifier<IButtonHandler>): void {
    if (typeof constr === 'function') {
        if (!isInjectable(constr)) {
            throw new Error(`Button handlers should be @injectable: ${constr.name}`);
        }
        if (!context.isBound(constr)) {
            context.bind(constr).toSelf();
        }
    }
    context.bind(TYPES.IButtonHandlerRegistration).toDynamicValue(ctx => ({
        TYPE: type,
        factory: () => ctx.container.get(constr)
    }));
}
