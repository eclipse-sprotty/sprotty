/********************************************************************************
 * Copyright (c) 2017-2023 TypeFox and others.
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
    SCompartmentView, SLabelView, TYPES, configureViewerOptions, ConsoleLogger, LogLevel,
    loadDefaultModules, LocalModelSource, HtmlRootView, PreRenderedView, SvgExporter,
    configureModelElement, PreRenderedElementImpl, HtmlRootImpl, SLabelImpl, SCompartmentImpl
} from 'sprotty';
import { ProcessorView, CoreView, CrossbarView, ChannelView, SimpleCoreView } from './views';
import { Channel, Core, Crossbar, Processor } from './chipmodel';

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
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const multicoreModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
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
        configureModelElement(context, 'processor', Processor, ProcessorView);
        configureModelElement(context, 'core', Core, CoreView);
        configureModelElement(context, 'simplecore', Core, SimpleCoreView);
        configureModelElement(context, 'crossbar', Crossbar, CrossbarView);
        configureModelElement(context, 'channel', Channel, ChannelView);
        configureModelElement(context, 'label:heading', SLabelImpl, SLabelView);
        configureModelElement(context, 'label:info', SLabelImpl, SLabelView);
        configureModelElement(context, 'comp', SCompartmentImpl, SCompartmentView);
        configureModelElement(context, 'html', HtmlRootImpl, HtmlRootView);
        configureModelElement(context, 'pre-rendered', PreRenderedElementImpl, PreRenderedView);
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(multicoreModule);

    return container;
};
