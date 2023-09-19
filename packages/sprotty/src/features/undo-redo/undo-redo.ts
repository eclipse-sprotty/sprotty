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

import { Action, UndoAction, RedoAction } from 'sprotty-protocol/lib/actions';
import { matchesKeystroke } from '../../utils/keyboard';
import { KeyListener } from '../../base/views/key-tool';
import { SModelElementImpl } from '../../base/model/smodel';
import { isMac } from '../../utils/browser';

export class UndoRedoKeyListener extends KeyListener {
    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyZ', 'ctrlCmd'))
            return [UndoAction.create()];
        if (matchesKeystroke(event, 'KeyZ', 'ctrlCmd', 'shift') || (!isMac() && matchesKeystroke(event, 'KeyY', 'ctrlCmd')))
            return [RedoAction.create()];
        return [];
    }
}
