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
    SCompartmentView,
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
            'node:package': { model: RectangularNode, view: NodeView },
            'node:class': { model: ClassNode, view: NodeView, features: {
                enable: [expandFeature, nameFeature, withEditLabelFeature]
            } },
            'label:heading': { model: ClassLabel, view: SLabelView, features: {
                enable: [editLabelFeature]
            } },
            'label:text': { model: PropertyLabel, view: SLabelView, features: {
                enable: [moveFeature, selectFeature]
            } },
            'comp:comp': { view: SCompartmentView },
            'comp:header': { view: SCompartmentView },
            'comp:pkgcontent': { view: SCompartmentView },
            'icon': { model: Icon, view: IconView },
            'label:icon': { view: SLabelView },
            'edge:straight': { view: JumpingPolylineEdgeView },
            'edge:bezier': { view: BezierCurveEdgeView },
            'html': { model: HtmlRootImpl, view: HtmlRootView },
            'pre-rendered': { model: PreRenderedElementImpl, view: PreRenderedView },
            'button:expand': { model: SButtonImpl, view: ExpandButtonView },
            'bezier-create-routing-point': { model: SRoutingHandleImpl, view: SBezierCreateHandleView },
            'bezier-remove-routing-point': { model: SRoutingHandleImpl, view: SBezierCreateHandleView },
            'bezier-routing-point': { model: SRoutingHandleImpl, view: SBezierControlHandleView }
        }
    });
};
