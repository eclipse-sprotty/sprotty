/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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

import { Action } from 'sprotty-protocol/lib/actions';

/**
 * A list of actions with a label.
 * Labeled actions are used to denote a group of actions in a user-interface context, e.g.,
 * to define an entry in the command palette or in the context menu.
 */
export class LabeledAction {
    constructor(readonly label: string, readonly actions: Action[], readonly icon?: string) { }
}

export function isLabeledAction(element: unknown): element is LabeledAction {
    return element !== undefined
        && (<LabeledAction>element).label !== undefined
        && (<LabeledAction>element).actions !== undefined;
}
