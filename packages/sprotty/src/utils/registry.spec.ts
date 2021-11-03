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

import 'mocha';
import { expect } from "chai";
import { InstanceRegistry, ProviderRegistry } from "./registry";

describe('ProviderRegistry', () => {
    function setup() {
        class Foo {
            constructor(public argument: string) {
            }
        }
        const registry = new ProviderRegistry<Foo, string>();
        registry.register('foo', Foo);
        return registry;
    }
    it('creates instances of registered classes', () => {
        const registry = setup();
        const value = registry.get('foo', 'bar');
        expect(value.argument).to.equal('bar');
    });
    it('does not contain deregistered classes', () => {
        const registry = setup();
        expect(registry.hasKey('foo')).to.be.true;
        registry.deregister('foo');
        expect(registry.hasKey('foo')).to.be.false;
    });
});

describe('InstanceRegistry', () => {
    function setup() {
        const registry = new InstanceRegistry<string>();
        registry.register('foo', 'bar');
        return registry;
    }
    it('returns the registered values', () => {
        const registry = setup();
        const value = registry.get('foo');
        expect(value).to.equal('bar');
    });
    it('does not contain deregistered classes', () => {
        const registry = setup();
        expect(registry.hasKey('foo')).to.be.true;
        registry.deregister('foo');
        expect(registry.hasKey('foo')).to.be.false;
    });
});
