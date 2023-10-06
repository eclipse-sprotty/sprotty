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

import { SModelElementImpl } from '../../base/model/smodel';

export const hoverFeedbackFeature = Symbol('hoverFeedbackFeature');

/**
 * Feature extension interface for {@link hoverFeedbackFeature}.
 */
export interface Hoverable {
    hoverFeedback: boolean
}

export function isHoverable(element: SModelElementImpl): element is SModelElementImpl & Hoverable {
    return element.hasFeature(hoverFeedbackFeature);
}

export const popupFeature = Symbol('popupFeature');

export function hasPopupFeature(element: SModelElementImpl): boolean {
    return element.hasFeature(popupFeature);
}
