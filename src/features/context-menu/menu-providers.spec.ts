/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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

import { ContextMenuProviderRegistry } from "./menu-providers";
import { SModelRoot } from "../../base/model/smodel";

describe('ContextMenuProviderRegistry', () => {

    it('should return no items if there are no providers', async () => {
        const reg = new ContextMenuProviderRegistry();
        expect(await reg.getItems(new SModelRoot())).to.be.empty;
    });

    it('should return no items with empty list of providers', async () => {
        const reg = new ContextMenuProviderRegistry([]);
        expect(await reg.getItems(new SModelRoot())).to.be.empty;
    });

    it('should return the union of elements of all providers', async () => {
        const reg = new ContextMenuProviderRegistry([
            {
                getItems(root) {
                    return Promise.resolve([
                        {
                            id: "one",
                            label: "One",
                            actions: []
                        }
                    ]);
                }
            },
            {
                getItems(root) {
                    return Promise.resolve([
                        {
                            id: "two",
                            label: "Two",
                            actions: []
                        },
                        {
                            id: "three",
                            label: "Three",
                            actions: []
                        }
                    ]);
                }
            }
        ]);
        const items = await reg.getItems(new SModelRoot());
        expect(items).to.lengthOf(3);
        expect(items[0].id).to.equals('one');
        expect(items[1].id).to.equals('two');
        expect(items[2].id).to.equals('three');
    });

    it('should restructure items accoriding to parent IDs', async () => {
        const reg = new ContextMenuProviderRegistry([
            {
                getItems(root) {
                    return Promise.resolve([
                        {
                            id: "one",
                            label: "One",
                            actions: [],
                            children: [
                                {
                                    id: "childOne",
                                    label: "ChildOne",
                                    actions: []
                                }
                            ]
                        }
                    ]);
                }
            },
            {
                getItems(root) {
                    return Promise.resolve([
                        {
                            id: "childTwo",
                            label: "ChildTwo",
                            parentId: "one",
                            actions: []
                        }
                    ]);
                }
            },
            {
                getItems(root) {
                    return Promise.resolve([
                        {
                            id: "grandChildOne",
                            label: "GrandChildOne",
                            parentId: "one.childTwo",
                            actions: []
                        }
                    ]);
                }
            }
        ]);
        const items = await reg.getItems(new SModelRoot());
        expect(items).to.lengthOf(1);
        expect(items[0].id).to.equal('one');
        expect(items[0].children).to.lengthOf(2);
        expect(items[0].children![0].id).to.equal("childOne");
        expect(items[0].children![1].id).to.equal("childTwo");
        expect(items[0].children![1].children).to.lengthOf(1);
        expect(items[0].children![1].children![0].id).to.equal("grandChildOne");
    });

});
