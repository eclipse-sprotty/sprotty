/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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
    TYPES, configureViewerOptions, SGraphView, SLabelView, SCompartmentView, JumpingPolylineEdgeView,
    ConsoleLogger, LogLevel, loadDefaultModules, HtmlRootView, PreRenderedView, ExpandButtonView,
    SRoutingHandleView, PreRenderedElement, HtmlRoot, SGraph, configureModelElement, SLabel,
    SCompartment, SEdge, SButton, SRoutingHandle, RevealNamedElementActionProvider,
    CenterGridSnapper, expandFeature, nameFeature, withEditLabelFeature, editLabelFeature,
    RectangularNode, BezierCurveEdgeView, SBezierCreateHandleView, SBezierControlHandleView, ExpandButtonHandler, IButtonHandler
} from 'sprotty';
import edgeIntersectionModule from "sprotty/lib/features/edge-intersection/di.config";
import { IconView, NodeView} from "./views";
import { PopupModelProvider } from "./popup";
import { ClassDiagramModelSource } from './model-source';
import { ClassDiagramLabelValidator, ClassDiagramLabelValidationDecorator } from './label-validation';
import { Icon, ClassNode, ClassLabel, PropertyLabel } from "./model";
import { BezierMouseListener } from 'sprotty/lib/features/routing/bezier-edge-router';
import {injectable} from "inversify";
import { Action } from "sprotty-protocol";
export default (containerId: string) => {
    require("sprotty/css/sprotty.css");
    require("sprotty/css/command-palette.css");
    require("sprotty/css/edit-label.css");
    require("../css/diagram.css");

    const classDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(ClassDiagramModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        bind(TYPES.IPopupModelProvider).to(PopupModelProvider);
        bind(TYPES.ICommandPaletteActionProvider).to(RevealNamedElementActionProvider);
        bind(TYPES.ISnapper).to(CenterGridSnapper);
        bind(TYPES.IEditLabelValidator).to(ClassDiagramLabelValidator);
        bind(TYPES.IEditLabelValidationDecorator).to(ClassDiagramLabelValidationDecorator);
        bind(TYPES.MouseListener).to(BezierMouseListener);

        const context = { bind, unbind, isBound, rebind };
        configureModelElement(context, 'graph', SGraph, SGraphView);
        configureModelElement(context, 'node:package', RectangularNode, NodeView);
        configureModelElement(context, 'node:class', ClassNode, NodeView, {
            enable: [expandFeature, nameFeature, withEditLabelFeature]
        });
        configureModelElement(context, 'label:heading', ClassLabel, SLabelView, {
            enable: [editLabelFeature]
        });
        configureModelElement(context, 'label:text', PropertyLabel, SLabelView, {
            enable: [editLabelFeature]
        });
        configureModelElement(context, 'comp:comp', SCompartment, SCompartmentView);
        configureModelElement(context, 'comp:header', SCompartment, SCompartmentView);
        configureModelElement(context, 'comp:pkgcontent', SCompartment, SCompartmentView);
        configureModelElement(context, 'icon', Icon, IconView);
        configureModelElement(context, 'label:icon', SLabel, SLabelView);
        configureModelElement(context, 'edge:straight', SEdge, JumpingPolylineEdgeView);
        configureModelElement(context, 'edge:bezier', SEdge, BezierCurveEdgeView);
        configureModelElement(context, 'html', HtmlRoot, HtmlRootView);
        configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView);
        configureModelElement(context, 'button:expand', SButton, ExpandButtonView);
        configureModelElement(context, 'routing-point', SRoutingHandle, SRoutingHandleView);
        configureModelElement(context, 'volatile-routing-point', SRoutingHandle, SRoutingHandleView);
        configureModelElement(context, 'bezier-create-routing-point', SRoutingHandle, SBezierCreateHandleView);
        configureModelElement(context, 'bezier-remove-routing-point', SRoutingHandle, SBezierCreateHandleView);
        configureModelElement(context, 'bezier-routing-point', SRoutingHandle, SBezierControlHandleView);


        configureViewerOptions(context, {
            needsClientLayout: true,
            baseDiv: containerId
        });

        rebind(ExpandButtonHandler).to(CustomExpandButtonHandler).inSingletonScope();
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(edgeIntersectionModule);
    container.load(classDiagramModule);
    return container;
};

@injectable()
export class CustomExpandButtonHandler implements IButtonHandler{
    static TYPE = 'button:expand';

    buttonPressed(button: SButton): Action[] {
        console.log("I'm the custom expand handler");
        return [];
    }

}