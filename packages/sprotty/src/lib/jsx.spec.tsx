/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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
import { svg } from './jsx';

import 'mocha';
import { expect } from 'chai';
import { h } from 'snabbdom';

const svgNS = 'http://www.w3.org/2000/svg'

describe("JSX", () => {
    it("should set namespace even for empty svg elements with no attributes", () => {
        expect(<g/>).to.deep.equal(
            h('g', {
                ns: svgNS
            },
            [])
        );
    });

    it("should convert prefixes of the jsx attribute to the key of the vnode", () => {
        const style = { fontWeight: 'bold' };
        const callback = () => null;
        const element = <g>
            <rect
                style={style}
                style-color='red'
                class-sprotty-rect={true}
                on-click={callback}/>
            </g>;

        expect(element.children[0]).to.deep.equal(
            h('rect', {
                ns: svgNS,
                on: { click: callback },
                style: { fontWeight: 'bold', color: 'red' },
                class: { 'sprotty-rect': true }
            },
            [])
        );
    })
})
