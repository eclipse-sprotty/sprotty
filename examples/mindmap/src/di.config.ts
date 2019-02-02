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
    defaultModule, TYPES, configureViewerOptions, SGraphView, SLabelView, ConsoleLogger,
    LogLevel, WebSocketDiagramServer, boundsModule, moveModule, selectModule, undoRedoModule,
    viewportModule, hoverModule, LocalModelSource, HtmlRootView, PreRenderedView, exportModule,
    expandModule, fadeModule, buttonModule, PreRenderedElement, SNode, SLabel, HtmlRoot,
    configureModelElement, configureCommand, graphModule, updateModule, routingModule
} from "../../../src";
import { MindmapNodeView, PopupButtonView } from "./views";
import { PopupButtonMouseListener, AddElementCommand, PopupModelProvider } from "./popup";
import { Mindmap, PopupButton } from "./model";

export default (useWebsocket: boolean, containerId: string) => {
    require("../../../css/sprotty.css");
    require("../css/diagram.css");
    const mindmapModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        if (useWebsocket)
            bind(TYPES.ModelSource).to(WebSocketDiagramServer).inSingletonScope();
        else
            bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        bind(TYPES.IPopupModelProvider).to(PopupModelProvider).inSingletonScope();
        bind(TYPES.PopupMouseListener).to(PopupButtonMouseListener);
        configureCommand(container, AddElementCommand);
        const context = { bind, unbind, isBound, rebind };
        configureModelElement(container, 'mindmap', Mindmap, SGraphView);
        configureModelElement(container, 'node', SNode, MindmapNodeView);
        configureModelElement(container, 'label', SLabel, SLabelView);
        configureModelElement(container, 'html', HtmlRoot, HtmlRootView);
        configureModelElement(container, 'pre-rendered', PreRenderedElement, PreRenderedView);
        configureModelElement(container, 'popup:button', PopupButton, PopupButtonView);
        configureViewerOptions(context, {
            needsClientLayout: false,
            baseDiv: containerId,
            popupOpenDelay: 500
        });
    });

    const container = new Container();
    container.load(defaultModule, selectModule, moveModule, boundsModule, undoRedoModule,
        viewportModule, fadeModule, hoverModule, exportModule, expandModule, buttonModule,
        updateModule, graphModule, routingModule, mindmapModule);
    return container;
};
