/********************************************************************************
 * Copyright (c) 2019-2021 TypeFox and others.
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

import 'reflect-metadata';

import { Container, interfaces } from "inversify";

/**
 * The part of a DI container that the `configureX` utility functions need in order to add
 * bindings: either an Inversify `Container`, or the `bind`/`isBound` pair that a `ContainerModule`
 * callback receives.
 */
export type BindingContext =
    | Container
    | { bind: interfaces.Bind, isBound: interfaces.IsBound };

/**
 * A `BindingContext` that can also replace an existing binding.
 */
export type RebindingContext =
    | Container
    | { bind: interfaces.Bind, isBound: interfaces.IsBound, rebind: interfaces.Rebind };

export function isInjectable(constr: interfaces.Newable<unknown>| Function ): boolean {
    return Reflect.getMetadata('inversify:paramtypes', constr) !== undefined;
}
