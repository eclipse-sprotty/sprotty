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

import { injectable } from 'inversify';
import { Action, CollapseExpandAction } from 'sprotty-protocol/lib/actions';
import { SButtonImpl } from '../button/model';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { isExpandable } from './model';
import { IButtonHandler } from '../button/button-handler';

@injectable()
export class ExpandButtonHandler implements IButtonHandler {
    static TYPE = 'button:expand';

    buttonPressed(button: SButtonImpl): Action[] {
        const expandable = findParentByFeature(button, isExpandable);
        if (expandable !== undefined) {
            return [ CollapseExpandAction.create({
                expandIds:   expandable.expanded ? [] : [ expandable.id ],
                collapseIds:  expandable.expanded ? [ expandable.id ] : []
            })];
        } else {
            return [];
        }
    }
}
