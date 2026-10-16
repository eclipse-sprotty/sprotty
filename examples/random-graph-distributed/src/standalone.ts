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

import { RequestModelAction, FitToScreenAction } from 'sprotty-protocol';
import createDiagram from './simpleAPI.js';

export default function runRandomGraphDistributed() {
    const diagram = createDiagram('sprotty');

    const websocket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`);

    diagram.modelSource.listen(websocket);

    websocket.addEventListener('open', () => {
        diagram.request(RequestModelAction.create())
            .then(response => diagram.dispatch(response))
            .then(response => diagram.dispatch(FitToScreenAction.create([])))
            .catch(err => {
                console.error(err);
                document.getElementById('sprotty')!.innerText = String(err);
            });
    }, { once: true });
}
