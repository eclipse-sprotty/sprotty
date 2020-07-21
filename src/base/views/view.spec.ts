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

import 'reflect-metadata';
import 'mocha';
import { expect } from "chai";
import { Container } from 'inversify';
import { TYPES } from '../types';
import { EMPTY_ROOT, SModelFactory } from '../model/smodel-factory';
import { SNode } from "../../graph/sgraph";
import { EmptyView, MissingView } from "./view";
import { ModelRenderer } from "./viewer";
import defaultModule from "../di.config";

const toHTML = require('snabbdom-to-html');

describe('base views', () => {
    const container = new Container();
    container.load(defaultModule);

    const modelFactory = container.get<SModelFactory>(TYPES.IModelFactory);
    const emptyRoot = modelFactory.createRoot(EMPTY_ROOT);
    const context = new ModelRenderer(undefined!, 'main', []);

    it('empty view', () => {
        const emptyView = new EmptyView();
        const vnode = emptyView.render(emptyRoot, context);
        const html = toHTML(vnode);
        expect(html).to.be.equal('<svg class="sprotty-empty"></svg>');
    });

    const missingView = new MissingView;

    it('missing view', () => {
        const vnode = missingView.render(emptyRoot, context);
        expect(toHTML(vnode)).to.be.equal('<text class="sprotty-missing" x="0" y="0">?EMPTY?</text>');
        const model = new SNode();
        model.bounds = {
            x: 42,
            y: 41,
            width: 0,
            height: 0
        };
        model.id = 'foo';
        model.type = 'type';
        const vnode1 = missingView.render(model, context);
        expect(toHTML(vnode1)).to.be.equal('<text class="sprotty-missing" x="42" y="41">?foo?</text>');
    });
});
