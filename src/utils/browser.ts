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

import { Point, ORIGIN_POINT } from "./geometry";

/**
 * Returns whether the mouse or keyboard event includes the CMD key
 * on Mac or CTRL key on Linux / others.
 */
export function isCtrlOrCmd(event: KeyboardEvent | MouseEvent) {
    if (isMac())
        return event.metaKey;
    else
        return event.ctrlKey;
}

export function isMac(): boolean {
    return window.navigator.userAgent.indexOf("Mac") !== -1;
}

export function isCrossSite(url: string): boolean {
    if (url && typeof window !== 'undefined' && window.location) {
        let baseURL: string = '';
        if (window.location.protocol)
            baseURL += window.location.protocol + '//';
        if (window.location.host)
            baseURL += window.location.host;
        return baseURL.length > 0 && !url.startsWith(baseURL);
    }
    return false;
}

/**
 * Returns the amount of scroll of the browser window as a point.
 */
export function getWindowScroll(): Point {
    if (typeof window === 'undefined') {
        return ORIGIN_POINT;
    }
    return {
        x: window.pageXOffset,
        y: window.pageYOffset
    };
}
