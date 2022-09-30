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

export function isObject(data: unknown): data is Record<PropertyKey, unknown> {
    return typeof data === 'object' && data !== null;
}

export type TypeOf<T> =
    T extends number ? 'number'
    : T extends string ? 'string'
    : T extends boolean ? 'boolean'
    : T extends bigint ? 'bigint'
    : T extends symbol ? 'symbol'
    : T extends Function ? 'function'
    : T extends object ? 'object'
    : 'undefined';

export function hasOwnProperty<K extends PropertyKey, T>(arg: unknown, key: K | K[], type?: TypeOf<T> | ((v: unknown) => v is T)): arg is Record<K, T> {
    if (!isObject(arg)) {
        return false;
    }
    if (Array.isArray(key)) {
        for (const k of key) {
            if (!Object.prototype.hasOwnProperty.call(arg, k)) {
                return false;
            }
            if (typeof type === 'string' && typeof arg[k] !== type) {
                return false;
            } else if (typeof type === 'function' && !type(arg[k])) {
                return false;
            }
        }
    } else {
        if (!Object.prototype.hasOwnProperty.call(arg, key)) {
            return false;
        }
        if (typeof type === 'string') {
            return typeof arg[key] === type;
        }
        if (typeof type === 'function') {
            return type(arg[key]);
        }
    }
    return true;
}

export function safeAssign<T extends {}>(target: T, partial: Partial<T>): T {
    return Object.assign(target, partial);
}
