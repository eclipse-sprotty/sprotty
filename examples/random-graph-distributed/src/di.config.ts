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

import { Container, ContainerModule } from 'inversify';
import {
    TYPES, configureViewerOptions, SGraphView, SLabelView, ConsoleLogger, LogLevel,
    loadDefaultModules, SNode, SEdge, SLabel, configureModelElement,
    SGraph, RectangularNodeView, PolylineEdgeView, WebSocketDiagramServerProxy
} from 'sprotty';

export default (containerId: string) => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const randomGraphModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(WebSocketDiagramServerProxy).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };
        configureModelElement(container, 'graph', SGraph, SGraphView);
        configureModelElement(container, 'node', SNode, RectangularNodeView);
        configureModelElement(container, 'edge', SEdge, PolylineEdgeView);
        configureModelElement(container, 'label', SLabel, SLabelView);

        configureViewerOptions(context, {
            needsClientLayout: false,
            needsServerLayout: true,
            baseDiv: containerId
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(randomGraphModule);
    return container;
};
