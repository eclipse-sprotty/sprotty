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

import { Container, ContainerModule } from "inversify";
import {
    defaultModule, TYPES, configureViewerOptions, SGraphView, PolylineEdgeView, ConsoleLogger,
    LogLevel, WebSocketDiagramServer, boundsModule, moveModule, selectModule, undoRedoModule, viewportModule,
    LocalModelSource, exportModule, CircularNode, configureModelElement, SGraph, SEdge, updateModule,
    graphModule, routingModule, modelSourceModule
} from "../../../src";
import { CircleNodeView } from "./views";

export default (useWebsocket: boolean) => {
    require("../../../css/sprotty.css");
    require("../css/diagram.css");
    const circlegraphModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        if (useWebsocket)
            bind(TYPES.ModelSource).to(WebSocketDiagramServer).inSingletonScope();
        else
            bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        const context = { bind, unbind, isBound, rebind };
        configureModelElement(context, 'graph', SGraph, SGraphView);
        configureModelElement(context, 'node:circle', CircularNode, CircleNodeView);
        configureModelElement(context, 'edge:straight', SEdge, PolylineEdgeView);
        configureViewerOptions(context, {
            needsClientLayout: false
        });
    });

    const container = new Container();
    container.load(defaultModule, selectModule, moveModule, boundsModule, undoRedoModule, viewportModule,
        exportModule, updateModule, graphModule, routingModule, modelSourceModule, circlegraphModule);
    return container;
};
