/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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
    configureModelElement, configureViewerOptions, configureActionHandler,
    SGraphImpl, SLabelImpl, LocalModelSource, ConsoleLogger, LogLevel,
    selectFeature, moveFeature, hoverFeedbackFeature, fadeFeature,
    loadDefaultModules
} from 'sprotty';
import { AnimatableNode, AnimatableEdge, AnimatableLabel } from './model';
import { AnimatedGraphView, AnimatedNodeView, AnimatedEdgeView, AnimatedLabelView } from './views';
import { AnimationActionHandler } from './handlers';

export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const animationModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        // Animation settings are managed via singleton pattern

        const context = { bind, unbind, isBound, rebind };

        // Configure the root graph with animation support
        configureModelElement(context, 'graph', SGraphImpl, AnimatedGraphView);

        // Configure animatable nodes
        configureModelElement(context, 'node:animatable', AnimatableNode, AnimatedNodeView, {
            enable: [selectFeature, moveFeature, hoverFeedbackFeature, fadeFeature]
        });

        // Configure animatable edges
        configureModelElement(context, 'edge:animatable', AnimatableEdge, AnimatedEdgeView, {
            enable: [fadeFeature]
        });

        // Configure animatable labels
        configureModelElement(context, 'label:animatable', AnimatableLabel, AnimatedLabelView, {
            enable: [fadeFeature]
        });

        // Configure regular labels for comparison
        configureModelElement(context, 'label:text', SLabelImpl, AnimatedLabelView);

        // Configure action handlers
        configureActionHandler(context, 'triggerAnimation', AnimationActionHandler);
        configureActionHandler(context, 'transitionState', AnimationActionHandler);
        configureActionHandler(context, 'startEdgeFlow', AnimationActionHandler);
        configureActionHandler(context, 'startTypewriter', AnimationActionHandler);
        configureActionHandler(context, 'configureAnimation', AnimationActionHandler);
        configureActionHandler(context, 'startComplexAnimation', AnimationActionHandler);
        configureActionHandler(context, 'stopAnimations', AnimationActionHandler);

        configureViewerOptions(context, {
            needsClientLayout: false,
            needsServerLayout: false,
            baseDiv: 'sprotty-animation',
            hiddenDiv: 'sprotty-hidden-animation'
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(animationModule);
    return container;
};
