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

import { hasOwnProperty } from 'sprotty-protocol/lib/utils/object';
import { Point } from 'sprotty-protocol/lib/utils/geometry';
import { SModelElementImpl } from '../../base/model/smodel';

export const moveFeature = Symbol('moveFeature');

/**
 * An element that can be placed at a specific location using its position property.
 * Feature extension interface for {@link moveFeature}.
 * @deprecated Use the definition from `sprotty-protocol` instead.
 */
export interface Locateable {
    position: Point
}

export function isLocateable(element: SModelElementImpl): element is SModelElementImpl & Locateable {
    return hasOwnProperty(element, 'position');
}

export function isMoveable(element: SModelElementImpl): element is SModelElementImpl & Locateable {
    return element.hasFeature(moveFeature) && isLocateable(element);
}
