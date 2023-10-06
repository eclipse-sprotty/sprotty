/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
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

import { Dimension, Point } from 'sprotty-protocol/lib/utils/geometry';
import { SModelElementImpl } from '../../base/model/smodel';
import { SRoutableElementImpl } from '../routing/model';

export const editFeature = Symbol('editFeature');

export function canEditRouting(element: SModelElementImpl): element is SRoutableElementImpl {
    return element instanceof SRoutableElementImpl && element.hasFeature(editFeature);
}


export const editLabelFeature = Symbol('editLabelFeature');

/**
 * Feature extension interface for {@link editLabelFeature}.
 */
export interface EditableLabel  {
    text: string;
    readonly isMultiLine?: boolean;
    readonly editControlDimension?: Dimension;
    readonly editControlPositionCorrection?: Point;
}

export function isEditableLabel<T extends SModelElementImpl>(element: T): element is T & EditableLabel {
    return 'text' in element && element.hasFeature(editLabelFeature);
}

export const withEditLabelFeature = Symbol('withEditLabelFeature');

/**
 * Feature extension interface for {@link withEditLabelFeature}.
 */
export interface WithEditableLabel  {
    readonly editableLabel?: EditableLabel & SModelElementImpl;
}

export function isWithEditableLabel<T extends SModelElementImpl>(element: T): element is T & WithEditableLabel {
    return 'editableLabel' in element && element.hasFeature(withEditLabelFeature);
}
