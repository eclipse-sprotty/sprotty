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

import { ContainerModule } from "inversify";
import { SEdgeImpl, SGraphImpl, SGraphView, SLabelImpl, SLabelView, SNodeImpl, SRoutingHandleImpl, SRoutingHandleView, configureModelElement } from "sprotty";
import {
    AlternateProcessNodeView,
    CommentNodeView,
    DataNodeView,
    DatabaseNodeView,
    DecisionNodeView,
    DelayNodeView,
    DisplayNodeView,
    DocumentNodeView,
    EdgeLabelView,
    EdgeWithArrow,
    InputOutputNodeView,
    ManualInputNodeView,
    ManualOperationNodeView,
    MultiDocumentNodeView,
    OffPageConnectorNodeView,
    OnPageConnectorNodeView,
    PredefinedProcessNodeView,
    PreparationNodeView,
    ProcessNodeView,
    TerminalNodeView
} from "./views.js";

export const flowchartModule = new ContainerModule((bind, unbind, isBound, rebind) => {

    const context = { bind, unbind, isBound, rebind };

    // Register graph
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);

    // Register nodes
    configureModelElement(context, 'node:terminal', SNodeImpl, TerminalNodeView);
    configureModelElement(context, 'node:process', SNodeImpl, ProcessNodeView);
    configureModelElement(context, 'node:decision', SNodeImpl, DecisionNodeView);
    configureModelElement(context, 'node:input', SNodeImpl, InputOutputNodeView);
    configureModelElement(context, 'node:output', SNodeImpl, InputOutputNodeView);
    configureModelElement(context, 'node:comment', SNodeImpl, CommentNodeView);
    configureModelElement(context, 'node:predefined-process', SNodeImpl, PredefinedProcessNodeView);
    configureModelElement(context, 'node:on-page-connector', SNodeImpl, OnPageConnectorNodeView);
    configureModelElement(context, 'node:off-page-connector', SNodeImpl, OffPageConnectorNodeView);
    configureModelElement(context, 'node:delay', SNodeImpl, DelayNodeView);
    configureModelElement(context, 'node:alternate-process', SNodeImpl, AlternateProcessNodeView);
    configureModelElement(context, 'node:data', SNodeImpl, DataNodeView);
    configureModelElement(context, 'node:document', SNodeImpl, DocumentNodeView);
    configureModelElement(context, 'node:multi-document', SNodeImpl, MultiDocumentNodeView);
    configureModelElement(context, 'node:preparation', SNodeImpl, PreparationNodeView);
    configureModelElement(context, 'node:display', SNodeImpl, DisplayNodeView);
    configureModelElement(context, 'node:manual-input', SNodeImpl, ManualInputNodeView);
    configureModelElement(context, 'node:manual-operation', SNodeImpl, ManualOperationNodeView);
    configureModelElement(context, 'node:database', SNodeImpl, DatabaseNodeView);

    // Register labels
    configureModelElement(context, 'label', SLabelImpl, SLabelView);
    configureModelElement(context, 'label:edge', SLabelImpl, EdgeLabelView);

    // Register edges
    configureModelElement(context, 'edge', SEdgeImpl, EdgeWithArrow);
    configureModelElement(context, 'routing-point', SRoutingHandleImpl, SRoutingHandleView);
    configureModelElement(context, 'volatile-routing-point', SRoutingHandleImpl, SRoutingHandleView);
});
