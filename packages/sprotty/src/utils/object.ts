/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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

// Compatibility deprecation layer (will be removed with the graduation 1.0.0 release)

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export function isObject(data: unknown): data is Record<PropertyKey, unknown> {
    return typeof data === 'object' && data !== null;
}

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
 export type TypeOf<T> =
    T extends number ? 'number'
    : T extends string ? 'string'
    : T extends boolean ? 'boolean'
    : T extends bigint ? 'bigint'
    : T extends symbol ? 'symbol'
    : T extends Function ? 'function'
    : T extends object ? 'object'
    : 'undefined';

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
 export function hasOwnProperty<K extends PropertyKey, T>(arg: unknown, key: K, type?: TypeOf<T> | ((v: unknown) => v is T)): arg is Record<K, T> {
    if (!(isObject(arg) && Object.prototype.hasOwnProperty.call(arg, key))) {
        return false;
    }
    if (typeof type === 'string') {
        return typeof arg[key] === type;
    }
    if (typeof type === 'function') {
        return type(arg[key]);
    }
    return true;
}

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
 export function safeAssign<T extends {}>(target: T, partial: Partial<T>): T {
    return Object.assign(target, partial);
}
