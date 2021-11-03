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

/**
 * Slows down animations towards the begin and the end.
 *
 * @param x the value between 0 (start of animation) and 1 (end of
 *     animation) linearly interpolated in time.
 * @returns {number} the eased value between 0 and 1
 */
export function easeInOut(x: number): number {
    if (x < 0.5)
        return x * x * 2;
    else
        return 1 - (1 - x) * (1 - x) * 2;
}
