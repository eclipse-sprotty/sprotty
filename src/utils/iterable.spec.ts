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

import "mocha";
import { expect } from "chai";
import { FluentIterable, FluentIterableImpl, DONE_RESULT } from './iterable';

describe('FluentIterableImpl', () => {
    const iterable: FluentIterable<number> = new FluentIterableImpl(() => ({ n: 1 }), state => {
        if (state.n <= 4)
            return { done: false, value: state.n++ };
        else
            return DONE_RESULT;
    });

    it('iterates elements', () => {
        let result = 0;
        iterable.forEach(n => result += n);
        expect(result).to.equal(10);
    });

    it('filters elements', () => {
        let result = 0;
        iterable.filter(n => n % 2 === 0).forEach(n => result += n);
        expect(result).to.equal(6);
    });

    it('maps elements', () => {
        let result = 0;
        iterable.map(n => n + 0.5).forEach(n => result += n);
        expect(result).to.equal(12);
    });

    it('filters and maps elements', () => {
        let result = 0;
        iterable.filter(n => n % 2 === 0).map(n => n + 0.5).forEach(n => result += n);
        expect(result).to.equal(7);
    });
});
