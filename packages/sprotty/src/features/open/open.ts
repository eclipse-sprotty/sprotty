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

import { Action, OpenAction } from 'sprotty-protocol/lib/actions';
import { MouseListener } from '../../base/views/mouse-tool';
import { SModelElementImpl } from '../../base/model/smodel';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { isOpenable } from './model';


export class OpenMouseListener extends MouseListener {
    override doubleClick(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        const openableTarget = findParentByFeature(target, isOpenable);
        if (openableTarget !== undefined) {
            return [ OpenAction.create(openableTarget.id) ];
        }
        return [];
    }
}
