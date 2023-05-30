/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
import { Deferred } from "./async";
import "mocha";
import { expect } from "chai";

describe('Deferred', () => {
    it('is in "unresolved" state after construction', () => {
        const deferred = new Deferred<void>();
        expect(deferred.state).to.be.equal('unresolved');
    });
    it('is in "resolved" state after deferred was resolved', async () => {
        const deferred = new Deferred<void>();
        expect(deferred.state).to.be.equal('unresolved');
        deferred.resolve(undefined);
        await deferred.promise;
        expect(deferred.state).to.be.equal('resolved');
    });
    it('is in "rejected" state after deferred was rejected', async () => {
        const deferred = new Deferred<void>();
        expect(deferred.state).to.be.equal('unresolved');
        deferred.reject('Error');
        try {
            await deferred.promise;
        } catch (err) {
            // expected error, do nothing
        }
        expect(deferred.state).to.be.equal('rejected');
    });
});

