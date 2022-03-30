/********************************************************************************
 * Copyright (c) 2022 TypeFox and others.
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
import { DiagramServerProxy } from 'sprotty';
import { ActionMessage } from 'sprotty-protocol';

/**
 * HTTP based diagram server. This is not as useful as the WebSocket based implementation
 * because the server cannot send messages on its own.
 */
@injectable()
export class HttpDiagramServerProxy extends DiagramServerProxy {

    protected sendMessage(message: ActionMessage): void {
        const body = JSON.stringify(message);
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        fetch('/random-graph', { method: 'POST', body, headers }).then(async response => {
            if (response.ok) {
                try {
                    const result = await response.json();
                    if (Array.isArray(result)) {
                        for (const message of result) {
                            this.messageReceived(message);
                        }
                    }
                } catch (err) {
                    this.logger.error(this, 'Failed to parse response:', err);
                }
            } else {
                this.logger.error(this, 'Response was not ok:', response);
            }
        }, err => this.logger.error(this, 'Failed to fetch:', err));
    }

}
