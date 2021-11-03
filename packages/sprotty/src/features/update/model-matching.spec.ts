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

import "reflect-metadata";
import "mocha";
import { expect } from "chai";
import { SModelRootSchema } from "../../base/model/smodel";
import { ModelMatcher } from "./model-matching";

describe('ModelMatcher', () => {
    it('finds new elements', () => {
        const modelMatcher = new ModelMatcher();
        const left: SModelRootSchema = {
            type: 't',
            id: 'root'
        };
        const right: SModelRootSchema = {
            type: 't',
            id: 'root',
            children: [
                {
                    type: 't',
                    id: 'child1'
                },
                {
                    type: 't',
                    id: 'child2'
                }
            ]
        };
        const result = modelMatcher.match(left, right);
        expect(result).to.have.all.keys(['root', 'child1', 'child2']);
        expect(result.root.left).to.equal(left);
        expect(result.root.right).to.equal(right);
        expect(result.child1).to.deep.equal({
            right: {
                type: 't',
                id: 'child1'
            },
            rightParentId: 'root'
        });
        expect(result.child2).to.deep.equal({
            right: {
                type: 't',
                id: 'child2'
            },
            rightParentId: 'root'
        });
    });

    it('finds deleted elements', () => {
        const modelMatcher = new ModelMatcher();
        const left: SModelRootSchema = {
            type: 't',
            id: 'root',
            children: [
                {
                    type: 't',
                    id: 'child1'
                },
                {
                    type: 't',
                    id: 'child2'
                }
            ]
        };
        const right: SModelRootSchema = {
            type: 't',
            id: 'root'
        };
        const result = modelMatcher.match(left, right);
        expect(result).to.have.all.keys(['root', 'child1', 'child2']);
        expect(result.root.left).to.equal(left);
        expect(result.root.right).to.equal(right);
        expect(result.child1).to.deep.equal({
            left: {
                type: 't',
                id: 'child1'
            },
            leftParentId: 'root'
        });
        expect(result.child2).to.deep.equal({
            left: {
                type: 't',
                id: 'child2'
            },
            leftParentId: 'root'
        });
    });

    it('matches elements with equal id', () => {
        const modelMatcher = new ModelMatcher();
        const left: SModelRootSchema = {
            type: 't',
            id: 'root',
            children: [
                {
                    type: 't',
                    id: 'child1',
                    children: [
                        {
                            type: 't',
                            id: 'child2'
                        }
                    ]
                }
            ]
        };
        const right: SModelRootSchema = {
            type: 't',
            id: 'root',
            children: [
                {
                    type: 't',
                    id: 'child2',
                    children: [
                        {
                            type: 't',
                            id: 'child1'
                        }
                    ]
                }
            ]
        };
        const result = modelMatcher.match(left, right);
        expect(result).to.have.all.keys(['root', 'child1', 'child2']);
        expect(result.root.left).to.equal(left);
        expect(result.root.right).to.equal(right);
        expect(result.child1).to.deep.equal({
            left: {
                type: 't',
                id: 'child1',
                children: [
                    {
                        type: 't',
                        id: 'child2'
                    }
                ]
            },
            leftParentId: 'root',
            right: {
                type: 't',
                id: 'child1'
            },
            rightParentId: 'child2'
        });
        expect(result.child2).to.deep.equal({
            left: {
                type: 't',
                id: 'child2'
            },
            leftParentId: 'child1',
            right: {
                type: 't',
                id: 'child2',
                children: [
                    {
                        type: 't',
                        id: 'child1'
                    }
                ]
            },
            rightParentId: 'root'
        });
    });
});
