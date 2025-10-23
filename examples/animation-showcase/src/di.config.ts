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
    ConsoleLogger,
    loadDefaultModules,
    LocalModelSource,
    LogLevel,
    SEdgeImpl,
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    SNodeImpl,
    TYPES,
    configureModelElement,
    configureCommand,
    configureViewerOptions
} from 'sprotty';
import {
    selectFeature,
    moveFeature,
    hoverFeedbackFeature,
    fadeFeature
} from 'sprotty';
import { AnimatedNodeView, AnimatedEdgeView, AnimatedLabelView } from './views';
import {
    TriggerAnimationCommand,
    ChangeStateCommand,
    AnimateFlowCommand,
    CompositeAnimationCommand
} from './handlers';

const animationShowcaseModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Configure logger
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

    // Model source
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();

    // Register model elements with their views
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);

    configureModelElement(context, 'node:animated', SNodeImpl, AnimatedNodeView, {
        enable: [selectFeature, moveFeature, hoverFeedbackFeature, fadeFeature]
    });

    configureModelElement(context, 'edge:animated', SEdgeImpl, AnimatedEdgeView);

    configureModelElement(context, 'label:animated', SLabelImpl, AnimatedLabelView);

    // Configure viewer options
    configureViewerOptions(context, {
        needsClientLayout: false,
        baseDiv: 'sprotty'
    });

    // Register command handlers
    configureCommand(context, TriggerAnimationCommand);
    configureCommand(context, ChangeStateCommand);
    configureCommand(context, AnimateFlowCommand);
    configureCommand(context, CompositeAnimationCommand);
});

export default function createContainer(): Container {
    const container = new Container();
    loadDefaultModules(container);
    container.load(animationShowcaseModule);
    return container;
}

