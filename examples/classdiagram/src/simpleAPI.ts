/********************************************************************************
 * Copyright (c) 2017-2026 TypeFox and others.
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

import { ContainerModule } from 'inversify';
import {
    BezierCurveEdgeView,
    BezierMouseListener,
    CenterGridSnapper,
    ExpandButtonView,
    HtmlRootImpl,
    HtmlRootView,
    JumpingPolylineEdgeView,
    LogLevel,
    PreRenderedElementImpl,
    PreRenderedView,
    RectangularNode,
    RevealNamedElementActionProvider,
    SBezierControlHandleView,
    SBezierCreateHandleView,
    SButtonImpl,
    SCompartmentImpl,
    SCompartmentView,
    SEdgeImpl,
    SLabelImpl,
    SLabelView,
    SRoutingHandleImpl,
    TYPES,
    createSprottyDiagram,
    edgeIntersectionModule,
    editLabelFeature,
    expandFeature,
    moveFeature,
    nameFeature,
    selectFeature,
    withEditLabelFeature
} from 'sprotty';
import { ClassDiagramLabelValidationDecorator, ClassDiagramLabelValidator } from './label-validation.js';
import { ClassContextMenuItemProvider, ClassContextMenuService } from './menu.js';
import { ClassLabel, ClassNode, Icon, PropertyLabel } from './model.js';
import { ClassDiagramModelSource } from './model-source.js';
import { PopupModelProvider } from './popup.js';
import { IconView, NodeView } from './views.js';

export default (containerId: string) => {
    require('sprotty/css/sprotty.css');
    require('sprotty/css/command-palette.css');
    require('sprotty/css/edit-label.css');
    require('../css/diagram.css');

    // The services this example contributes; element registrations go through `elements` below
    const classDiagramModule = new ContainerModule((bind) => {
        bind(TYPES.IPopupModelProvider).to(PopupModelProvider);
        bind(RevealNamedElementActionProvider).toSelf().inSingletonScope();
        bind(TYPES.ICommandPaletteActionProvider).toService(RevealNamedElementActionProvider);
        bind(TYPES.ISnapper).to(CenterGridSnapper);
        bind(TYPES.IEditLabelValidator).to(ClassDiagramLabelValidator);
        bind(TYPES.IEditLabelValidationDecorator).to(ClassDiagramLabelValidationDecorator);
        bind(BezierMouseListener).toSelf().inSingletonScope();
        bind(TYPES.MouseListener).toService(BezierMouseListener);
        bind(TYPES.IContextMenuService).to(ClassContextMenuService);
        bind(TYPES.IContextMenuItemProvider).to(ClassContextMenuItemProvider);
    });

    return createSprottyDiagram({
        modelSource: ClassDiagramModelSource,
        viewerOptions: {
            baseDiv: containerId
        },
        logLevel: LogLevel.log,
        modules: [edgeIntersectionModule, classDiagramModule],
        elements: {
            'node:package': [RectangularNode, NodeView],
            'node:class': [ClassNode, NodeView, {
                enable: [expandFeature, nameFeature, withEditLabelFeature]
            }],
            'label:heading': [ClassLabel, SLabelView, {
                enable: [editLabelFeature]
            }],
            'label:text': [PropertyLabel, SLabelView, {
                enable: [moveFeature, selectFeature]
            }],
            'comp:comp': [SCompartmentImpl, SCompartmentView],
            'comp:header': [SCompartmentImpl, SCompartmentView],
            'comp:pkgcontent': [SCompartmentImpl, SCompartmentView],
            'icon': [Icon, IconView],
            'label:icon': [SLabelImpl, SLabelView],
            'edge:straight': [SEdgeImpl, JumpingPolylineEdgeView],
            'edge:bezier': [SEdgeImpl, BezierCurveEdgeView],
            'html': [HtmlRootImpl, HtmlRootView],
            'pre-rendered': [PreRenderedElementImpl, PreRenderedView],
            'button:expand': [SButtonImpl, ExpandButtonView],
            'bezier-create-routing-point': [SRoutingHandleImpl, SBezierCreateHandleView],
            'bezier-remove-routing-point': [SRoutingHandleImpl, SBezierCreateHandleView],
            'bezier-routing-point': [SRoutingHandleImpl, SBezierControlHandleView]
        }
    });
};
