/********************************************************************************
 * Copyright (c) 2017-2026 TypeFox and others.
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

import { LogLevel, WebSocketDiagramServerProxy, createSprottyDiagram } from 'sprotty';

/**
 * The server sends only the default element types, so no `elements` are registered. With a
 * server-backed model source the diagram has no `setModel`/`updateModel`: the model is requested
 * through the dispatcher instead.
 */
export default (containerId: string) => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    return createSprottyDiagram({
        modelSource: WebSocketDiagramServerProxy,
        viewerOptions: {
            needsClientLayout: false,
            needsServerLayout: true,
            baseDiv: containerId
        },
        logLevel: LogLevel.log
    });
};
