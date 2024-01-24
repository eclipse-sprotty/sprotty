/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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

import { LocalModelSource, TYPES } from 'sprotty';
import { BringToFrontAction, FitToScreenAction } from 'sprotty-protocol';
import createContainer from './di.config';

export default async function runFlowchart() {
    const container = createContainer('sprotty');
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    await modelSource.updateModel();

    const bringToFrontAction: BringToFrontAction = {
        kind: 'bringToFront',
        elementIDs: ['2-4', '10-11', '11-12']
    };

    const fitToScreenAction: FitToScreenAction = {
        kind: 'fit',
        animate: true,
        elementIds: [],
        padding: 20
    };
    await modelSource.actionDispatcher.dispatchAll([fitToScreenAction, bringToFrontAction]);
}
