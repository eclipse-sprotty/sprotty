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
    SCompartmentView, SLabelView, TYPES, configureViewerOptions, ConsoleLogger, LogLevel,
    loadDefaultModules, LocalModelSource, HtmlRootView, PreRenderedView, SvgExporter,
    configureView
} from 'sprotty';
import { ChipModelFactory } from "./chipmodel-factory";
import { ProcessorView, CoreView, CrossbarView, ChannelView, SimpleCoreView } from "./views";

class FilteringSvgExporter extends SvgExporter {
    isExported(styleSheet: CSSStyleSheet): boolean {
        return styleSheet.href !== null && (
            styleSheet.href.endsWith('diagram.css')
            || styleSheet.href.endsWith('sprotty.css')
            || styleSheet.href.endsWith('page.css')
        );
    }
}

export default () => {
    require("sprotty/css/sprotty.css");
    require("../css/diagram.css");

    const multicoreModule = new ContainerModule((bind, unbind, isBound, rebind) => {
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

        // Register views
        configureView({ bind, isBound }, 'processor', ProcessorView);
        configureView({ bind, isBound }, 'core', CoreView);
        configureView({ bind, isBound }, 'simplecore', SimpleCoreView);
        configureView({ bind, isBound }, 'crossbar', CrossbarView);
        configureView({ bind, isBound }, 'channel', ChannelView);
        configureView({ bind, isBound }, 'label:heading', SLabelView);
        configureView({ bind, isBound }, 'label:info', SLabelView);
        configureView({ bind, isBound }, 'comp', SCompartmentView);
        configureView({ bind, isBound }, 'html', HtmlRootView);
        configureView({ bind, isBound }, 'pre-rendered', PreRenderedView);
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(multicoreModule);

    return container;
};
