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

export const TYPES = {
    Action: Symbol('Action'),
    IActionDispatcher: Symbol('IActionDispatcher'),
    IActionDispatcherProvider: Symbol('IActionDispatcherProvider'),
    IActionHandlerInitializer: Symbol('IActionHandlerInitializer'),
    ActionHandlerRegistry: Symbol('ActionHandlerRegistry'),
    IAnchorComputer: Symbol('IAnchor'),
    AnimationFrameSyncer: Symbol('AnimationFrameSyncer'),
    CommandStackOptions: Symbol('CommandStackOptions'),
    IButtonHandler: Symbol('IButtonHandler'),
    CommandRegistration: Symbol('CommandRegistration'),
    ICommandStack: Symbol('ICommandStack'),
    ICommandStackProvider: Symbol('ICommandStackProvider'),
    DOMHelper: Symbol('DOMHelper'),
    IEdgeRouter: Symbol('IEdgeRouter'),
    HiddenVNodeDecorator: Symbol('HiddenVNodeDecorator'),
    HoverState: Symbol('HoverState'),
    KeyListener: Symbol('KeyListener'),
    Layouter: Symbol('Layouter'),
    LayoutRegistry: Symbol('LayoutRegistry'),
    ILogger: Symbol('ILogger'),
    LogLevel: Symbol('LogLevel'),
    IModelFactory: Symbol('IModelFactory'),
    IModelLayoutEngine: Symbol('IModelLayoutEngine'),
    ModelRendererFactory: Symbol('ModelRendererFactory'),
    ModelSource: Symbol('ModelSource'),
    ModelSourceProvider: Symbol('ModelSourceProvider'),
    MouseListener: Symbol('MouseListener'),
    /**
     * @deprecated Use IPopupModelProvider instead.
     */
    PopupModelFactory: Symbol('PopupModelFactory'),
    IPopupModelProvider: Symbol('IPopupModelProvider'),
    PopupMouseListener: Symbol('PopupMouseListener'),
    PopupVNodeDecorator: Symbol('PopupVNodeDecorator'),
    SModelElementRegistration: Symbol('SModelElementRegistration'),
    SModelRegistry: Symbol('SModelRegistry'),
    SModelStorage: Symbol('SModelStorage'),
    StateAwareModelProvider: Symbol('StateAwareModelProvider'),
    SvgExporter: Symbol('SvgExporter'),
    IViewer: Symbol('IViewer'),
    ViewerOptions: Symbol('ViewerOptions'),
    IViewerProvider: Symbol('IViewerProvider'),
    ViewRegistration: Symbol('ViewRegistration'),
    ViewRegistry: Symbol('ViewRegistry'),
    IVNodeDecorator: Symbol('IVNodeDecorator'),
    IToolManager: Symbol('IToolManager')
};
