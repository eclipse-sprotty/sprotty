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

import { expect, describe, it } from 'vitest';
import { SChildElementImpl, ModelIndexImpl, SModelRootImpl } from './smodel';

describe('SModelRootImpl', () => {
    function setup() {
        const element = new SModelRootImpl();
        element.id = 'root';
        const child1 = new SChildElementImpl();
        child1.id = 'child1';
        element.add(child1);
        const child2 = new SChildElementImpl();
        child2.id = 'child2';
        element.add(child2);
        const child3 = new SChildElementImpl();
        child3.id = 'child3';
        element.add(child3);
        return element;
    }

    it('contains children after adding them', () => {
        const element = setup();
        expect(element.children.map(c => c.id)).to.deep.equal(['child1', 'child2', 'child3']);
    });

    it('can reorder children', () => {
        const element = setup();
        element.move(element.children[1], 2);
        expect(element.children.map(c => c.id)).to.deep.equal(['child1', 'child3', 'child2']);
        element.move(element.children[1], 0);
        expect(element.children.map(c => c.id)).to.deep.equal(['child3', 'child1', 'child2']);
    });

    it('can remove children', () => {
        const element = setup();
        element.remove(element.children[1]);
        expect(element.children.map(c => c.id)).to.deep.equal(['child1', 'child3']);
    });

    it('correctly assigns the parent to children', () => {
        const element = setup();
        expect(element.children[0].parent.id).to.equal('root');
        expect(element.children[2].parent.id).to.equal('root');
    });
});

describe('ModelIndexImpl', () => {
    function setup() {
        const index = new ModelIndexImpl();
        const child1 = new SChildElementImpl();
        child1.id = 'child1';
        index.add(child1);
        const child2 = new SChildElementImpl();
        child2.id = 'child2';
        index.add(child2);
        return {index, child1, child2};
    }

    it('contains elements after adding them', () => {
        const ctx = setup();
        expect(ctx.index.contains(ctx.child1)).to.be.true;
        expect(ctx.index.getById('child1')!.id).to.equal('child1');
    });

    it('does not contain elements after removing them', () => {
        const ctx = setup();
        ctx.index.remove(ctx.child2);
        expect(ctx.index.contains(ctx.child2)).to.be.false;
        expect(ctx.index.getById('child2')).to.be.undefined;
    });
});
