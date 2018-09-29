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
    SCompartmentView, SLabelView, defaultModule, TYPES, ViewRegistry, configureViewerOptions,
    ConsoleLogger, LogLevel, WebSocketDiagramServer, boundsModule, selectModule, viewportModule,
    moveModule, fadeModule, hoverModule, LocalModelSource, HtmlRootView, PreRenderedView,
    exportModule, SvgExporter
} from '../../../src';
import { ChipModelFactory } from "./chipmodel-factory";
import { ProcessorView, CoreView, CrossbarView, ChannelView, SimpleCoreView } from "./views";

class FilteringSvgExporter extends SvgExporter {
    isExported(styleSheet: CSSStyleSheet): boolean {
        return styleSheet.href !== null && (
            styleSheet.href.endsWith('diagram.css')
            || styleSheet.href.endsWith('sprotty.css')
            || styleSheet.href.endsWith('page.css')
        );
    }
}

export default (useWebsocket: boolean) => {
    const multicoreModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        if (useWebsocket)
            bind(TYPES.ModelSource).to(WebSocketDiagramServer).inSingletonScope();
        else
            bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        rebind(TYPES.IModelFactory).to(ChipModelFactory).inSingletonScope();
        rebind(TYPES.SvgExporter).to(FilteringSvgExporter).inSingletonScope();
        const context = { bind, unbind, isBound, rebind };
        configureViewerOptions(context, {
            baseDiv: 'sprotty-cores',
            hiddenDiv: 'sprotty-hidden-cores',
            popupDiv: 'sprotty-popup-cores',
            needsClientLayout: true,
            needsServerLayout: false
        });
    });

    const container = new Container();
    container.load(defaultModule, boundsModule, selectModule, moveModule, viewportModule, fadeModule,
        exportModule, hoverModule, multicoreModule);

    // Register views
    const viewRegistry = container.get<ViewRegistry>(TYPES.ViewRegistry);
    viewRegistry.register('processor', ProcessorView);
    viewRegistry.register('core', CoreView);
    viewRegistry.register('simplecore', SimpleCoreView);
    viewRegistry.register('crossbar', CrossbarView);
    viewRegistry.register('channel', ChannelView);
    viewRegistry.register('label:heading', SLabelView);
    viewRegistry.register('label:info', SLabelView);
    viewRegistry.register('comp', SCompartmentView);
    viewRegistry.register('html', HtmlRootView);
    viewRegistry.register('pre-rendered', PreRenderedView);

    return container;
};
