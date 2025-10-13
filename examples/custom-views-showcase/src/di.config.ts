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
    LocalModelSource, configureModelElement, SGraphImpl,
    selectFeature, moveFeature, hoverFeedbackFeature, popupFeature, fadeFeature
} from 'sprotty';

// Import our custom model classes
import {
    BasicShapeNode, EnhancedNode, ComplexNode, StatefulNode,
    StyledEdge, CustomLabel
} from './model';

// Import our custom view classes
import {
    BasicShapeView, EnhancedNodeView, ComplexNodeView, StatefulNodeView,
    StyledEdgeView, CustomLabelView
} from './views';

export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const customViewsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };

        // Configure the root graph
        configureModelElement(context, 'graph', SGraphImpl, SGraphView);

        // Configure basic shape nodes
        configureModelElement(context, 'node:basic-circle', BasicShapeNode, BasicShapeView, {
            enable: [selectFeature, moveFeature, hoverFeedbackFeature]
        });
        configureModelElement(context, 'node:basic-triangle', BasicShapeNode, BasicShapeView, {
            enable: [selectFeature, moveFeature, hoverFeedbackFeature]
        });
        configureModelElement(context, 'node:basic-diamond', BasicShapeNode, BasicShapeView, {
            enable: [selectFeature, moveFeature, hoverFeedbackFeature]
        });

        // Configure enhanced nodes
        configureModelElement(context, 'node:enhanced', EnhancedNode, EnhancedNodeView, {
            enable: [selectFeature, moveFeature, hoverFeedbackFeature, popupFeature]
        });

        // Configure complex nodes
        configureModelElement(context, 'node:complex', ComplexNode, ComplexNodeView, {
            enable: [selectFeature, moveFeature, hoverFeedbackFeature, popupFeature, fadeFeature]
        });

        // Configure stateful nodes
        configureModelElement(context, 'node:stateful', StatefulNode, StatefulNodeView, {
            enable: [selectFeature, hoverFeedbackFeature]
        });

        // Configure styled edges
        configureModelElement(context, 'edge:styled', StyledEdge, StyledEdgeView);

        // Configure custom labels
        configureModelElement(context, 'label:custom', CustomLabel, CustomLabelView);

        configureViewerOptions(context, {
            needsClientLayout: false,
            baseDiv: 'sprotty'
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(customViewsModule);
    return container;
};
