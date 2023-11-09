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

 /** @jsx svg */
import { svg } from '../../lib/jsx';

import { expect, describe, it } from 'vitest';
import { init } from "snabbdom";
import { SModelElementImpl } from "../model/smodel";
import { ModelRenderer } from './viewer';
import { ThunkView } from './thunk-view';
import toHTML from 'snabbdom-to-html';

/**
 * @vitest-environment happy-dom
 */
describe('ThunkView', () => {
    let renderCount = 0;

    class Foo extends SModelElementImpl {
        foo: string;
    }

    class FooView extends ThunkView {
        doRender() {
           return  <g id={renderCount++}></g>;
        }

        selector() {
            return 'g';
        }

        watchedArgs(foo: Foo) {
            return [foo.foo];
        }
    }

    const context = new ModelRenderer(undefined!, 'main', []);

    const patcher = init([]);

    it('renders on change', () => {
        const element = new Foo();
        element.foo = 'first';
        const view = new FooView();
        const vnode = view.render(element, context);
        const domElement =
        document.createElement('div');
        domElement.setAttribute('id', 'sprotty');
        patcher(domElement, vnode);
        expect(toHTML(vnode)).to.be.equal('<g id="0"></g>');

        const vnode1 = view.render(element, context);
        patcher(vnode, vnode1);
        expect(toHTML(vnode1)).to.be.equal('<g id="0"></g>');

        element.foo = 'second';
        const vnode2 = view.render(element, context);
        patcher(vnode1, vnode2);
        expect(toHTML(vnode2)).to.be.equal('<g id="1"></g>');
    });
});
