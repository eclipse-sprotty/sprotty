/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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
    TYPES, configureViewerOptions, SGraphView, ConsoleLogger, LogLevel, loadDefaultModules,
    LocalModelSource, RectangularNodeView, PolylineEdgeView,
    configureModelElement, SGraphImpl, SNodeImpl, SEdgeImpl, SLabelImpl, SLabelView,
    selectFeature, hoverFeedbackFeature
} from 'sprotty';
import { LoadMonitorNodeView } from './views';

export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const stylingShowcaseModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };

        // Configure model elements for different styling approaches
        configureModelElement(context, 'graph', SGraphImpl, SGraphView);

        // Section 1: Default styling - basic nodes with only sprotty-node class
        configureModelElement(context, 'node:default', SNodeImpl, RectangularNodeView);

        // Section 2: Subtype-based styling - different node types get additional CSS classes
        configureModelElement(context, 'node:server', SNodeImpl, RectangularNodeView);
        configureModelElement(context, 'node:database', SNodeImpl, RectangularNodeView);
        configureModelElement(context, 'node:router', SNodeImpl, RectangularNodeView);

        // Section 3: Custom CSS classes - node with additional cssClasses property
        configureModelElement(context, 'node:critical', SNodeImpl, RectangularNodeView);

        // Section 4: Conditional styling - custom view with dynamic CSS classes
        configureModelElement(context, 'node:load-monitor', SNodeImpl, LoadMonitorNodeView);

        // Section 5: Interactive styling - node with selection and hover features
        configureModelElement(context, 'node:interactive', SNodeImpl, RectangularNodeView, {
            enable: [selectFeature, hoverFeedbackFeature]
        });

        // Edge configurations
        configureModelElement(context, 'edge:ethernet', SEdgeImpl, PolylineEdgeView);
        configureModelElement(context, 'edge:wireless', SEdgeImpl, PolylineEdgeView);
        configureModelElement(context, 'edge:fiber', SEdgeImpl, PolylineEdgeView);

        // Label configuration
        configureModelElement(context, 'label:text', SLabelImpl, SLabelView);

        configureViewerOptions(context, {
            needsClientLayout: false,
            baseDiv: 'sprotty'
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(stylingShowcaseModule);
    return container;
};
