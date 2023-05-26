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
import { SNodeImpl } from "../../graph/sgraph";
import { EmptyView, findArgValue, MissingView } from "./view";
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
        const model = new SNodeImpl();
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

describe('findArgValue', () => {

    interface TestType {
        value: string;
    }

    const arg = {
        foo: 'foo',
        parentArgs: {
            bar: true,
            parentArgs: {
                fooBar: <TestType>{
                    value: 'value'
                }
            }
        }
    };

    it('returns undefined for missing keys', () => {
        expect(findArgValue(arg, 'missing')).to.be.undefined;
    });

    it('returns the value if found on first level', () => {
        expect(findArgValue(arg, 'foo')).to.equal('foo');
    });

    it('returns the value if found on second level', () => {
        expect(findArgValue(arg, 'bar')).to.equal(true);
    });

    it('returns the value if found on third level', () => {
        expect(findArgValue(arg, 'fooBar')).to.deep.equal({ value: 'value' });
    });

    it('returns the complex value if found on third level', () => {
        const myObject = findArgValue<TestType>(arg, 'fooBar');
        expect(myObject?.value).to.equal('value');
    });

    it('returns undefined for a type if missing', () => {
        const myObject = findArgValue<TestType>(arg, 'missing');
        expect(myObject).to.be.undefined;
    });

    it('should return undefined if args are undefined', () => {
        expect(findArgValue(undefined, 'whatever')).to.be.undefined;
    });

});
