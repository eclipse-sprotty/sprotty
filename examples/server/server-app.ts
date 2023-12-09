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

import express from 'express';
import * as path from 'path';
import { ElkFactory, ElkLayoutEngine } from 'sprotty-elk/lib/elk-layout';
import { SocketElkServer } from 'sprotty-elk/lib/node';
import { Action, ActionMessage, DiagramServer, DiagramServices } from 'sprotty-protocol';
import { RandomGraphGenerator } from './random-graph-generator';
import { Server } from 'ws';

const serverApp = express();
serverApp.use(express.json());

const elkFactory: ElkFactory = () => new SocketElkServer();
const services: DiagramServices = {
    DiagramGenerator: new RandomGraphGenerator(),
    ModelLayoutEngine: new ElkLayoutEngine(elkFactory)
}

// Create a WebSocket Server
// This is called from the `random-graph-distributed` example by `WebSocketDiagramServerProxy`
const wsServer = new Server({ noServer: true });
wsServer.on('connection', socket => {

    let clientId: string | undefined;
    const diagramServer = new DiagramServer(async (action: Action) => {
        const msg = JSON.stringify({ clientId, action });
        socket.send(msg);
    }, services);

    socket.on('error', console.error);
    socket.on('message', message => {
        try {
            const actionMessage = JSON.parse(message.toString()) as ActionMessage;
            clientId = actionMessage.clientId;
            diagramServer.accept(actionMessage.action);
        } catch (err) {
            console.error(err);
            socket.send(JSON.stringify(err));
        }
    });
});

serverApp.use(express.static(path.join(__dirname, '../..')));

const server = serverApp.listen(8080, () => {
    console.log('Sprotty examples are available at http://localhost:8080');
});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});
