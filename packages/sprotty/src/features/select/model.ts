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

import { SModelElement } from "../../base/model/smodel";
import { SModelExtension } from "../../base/model/smodel-extension";

export const selectFeature = Symbol('selectFeature');

export interface Selectable extends SModelExtension {
    selected: boolean
}

export function isSelectable(element: SModelElement): element is SModelElement & Selectable {
    return element.hasFeature(selectFeature);
}

export function isSelected(element: SModelElement | undefined): element is SModelElement & Selectable {
    return element !== undefined && isSelectable(element) && element.selected;
}
