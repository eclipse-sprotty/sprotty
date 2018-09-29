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

import { SModelRootSchema, SModelElementSchema } from '../base/model/smodel';
import { CollapseExpandAction } from '../features/expand/expand';

export interface DiagramState {
    expansionState: ExpansionState
}

export class ExpansionState {
    expandedElementIds: string[] = [];

    constructor(root: SModelRootSchema) {
        this.initialize(root);
    }

    protected initialize(element: SModelElementSchema): void {
        if ((element as any).expanded)
            this.expandedElementIds.push(element.id);
        if (element.children !== undefined)
            element.children.forEach(child => this.initialize(child));
    }

    apply(action: CollapseExpandAction) {
        for (const collapsed of action.collapseIds) {
            const index = this.expandedElementIds.indexOf(collapsed);
            if (index !== -1)
                this.expandedElementIds.splice(index, 1);
        }
        for (const expanded of action.expandIds) {
            this.expandedElementIds.push(expanded);
        }
    }

    collapseAll() {
        this.expandedElementIds = [];
    }
}
