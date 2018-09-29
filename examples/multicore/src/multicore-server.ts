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

import {
    RequestModelAction, TYPES, IActionHandler, ActionHandlerRegistry, SelectAction, SelectCommand, WebSocketDiagramServer
} from "../../../src";
import createContainer from "./di.config";

const WebSocket = require("reconnecting-websocket");

function getXtextServices(): any {
    return (window as any).xtextServices;
}

class SelectionHandler implements IActionHandler {
    handle(action: SelectAction): void {
        const xtextService = getXtextServices();
        if (xtextService !== undefined) {
            const selectedElement = action.selectedElementsIDs.length > 0 ? action.selectedElementsIDs[0] : 'processor';
            xtextService.select({
                elementId: selectedElement,
                modelType: 'processor'
            });
        }
    }
}

export function setupMulticore(websocket: WebSocket) {
    const container = createContainer(true);

    // Set up selection handling
    const actionHandlerRegistry = container.get<ActionHandlerRegistry>(TYPES.ActionHandlerRegistry);
    actionHandlerRegistry.register(SelectCommand.KIND, new SelectionHandler());

    // Connect to the diagram server
    const diagramServer = container.get<WebSocketDiagramServer>(TYPES.ModelSource);
    diagramServer.listen(websocket);
    websocket.addEventListener('open', event => {
        // Run
        function run() {
            const xtextServices = getXtextServices();
            if (xtextServices !== undefined) {
                const resourceId = xtextServices.options.resourceId;
                diagramServer.clientId = resourceId + '_processor';
                diagramServer.handle(new RequestModelAction({
                    resourceId: resourceId,
                    needsClientLayout: 'true'
                }));
            } else {
                setTimeout(run, 50);
            }
        }
        run();
    });
}

export default function runMulticoreServer() {
    const protocol = document.location.protocol === 'https'
        ? 'wss'
        : 'ws';
    const websocket = new WebSocket(protocol + '://' + window.location.host + '/diagram');
    setupMulticore(websocket);
}
