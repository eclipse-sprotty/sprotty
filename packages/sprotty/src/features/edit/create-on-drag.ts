/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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

import { Action } from "../../base/actions/action";
import { SModelElement } from "../../base/model/smodel";
import { SModelExtension } from "../../base/model/smodel-extension";

export const creatingOnDragFeature = Symbol('creatingOnDragFeature');

export interface CreatingOnDrag extends SModelExtension {
    createAction(id: string): Action;
}

export function isCreatingOnDrag<T extends SModelElement>(element: T): element is T & CreatingOnDrag {
    return element.hasFeature(creatingOnDragFeature) && (element as any).createAction !== undefined;
}

