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
import { almostEquals } from 'sprotty-protocol/lib/utils/geometry';
import { PointToPointLine } from "./geometry";

describe('PointToPointLine', () => {
    describe('angle', () => {
        it('computes a 45° angle correctly', () => {
            expect(almostEquals(new PointToPointLine({ x: 0, y: 0 }, { x: 1, y: 1 }).angle, Math.PI / 4)).to.be.true;
        });
        it('computes a 90° angle correctly', () => {
            expect(almostEquals(new PointToPointLine({ x: 0, y: 0 }, { x: 0, y: 1 }).angle, Math.PI / 2)).to.be.true;
            expect(almostEquals(new PointToPointLine({ x: 0, y: 0 }, { x: 0, y: -1 }).angle, -Math.PI / 2)).to.be.true;
        });
        it('computes a 180° angle correctly', () => {
            expect(almostEquals(new PointToPointLine({ x: 0, y: 0 }, { x: 1, y: 0 }).angle, 0)).to.be.true;
            expect(almostEquals(new PointToPointLine({ x: 0, y: 0 }, { x: -1, y: 0 }).angle, -Math.PI)).to.be.true;
        });
    });
    describe('intersection', () => {
        it('finds intersection of crossing lines', () => {
            const lineA = new PointToPointLine({ x: 0, y: 0 }, { x: 1, y: 1 });
            const lineB = new PointToPointLine({ x: 1, y: 0 }, { x: 0, y: 1 });
            const intersection = lineA.intersection(lineB);
            expect(intersection!.x).to.equal(0.5);
            expect(intersection!.y).to.equal(0.5);
        });
        it('returns `undefined` for parallel lines', () => {
            const lineA = new PointToPointLine({ x: 0, y: 0 }, { x: 1, y: 0 });
            const lineB = new PointToPointLine({ x: 0, y: 1 }, { x: 1, y: 1 });
            const intersection = lineA.intersection(lineB);
            expect(intersection).to.be.undefined;
        });
    });
});
