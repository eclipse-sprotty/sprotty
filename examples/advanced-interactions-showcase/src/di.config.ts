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
    TYPES,
    configureViewerOptions,
    ConsoleLogger,
    LogLevel,
    loadDefaultModules,
    LocalModelSource,
    configureModelElement,
    configureButtonHandler,
    SLabelView,
    ProjectedViewportView,
    ViewportRootElementImpl,
    SEdgeImpl,
    SLabelImpl,
    selectFeature,
    moveFeature,
    hoverFeedbackFeature,
    fadeFeature
} from 'sprotty';
import { InteractiveNode, InteractiveButton, InteractiveLabel } from './model';
import { InteractiveNodeView, InteractiveButtonView, InteractiveLabelView, InteractiveEdgeView } from './views';
import { InteractiveButtonHandler, AdvancedMouseListener, AdvancedKeyListener } from './interactions';

export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const advancedInteractionsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };

        // Configure model elements and their views
        configureModelElement(context, 'graph', ViewportRootElementImpl, ProjectedViewportView);
        configureModelElement(context, 'node:interactive', InteractiveNode, InteractiveNodeView, {
            enable: [selectFeature, moveFeature, hoverFeedbackFeature, fadeFeature]
        });
        configureModelElement(context, 'button:interactive', InteractiveButton, InteractiveButtonView);
        configureModelElement(context, 'label:interactive', InteractiveLabel, InteractiveLabelView);
        configureModelElement(context, 'edge', SEdgeImpl, InteractiveEdgeView, {
            enable: [selectFeature, hoverFeedbackFeature]
        });
        configureModelElement(context, 'label:edge', SLabelImpl, SLabelView);

        // Configure button handlers
        configureButtonHandler(context, 'button:interactive', InteractiveButtonHandler);

        // Register mouse listeners
        bind(AdvancedMouseListener).toSelf().inSingletonScope();
        bind(TYPES.MouseListener).toService(AdvancedMouseListener);

        // Register keyboard listeners
        bind(AdvancedKeyListener).toSelf().inSingletonScope();
        bind(TYPES.KeyListener).toService(AdvancedKeyListener);

        // Configure viewer options
        configureViewerOptions(context, {
            needsClientLayout: true,
            baseDiv: 'sprotty',
            zoomLimits: { min: 0.1, max: 10 }
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(advancedInteractionsModule);
    return container;
};