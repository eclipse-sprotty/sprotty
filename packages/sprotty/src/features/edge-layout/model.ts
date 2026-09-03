/********************************************************************************
 * Copyright (c) 2017-2024 TypeFox and others.
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

import type { EdgeLayoutable, EdgePlacement as EdgePlacementSchema } from 'sprotty-protocol';
import { SChildElementImpl, SModelElementImpl } from '../../base/model/smodel.js';
import { InternalBoundsAware, isBoundsAware } from '../bounds/model.js';
import { SRoutableElementImpl } from '../routing/model.js';

export const edgeLayoutFeature = Symbol('edgeLayout');

export function isEdgeLayoutable<T extends SModelElementImpl>(element: T): element is T & SChildElementImpl & InternalBoundsAware & EdgeLayoutable {
    return element instanceof SChildElementImpl
        && element.parent instanceof SRoutableElementImpl
        && isBoundsAware(element)
        && element.hasFeature(edgeLayoutFeature);
}

export function checkEdgePlacement(element: SChildElementImpl): element is SChildElementImpl & EdgeLayoutable {
    return 'edgePlacement' in element && element.edgePlacement !== undefined;
}

export const DEFAULT_EDGE_PLACEMENT: EdgePlacementSchema = {
    rotate: true,
    side: 'top',
    position: 0.5,
    offset: 7
};
