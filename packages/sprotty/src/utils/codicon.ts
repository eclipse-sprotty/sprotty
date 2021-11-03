/********************************************************************************
 * Copyright (c) 2021 EclipseSource and others.
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

export const ACTION_ITEM = 'action-item';
export const ANIMATION_SPIN = 'animation-spin';

export function codiconCSSString(codiconId: string, actionItem = false, animationSpin = false, additionalCSS: string[] = []): string {
    return codiconCSSClasses(codiconId, actionItem, animationSpin, additionalCSS).join(' ');
}

export function codiconCSSClasses(codiconId: string, actionItem = false, animationSpin = false, additionalCSS: string[] = []): string[] {
    const cssClassArray = ['codicon', `codicon-${codiconId}`];
    if (actionItem) {
        cssClassArray.push(ACTION_ITEM);
    }
    if (animationSpin) {
        cssClassArray.push(ANIMATION_SPIN);
    }
    if (additionalCSS.length > 0) {
        cssClassArray.push(...additionalCSS);
    }
    return cssClassArray;
}
