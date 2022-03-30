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

const serverApp = express();
serverApp.use(express.json());

// POST endpoint for fetching random graphs
// Note: This approach works only for the initial RequestModelAction, but not for further
// interaction between client and server. Use a WebSocket connection for more complex use cases.
const elkFactory: ElkFactory = () => new SocketElkServer();
const services: DiagramServices = {
    DiagramGenerator: new RandomGraphGenerator(),
    ModelLayoutEngine: new ElkLayoutEngine(elkFactory)
}
serverApp.post('/random-graph', (req, res) => {
    let responseTimeout: NodeJS.Timeout;
    try {
        const incomingMessage = req.body as ActionMessage;
        let responded = false;

        // Create a diagram server and process the incoming message
        const diagramServer = new DiagramServer(async (action: Action) => {
            if (responded) {
                console.warn('Cannot process additional action:', action);
            } else {
                // Send the first outgoing action as response
                res.json([{ clientId: incomingMessage.clientId, action }]);
                responded = true;
            }
        }, services);
        diagramServer.accept(incomingMessage.action);

        responseTimeout = setTimeout(() => {
            if (!responded) {
                res.json([]);
                responded = true;
            }
        }, 10_000);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
        clearTimeout(responseTimeout!);
    }
});

serverApp.use(express.static(path.join(__dirname, '..')));

serverApp.listen(8080, () => {
    console.log('Sprotty examples are available at http://localhost:8080');
});
