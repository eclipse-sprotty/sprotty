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

import { InstanceRegistry } from '../../utils/registry';
import { SButton } from './model';
import { Action } from '../../base/actions/action';
import { injectable, multiInject, optional } from 'inversify';
import { TYPES } from '../../base/types';

export interface IButtonHandler {
    buttonPressed(button: SButton): Action[]
}

export interface IButtonHandlerFactory {
    TYPE: string
    new(): IButtonHandler
}

@injectable()
export class ButtonHandlerRegistry extends InstanceRegistry<IButtonHandler> {

    constructor(@multiInject(TYPES.IButtonHandler)@optional() buttonHandlerFactories: IButtonHandlerFactory[]) {
        super();
        buttonHandlerFactories.forEach(factory => this.register(factory.TYPE, new factory()));
    }
}
