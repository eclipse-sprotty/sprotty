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
import {
    CircularNode,
    DiamondNode,
    RectangularNode,
    SEdgeImpl,
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    SLabelView,
    SRoutingHandleImpl,
    SRoutingHandleView,
    configureModelElement
} from "sprotty";
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
    configureModelElement(context, 'node:terminal', RectangularNode, TerminalNodeView);
    configureModelElement(context, 'node:process', RectangularNode, ProcessNodeView);
    configureModelElement(context, 'node:decision', DiamondNode, DecisionNodeView);
    configureModelElement(context, 'node:input', RectangularNode, InputOutputNodeView);
    configureModelElement(context, 'node:output', RectangularNode, InputOutputNodeView);
    configureModelElement(context, 'node:comment', RectangularNode, CommentNodeView);
    configureModelElement(context, 'node:predefined-process', RectangularNode, PredefinedProcessNodeView);
    configureModelElement(context, 'node:on-page-connector', CircularNode, OnPageConnectorNodeView);
    configureModelElement(context, 'node:off-page-connector', RectangularNode, OffPageConnectorNodeView);
    configureModelElement(context, 'node:delay', RectangularNode, DelayNodeView);
    configureModelElement(context, 'node:alternate-process', RectangularNode, AlternateProcessNodeView);
    configureModelElement(context, 'node:data', RectangularNode, DataNodeView);
    configureModelElement(context, 'node:document', RectangularNode, DocumentNodeView);
    configureModelElement(context, 'node:multi-document', RectangularNode, MultiDocumentNodeView);
    configureModelElement(context, 'node:preparation', RectangularNode, PreparationNodeView);
    configureModelElement(context, 'node:display', RectangularNode, DisplayNodeView);
    configureModelElement(context, 'node:manual-input', RectangularNode, ManualInputNodeView);
    configureModelElement(context, 'node:manual-operation', RectangularNode, ManualOperationNodeView);
    configureModelElement(context, 'node:database', RectangularNode, DatabaseNodeView);

    // Register labels
    configureModelElement(context, 'label', SLabelImpl, SLabelView);
    configureModelElement(context, 'label:edge', SLabelImpl, EdgeLabelView);

    // Register edges
    configureModelElement(context, 'edge', SEdgeImpl, EdgeWithArrow);
    configureModelElement(context, 'routing-point', SRoutingHandleImpl, SRoutingHandleView);
    configureModelElement(context, 'volatile-routing-point', SRoutingHandleImpl, SRoutingHandleView);
});
