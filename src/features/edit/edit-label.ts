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
import { MouseListener } from "../../base/views/mouse-tool";
import { SLabel } from "../../graph/sgraph";
import { SModelExtension } from "../../base/model/smodel-extension";

export const editLabelFeature = Symbol('editLabelFeature');

export interface EditableLabel extends SModelExtension {
}

export function isEditableLabel<T extends SModelElement>(element: T): element is T & EditableLabel {
    return element instanceof SLabel && element.hasFeature(editLabelFeature);
}

export class EditLabelAction implements Action {
    static KIND = 'EditLabel';
    kind = EditLabelAction.KIND;
    constructor(readonly labelId: string) {}
}

export class EditLabelMouseListener extends MouseListener {
    doubleClick(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (target instanceof SLabel && isEditableLabel(target)) {
            return [new EditLabelAction(target.id)];
        }
        return [];
    }
}
