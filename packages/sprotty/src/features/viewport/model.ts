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

import { Scrollable, Zoomable } from 'sprotty-protocol/lib/model';
import { SModelElement, SModelRoot } from '../../base/model/smodel';

export const viewportFeature = Symbol('viewportFeature');

/**
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export interface Viewport extends Scrollable, Zoomable {
}

export function isViewport(element: SModelElement): element is SModelRoot & Viewport {
    return element instanceof SModelRoot
        && element.hasFeature(viewportFeature)
        && 'zoom' in element
        && 'scroll' in element;
}
