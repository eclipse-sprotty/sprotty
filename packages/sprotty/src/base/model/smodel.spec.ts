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
import { SChildElement, SModelIndex, SModelRoot, SModelElement, SModelElementSchema, SModelRootSchema } from './smodel';

describe('SModelRoot', () => {
    function setup() {
        const element = new SModelRoot();
        element.id = 'root';
        const child1 = new SChildElement();
        child1.id = 'child1';
        element.add(child1);
        const child2 = new SChildElement();
        child2.id = 'child2';
        element.add(child2);
        const child3 = new SChildElement();
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

describe('SModelIndex', () => {
    function setup() {
        const index = new SModelIndex<SModelElement>();
        const child1 = new SChildElement();
        child1.id = 'child1';
        index.add(child1);
        const child2 = new SChildElement();
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

    it('returns the parent element for an internal model', () => {
        const index = new SModelIndex<SModelElement>();
        const root = new SModelRoot(index);
        const parent = new SChildElement();
        parent.id = 'parent';
        root.add(parent);
        const child = new SChildElement();
        child.id = 'child';
        parent.add(child);
        expect((index as any).id2parent).to.be.undefined;
        expect(index.getParent(child.id)!.id).to.equal('parent');
    });

    it('returns the root element for an internal model', () => {
        const index = new SModelIndex<SModelElement>();
        const root = new SModelRoot(index);
        root.id = 'root';
        const parent = new SChildElement();
        parent.id = 'parent';
        root.add(parent);
        const child = new SChildElement();
        child.id = 'child';
        parent.add(child);
        expect((index as any).id2parent).to.be.undefined;
        expect(index.getRoot(child).id).to.equal('root');
    });

    it('returns the parent element for an external model', () => {
        const index = new SModelIndex<SModelElementSchema>();
        const root: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'parent',
                    children: [
                        {
                            type: 'node',
                            id: 'child'
                        }
                    ]
                }
            ]
        };
        index.add(root);
        expect(index.getParent('child')!.id).to.equal('parent');
    });

    it('returns the root element for an external model', () => {
        const index = new SModelIndex<SModelElementSchema>();
        const root: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'parent',
                    children: [
                        {
                            type: 'node',
                            id: 'child'
                        }
                    ]
                }
            ]
        };
        index.add(root);
        const child = root.children![0].children![0];
        expect(index.getRoot(child).id).to.equal('root');
    });
});
