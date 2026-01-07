"use strict";
/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactBoundsUpdater = void 0;
const inversify_1 = require("inversify");
const sprotty_1 = require("sprotty");
/**
 * Extended bounds updater that can measure React content inside foreignObject elements.
 *
 * The standard HiddenBoundsUpdater uses SVG's getBBox() which doesn't measure HTML content
 * inside foreignObject. This class detects foreignObject elements containing React nodes
 * and uses getBoundingClientRect() to measure the actual HTML content dimensions.
 *
 * This enables automatic sizing of React nodes before layout (e.g., with ELK),
 * so nodes expand to fit their content.
 */
let ReactBoundsUpdater = class ReactBoundsUpdater extends sprotty_1.HiddenBoundsUpdater {
    /**
     * Override getBounds to handle foreignObject elements containing React content.
     *
     * When encountering a group element with a foreignObject child containing a
     * `.sprotty-react-node` div, we measure the HTML content using scrollWidth/scrollHeight.
     * This returns the actual content size even if it's clipped by the foreignObject container.
     * Otherwise, we fall back to the standard SVG getBBox() measurement.
     */
    getBounds(elm, element) {
        // Check if this is a group element (typical wrapper for React nodes)
        if (elm instanceof SVGGElement) {
            const foreignObject = elm.querySelector('foreignObject');
            if (foreignObject) {
                const reactDiv = foreignObject.querySelector('.sprotty-react-node');
                if (reactDiv instanceof HTMLElement) {
                    // Measure the HTML content using scrollWidth/scrollHeight
                    // This gives us the actual full content size, even if clipped by the container
                    // (getBoundingClientRect would only return the visible/clipped size)
                    return {
                        x: 0,
                        y: 0,
                        width: reactDiv.scrollWidth,
                        height: reactDiv.scrollHeight
                    };
                }
            }
        }
        // Fall back to standard SVG measurement for non-React elements
        return super.getBounds(elm, element);
    }
};
exports.ReactBoundsUpdater = ReactBoundsUpdater;
exports.ReactBoundsUpdater = ReactBoundsUpdater = __decorate([
    (0, inversify_1.injectable)()
], ReactBoundsUpdater);
//# sourceMappingURL=react-bounds-updater.js.map