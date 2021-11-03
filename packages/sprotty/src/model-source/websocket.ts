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

import { injectable } from "inversify";
import { DiagramServer, ActionMessage } from "./diagram-server";

/**
 * An external ModelSource that connects to the model provider using a
 * websocket.
 */
@injectable()
export class WebSocketDiagramServer extends DiagramServer {

    protected webSocket?: WebSocket;

    listen(webSocket: WebSocket): void {
        webSocket.addEventListener('message', event => {
            this.messageReceived(event.data);
        });
        webSocket.addEventListener('error', event => {
            this.logger.error(this, 'error event received', event);
        });
        this.webSocket = webSocket;
    }

    disconnect() {
        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = undefined;
        }
    }

    protected sendMessage(message: ActionMessage): void {
        if (this.webSocket) {
            this.webSocket.send(JSON.stringify(message));
        } else {
            throw new Error('WebSocket is not connected');
        }
    }
}
