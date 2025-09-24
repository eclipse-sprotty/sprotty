"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const sprotty_1 = require("sprotty");
// Import our custom model classes
const model_1 = require("./model");
// Import our custom view classes
const views_1 = require("./views");
exports.default = () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');
    const customViewsModule = new inversify_1.ContainerModule((bind, unbind, isBound, rebind) => {
        bind(sprotty_1.TYPES.ModelSource).to(sprotty_1.LocalModelSource).inSingletonScope();
        rebind(sprotty_1.TYPES.ILogger).to(sprotty_1.ConsoleLogger).inSingletonScope();
        rebind(sprotty_1.TYPES.LogLevel).toConstantValue(sprotty_1.LogLevel.log);
        const context = { bind, unbind, isBound, rebind };
        // Configure the root graph
        (0, sprotty_1.configureModelElement)(context, 'graph', sprotty_1.SGraphImpl, sprotty_1.SGraphView);
        // Configure basic shape nodes
        (0, sprotty_1.configureModelElement)(context, 'node:basic-circle', model_1.BasicShapeNode, views_1.BasicShapeView, {
            enable: [sprotty_1.selectFeature, sprotty_1.moveFeature, sprotty_1.hoverFeedbackFeature]
        });
        (0, sprotty_1.configureModelElement)(context, 'node:basic-triangle', model_1.BasicShapeNode, views_1.BasicShapeView, {
            enable: [sprotty_1.selectFeature, sprotty_1.moveFeature, sprotty_1.hoverFeedbackFeature]
        });
        (0, sprotty_1.configureModelElement)(context, 'node:basic-diamond', model_1.BasicShapeNode, views_1.BasicShapeView, {
            enable: [sprotty_1.selectFeature, sprotty_1.moveFeature, sprotty_1.hoverFeedbackFeature]
        });
        // Configure enhanced nodes
        (0, sprotty_1.configureModelElement)(context, 'node:enhanced', model_1.EnhancedNode, views_1.EnhancedNodeView, {
            enable: [sprotty_1.selectFeature, sprotty_1.moveFeature, sprotty_1.hoverFeedbackFeature, sprotty_1.popupFeature]
        });
        // Configure complex nodes
        (0, sprotty_1.configureModelElement)(context, 'node:complex', model_1.ComplexNode, views_1.ComplexNodeView, {
            enable: [sprotty_1.selectFeature, sprotty_1.moveFeature, sprotty_1.hoverFeedbackFeature, sprotty_1.popupFeature, sprotty_1.fadeFeature]
        });
        // Configure stateful nodes
        (0, sprotty_1.configureModelElement)(context, 'node:stateful', model_1.StatefulNode, views_1.StatefulNodeView, {
            enable: [sprotty_1.selectFeature, sprotty_1.hoverFeedbackFeature]
        });
        // Configure styled edges
        (0, sprotty_1.configureModelElement)(context, 'edge:styled', model_1.StyledEdge, views_1.StyledEdgeView);
        // Configure custom labels
        (0, sprotty_1.configureModelElement)(context, 'label:custom', model_1.CustomLabel, views_1.CustomLabelView);
        (0, sprotty_1.configureViewerOptions)(context, {
            needsClientLayout: false,
            baseDiv: 'sprotty'
        });
    });
    const container = new inversify_1.Container();
    (0, sprotty_1.loadDefaultModules)(container);
    container.load(customViewsModule);
    return container;
};
//# sourceMappingURL=di.config.js.map