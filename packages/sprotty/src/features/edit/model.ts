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

import { SModelElement } from '../../base/model/smodel';
import { SRoutableElement } from '../routing/model';
import { SModelExtension } from '../../base/model/smodel-extension';
import { Point, Dimension } from '../../utils/geometry';

export const editFeature = Symbol('editFeature');

export function canEditRouting(element: SModelElement): element is SRoutableElement {
    return element instanceof SRoutableElement && element.hasFeature(editFeature);
}

export const editLabelFeature = Symbol('editLabelFeature');

export interface EditableLabel extends SModelExtension {
    text: string;
    readonly isMultiLine?: boolean;
    readonly editControlDimension?: Dimension;
    readonly editControlPositionCorrection?: Point;
}

export function isEditableLabel<T extends SModelElement>(element: T): element is T & EditableLabel {
    return 'text' in element && element.hasFeature(editLabelFeature);
}

export const withEditLabelFeature = Symbol('withEditLabelFeature');

export interface WithEditableLabel extends SModelExtension {
    readonly editableLabel?: EditableLabel & SModelElement;
}

export function isWithEditableLabel<T extends SModelElement>(element: T): element is T & WithEditableLabel {
    return 'editableLabel' in element && element.hasFeature(withEditLabelFeature);
}
