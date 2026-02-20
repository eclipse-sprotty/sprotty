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

/**
 * @vitest-environment happy-dom
 */

"use strict";

import { describe, expect, it } from 'vitest';
import { VNode, h } from 'snabbdom';
import virtualize from './virtualize.js';

describe("virtualize (happy path)", () => {
    it("should convert a single node with no children", () => {
        expect(virtualizeHelper("<div />")).to.deep.equal(h("div"));
    });

    it("should convert a node with text node", () => {
        expect(virtualizeHelper("<div> Test. </div>")).to.deep.equal(
            h("div", [" Test. "])
        );
    });

    it("should convert nodes with children", () => {
        expect(virtualizeHelper("<div><span>a</span><span>b</span></div>")).to.deep.equal(
            h("div", [
                h("span", ["a"]),
                h("span", ["b"])
            ])
        );
    });

    it("should convert xml document", () => {
        expect(
            virtualizeHelper(
                "<book><title>The Three-Body Problem</title><author>Liu Cixin</author></book>"
            )
        ).to.deep.equal(
            h("book", [
                h("title", ["The Three-Body Problem"]),
                h("author", ["Liu Cixin"]),
            ])
        );
    });

    it("should convert a single node with attributes", () => {
        const element =
            '<div class="sprotty1 sprotty2" style="display: none !important; background-color: blue; font-weight: bold" data-test="test" />';
        expect(virtualizeHelper(element)).to.deep.equal(
            h("div", {
                class: {
                    sprotty1: true,
                    sprotty2: true,
                },
                style: {
                    backgroundColor: "blue",
                    display: "none",
                    fontWeight: "bold",
                },
                attrs: {
                    "data-test": "test",
                },
            })
        );
    });

    it("should ignore empty attributes", () => {
        expect(virtualizeHelper("<span style='' />")).to.deep.equal(h("span"));
        expect(virtualizeHelper("<span class='' />")).to.deep.equal(h("span"));
    });

    it("should handle control characters in attribute values", () => {
        const input = "<textarea placeholder=' Test1, \n\n Test2   '></textarea>";
        expect(virtualizeHelper(input)).to.deep.equal(
            h("textarea", {
                attrs: {
                    placeholder: " Test1,    Test2   ",
                },
            })
        );
    });

    it("should handle entities in attribute values", () => {
        const input =
            "<textarea placeholder='&amp; Test1, &gt; Test2   '></textarea>";
        expect(virtualizeHelper(input)).to.deep.equal(
            h("textarea", {
                attrs: {
                    placeholder: "& Test1, > Test2   ",
                },
            })
        );
    });

    it("should ignore comments", () => {
        expect(
            virtualizeHelper(
                "<div> <!-- comment A --> <span>Test1</span> <!-- Comment B --> Test2</div>"
            )
        ).to.deep.equal(h("div", [" ", " ", h("span", ["Test1"]), " ", " Test2"]));
    });
});

describe("virtualize (bad path)", () => {
    it("should return null when given null or empty string", () => {
        expect(virtualize()).to.be.null;
        expect(virtualize("")).to.be.null;
    });

    it("should return parser error when given a single text node", () => {
        const actual = virtualizeHelper("Text content!") as VNode;
        expect(actual?.sel).to.equal('parsererror');
    });
});

function virtualizeHelper(html?: string) {
    return virtualize(html);
}
