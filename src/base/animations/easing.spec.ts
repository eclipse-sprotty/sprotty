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
import { easeInOut } from "./easing";

describe('easing', () => {
    it('test in/out', () => {
        let lastValue = 0;
        for (let i = 0; i < 10; ++i) {
            const newValue = easeInOut(0.1 * i);
            expect(newValue).to.be.at.least(0);
            expect(newValue).to.be.at.most(1);
            expect(newValue).to.be.at.least(lastValue);
            lastValue = newValue;
        }
    });
});
