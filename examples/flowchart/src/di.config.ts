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

import { Container, ContainerModule } from "inversify";
import {
    CircularNodeView,
    ConsoleLogger,
    LogLevel,
    SCompartmentImpl,
    SCompartmentView,
    SEdgeImpl,
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    SLabelView,
    SNodeImpl,
    SPortImpl,
    SRoutingHandleImpl,
    SRoutingHandleView,
    TYPES,
    configureModelElement,
    configureViewerOptions,
    editLabelFeature,
    loadDefaultModules,
    moveFeature,
    selectFeature
} from "sprotty";
import { FlowchartModelSource } from "./model-source";
import { DecisionNodeView, EdgeLabel, EdgeWithArrow, ProcessNodeView, TerminalNodeView } from "./views";

export default (containerId: string) => {
    require('../css/diagram.css');

    const flowchartModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(FlowchartModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };

        configureModelElement(context, 'graph', SGraphImpl, SGraphView);
        configureModelElement(context, 'node:terminal', SNodeImpl, TerminalNodeView);
        configureModelElement(context, 'node:process', SNodeImpl, ProcessNodeView);
        configureModelElement(context, 'node:decision', SNodeImpl, DecisionNodeView);
        configureModelElement(context, 'label', SLabelImpl, SLabelView, {enable: [editLabelFeature]});
        configureModelElement(context, 'label:edge', SLabelImpl, EdgeLabel, {enable: [moveFeature, selectFeature, editLabelFeature]});
        configureModelElement(context, 'edge', SEdgeImpl, EdgeWithArrow);
        configureModelElement(context, 'routing-point', SRoutingHandleImpl, SRoutingHandleView);
        configureModelElement(context, 'volatile-routing-point', SRoutingHandleImpl, SRoutingHandleView);
        configureModelElement(context, 'port:in', SPortImpl, CircularNodeView);
        configureModelElement(context, 'port:out', SPortImpl, CircularNodeView);
        configureModelElement(context, 'compartment', SCompartmentImpl, SCompartmentView);

        configureViewerOptions(context, {
            needsClientLayout: true,
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(flowchartModule);
    return container;
};
