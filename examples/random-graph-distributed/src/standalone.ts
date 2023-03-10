/********************************************************************************
 * Copyright (c) 2017-2022 TypeFox and others.
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

import { IActionDispatcher, TYPES, WebSocketDiagramServerProxy } from 'sprotty';
import { RequestModelAction, FitToScreenAction } from 'sprotty-protocol';
import createContainer from './di.config';

export default function runRandomGraphDistributed() {
    const container = createContainer('sprotty');

    const source = container.get<WebSocketDiagramServerProxy>(TYPES.ModelSource);
    const websocket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`);

    source.listen(websocket);

    const actionDispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    websocket.addEventListener('open', () => {
        actionDispatcher.request(RequestModelAction.create())
            .then(response => actionDispatcher.dispatch(response))
            .then(response => actionDispatcher.dispatch(FitToScreenAction.create([])))
            .catch(err => {
                console.error(err);
                document.getElementById('sprotty')!.innerText = String(err);
            })
    }, { once: true });
}
