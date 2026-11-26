/********************************************************************************
 * Copyright (c) 2017-2024 TypeFox and others.
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

 /* eslint-disable @typescript-eslint/naming-convention */
export const TYPES = {
    Action: Symbol.for('Action'),
    IActionDispatcher: Symbol.for('IActionDispatcher'),
    IActionDispatcherProvider: Symbol.for('IActionDispatcherProvider'),
    IActionHandlerInitializer: Symbol.for('IActionHandlerInitializer'),
    ActionHandlerRegistration: Symbol.for('ActionHandlerRegistration'),
    ActionHandlerRegistryProvider: Symbol.for('ActionHandlerRegistryProvider'),
    IAnchorComputer: Symbol.for('IAnchor'),
    AnimationFrameSyncer: Symbol.for('AnimationFrameSyncer'),
    IButtonHandlerRegistration: Symbol.for('IButtonHandlerRegistration'),
    ICommandPaletteActionProvider: Symbol.for('ICommandPaletteActionProvider'),
    ICommandPaletteActionProviderRegistry: Symbol.for('ICommandPaletteActionProviderRegistry'),
    CommandRegistration: Symbol.for('CommandRegistration'),
    ICommandStack: Symbol.for('ICommandStack'),
    CommandStackOptions: Symbol.for('CommandStackOptions'),
    ICommandStackProvider: Symbol.for('ICommandStackProvider'),
    IContextMenuItemProvider: Symbol.for("IContextMenuProvider"),
    IContextMenuProviderRegistry: Symbol.for("IContextMenuProviderRegistry"),
    IContextMenuService: Symbol.for("IContextMenuService"),
    IContextMenuServiceProvider: Symbol.for("IContextMenuServiceProvider"),
    DOMHelper: Symbol.for('DOMHelper'),
    IDiagramLocker: Symbol.for('IDiagramLocker'),
    IEdgeRouter: Symbol.for('IEdgeRouter'),
    IEdgeRoutePostprocessor: Symbol.for('IEdgeRoutePostprocessor'),
    IEditLabelValidationDecorator: Symbol.for('IEditLabelValidationDecorator'),
    IEditLabelValidator: Symbol.for('IEditLabelValidator'),
    HiddenModelViewer: Symbol.for('HiddenModelViewer'),
    HiddenVNodePostprocessor: Symbol.for('HiddenVNodeDecorator'),
    HoverState: Symbol.for('HoverState'),
    KeyListener: Symbol.for('KeyListener'),
    LayoutRegistration: Symbol.for('LayoutRegistration'),
    LayoutRegistry: Symbol.for('LayoutRegistry'),
    Layouter: Symbol.for('Layouter'),
    LogLevel: Symbol.for('LogLevel'),
    ILogger: Symbol.for('ILogger'),
    IModelFactory: Symbol.for('IModelFactory'),
    IModelLayoutEngine: Symbol.for('IModelLayoutEngine'),
    ModelRendererFactory: Symbol.for('ModelRendererFactory'),
    ModelSource: Symbol.for('ModelSource'),
    ModelSourceProvider: Symbol.for('ModelSourceProvider'),
    ModelViewer: Symbol.for('ModelViewer'),
    MouseListener: Symbol.for('MouseListener'),
    PatcherProvider: Symbol.for('PatcherProvider'),
    IPointerListener: Symbol.for('IPointerListener'),
    IPopupModelProvider: Symbol.for('IPopupModelProvider'),
    PopupModelViewer: Symbol.for('PopupModelViewer'),
    PopupMouseListener: Symbol.for('PopupMouseListener'),
    PopupVNodePostprocessor: Symbol.for('PopupVNodeDecorator'),
    SModelElementRegistration: Symbol.for('SModelElementRegistration'),
    SModelRegistry: Symbol.for('SModelRegistry'),
    ISnapper: Symbol.for('ISnapper'),
    SvgExporter: Symbol.for('SvgExporter'),
    ISvgExportPostprocessor: Symbol.for('ISvgExportPostprocessor'),
    ITouchListener: Symbol.for('ITouchListener'),
    IUIExtension: Symbol.for('IUIExtension'),
    UIExtensionRegistry: Symbol.for('UIExtensionRegistry'),
    IVNodePostprocessor: Symbol.for('IVNodePostprocessor'),
    ViewRegistration: Symbol.for('ViewRegistration'),
    ViewRegistry: Symbol.for('ViewRegistry'),
    IViewer: Symbol.for('IViewer'),
    ViewerOptions: Symbol.for('ViewerOptions'),
    IViewerProvider: Symbol.for('IViewerProvider'),
};
/* eslint-enable */
