/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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

import { describe, expect, it } from 'vitest';
import { Container, decorate, inject, injectable } from 'inversify';
import { bindInjectable } from './inversify.js';

const DEPENDENCY = Symbol('Dependency');

@injectable()
class Decorated {
    constructor(@inject(DEPENDENCY) readonly dependency: string) { }
}

class ProgrammaticallyDecorated {
    constructor(@inject(DEPENDENCY) readonly dependency: string) { }
}
decorate(injectable(), ProgrammaticallyDecorated);

class Undecorated {
    constructor(readonly dependency: string) { }
}

class UndecoratedWithInjectedProperty {
    dependency: string;
}

function bind(constr: any): Container {
    const container = new Container();
    container.bind(DEPENDENCY).toConstantValue('injected');
    bindInjectable(container, constr, 'Views');
    return container;
}

describe('bindInjectable', () => {
    it('binds a decorated class to itself', () => {
        expect(bind(Decorated).get(Decorated).dependency).to.equal('injected');
    });

    it('binds a programmatically decorated class to itself', () => {
        expect(bind(ProgrammaticallyDecorated).get(ProgrammaticallyDecorated).dependency).to.equal('injected');
    });

    it('reports the sprotty concept and the expected decorators', () => {
        expect(() => bind(Undecorated)).to.throw(/Views must be decorated with @injectable\(\): Undecorated/);
        expect(() => bind(Undecorated)).to.throw(/@injectFromBase/);
    });

    it('preserves the original error as cause', () => {
        let cause: unknown;
        try {
            bind(Undecorated);
        } catch (error) {
            cause = (error as Error).cause;
        }
        expect(cause).to.be.an.instanceOf(Error);
    });

    it('leaves service identifiers that are not constructors alone', () => {
        expect(() => bindInjectable(new Container(), Symbol('NotAConstructor'), 'Views')).not.to.throw();
    });

    it('leaves an already bound constructor alone', () => {
        const container = new Container();
        container.bind(Undecorated).toConstantValue(new Undecorated('manual'));
        expect(() => bindInjectable(container, Undecorated, 'Views')).not.to.throw();
    });

    it('cannot detect a missing decorator when all dependencies are injected into properties', () => {
        // InversifyJS accepts the binding and resolves the properties to `undefined`; there is no
        // public API to detect this. Documented here so the limitation is not mistaken for a bug.
        expect(() => bind(UndecoratedWithInjectedProperty)).not.to.throw();
    });
});
