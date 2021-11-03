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

import { injectable } from "inversify";

@injectable()
export class ProviderRegistry<T, U> {
    protected elements: Map<string, new (u: U) => T> = new Map;

    register(key: string, cstr: new (u: U) => T) {
        if (key === undefined)
            throw new Error('Key is undefined');
        if (this.hasKey(key))
            throw new Error('Key is already registered: ' + key);
        this.elements.set(key, cstr);
    }

    deregister(key: string) {
        if (key === undefined)
            throw new Error('Key is undefined');
        this.elements.delete(key);
    }

    hasKey(key: string): boolean {
        return this.elements.has(key);
    }

    get(key: string, arg: U): T {
        const existingCstr = this.elements.get(key);
        if (existingCstr)
            return new existingCstr(arg);
        else
            return this.missing(key, arg);
    }

    protected missing(key: string, arg: U): T | never {
        throw new Error('Unknown registry key: ' + key);
    }
}

@injectable()
export class FactoryRegistry<T, U> {
    protected elements: Map<string, (u: U) => T> = new Map;

    register(key: string, factory: (u: U) => T) {
        if (key === undefined)
            throw new Error('Key is undefined');
        if (this.hasKey(key))
            throw new Error('Key is already registered: ' + key);
        this.elements.set(key, factory);
    }

    deregister(key: string) {
        if (key === undefined)
            throw new Error('Key is undefined');
        this.elements.delete(key);
    }

    hasKey(key: string): boolean {
        return this.elements.has(key);
    }

    get(key: string, arg: U): T {
        const existingFactory = this.elements.get(key);
        if (existingFactory)
            return existingFactory(arg);
        else
            return this.missing(key, arg);
    }

    protected missing(key: string, arg: U): T | never {
        throw new Error('Unknown registry key: ' + key);
    }
}

@injectable()
export class InstanceRegistry<T> {
    protected elements: Map<string, T> = new Map;

    register(key: string, instance: T) {
        if (key === undefined)
            throw new Error('Key is undefined');
        if (this.hasKey(key))
            throw new Error('Key is already registered: ' + key);
        this.elements.set(key, instance);
    }

    deregister(key: string) {
        if (key === undefined)
            throw new Error('Key is undefined');
        this.elements.delete(key);
    }

    hasKey(key: string): boolean {
        return this.elements.has(key);
    }

    get(key: string): T {
        const existingInstance = this.elements.get(key);
        if (existingInstance)
            return existingInstance;
        else
            return this.missing(key);
    }

    protected missing(key: string): T | never {
        throw new Error('Unknown registry key: ' + key);
    }
}

@injectable()
export class MultiInstanceRegistry<T> {
    protected elements: Map<string, T[]> = new Map;

    register(key: string, instance: T) {
        if (key === undefined)
            throw new Error('Key is undefined');
        const instances = this.elements.get(key);
        if (instances !== undefined)
            instances.push(instance);
        else
            this.elements.set(key, [instance]);
    }

    deregisterAll(key: string) {
        if (key === undefined)
            throw new Error('Key is undefined');
        this.elements.delete(key);
    }

    get(key: string): T[] {
        const existingInstances = this.elements.get(key);
        if (existingInstances !== undefined)
            return existingInstances;
        else
            return [];
    }
}
