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

import { Action } from "sprotty-protocol/lib/actions";
import { SModelElementImpl } from "../../base/model/smodel";

export const creatingOnDragFeature = Symbol('creatingOnDragFeature');

/**
 *  Feature extension interface for {@link creatingOnDragFeature}.
 */
export interface CreatingOnDrag {
    createAction(id: string): Action;
}

export function isCreatingOnDrag<T extends SModelElementImpl>(element: T): element is T & CreatingOnDrag {
    return element.hasFeature(creatingOnDragFeature) && (element as any).createAction !== undefined;
}
