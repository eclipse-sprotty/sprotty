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

import { ContainerModule } from 'inversify';
import {
    SCompartmentView, SLabelView, TYPES, LogLevel, HtmlRootView, PreRenderedView, SvgExporter,
    PreRenderedElementImpl, HtmlRootImpl, SLabelImpl, SCompartmentImpl, createSprottyDiagram
} from 'sprotty';
import { ProcessorView, CoreView, CrossbarView, ChannelView, SimpleCoreView } from './views.js';
import { Channel, Core, Crossbar, Processor } from './chipmodel.js';

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
        rebind(TYPES.SvgExporter).to(FilteringSvgExporter).inSingletonScope();
    });

    return createSprottyDiagram({
        viewerOptions: {
            baseDiv: 'sprotty-cores',
            hiddenDiv: 'sprotty-hidden-cores',
            popupDiv: 'sprotty-popup-cores'
        },
        logLevel: LogLevel.log,
        modules: [multicoreModule],
        elements: {
            'processor': [Processor, ProcessorView],
            'core': [Core, CoreView],
            'simplecore': [Core, SimpleCoreView],
            'crossbar': [Crossbar, CrossbarView],
            'channel': [Channel, ChannelView],
            'label:heading': [SLabelImpl, SLabelView],
            'label:info': [SLabelImpl, SLabelView],
            'comp': [SCompartmentImpl, SCompartmentView],
            'html': [HtmlRootImpl, HtmlRootView],
            'pre-rendered': [PreRenderedElementImpl, PreRenderedView]
        }
    });
};
