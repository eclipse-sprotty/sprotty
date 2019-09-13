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

import { ContainerModule } from "inversify";
import { TYPES } from "./types";
import { CanvasBoundsInitializer, InitializeCanvasBoundsCommand } from './features/initialize-canvas';
import { LogLevel, NullLogger } from "../utils/logging";
import { ActionDispatcher, IActionDispatcher } from "./actions/action-dispatcher";
import { ActionHandlerRegistry, configureActionHandler } from "./actions/action-handler";
import { CommandStack, ICommandStack } from "./commands/command-stack";
import { CommandStackOptions } from "./commands/command-stack-options";
import { SModelFactory, SModelRegistry } from './model/smodel-factory';
import { AnimationFrameSyncer } from "./animations/animation-frame-syncer";
import { IViewer, ModelViewer, HiddenModelViewer, PopupModelViewer, ModelRenderer, PatcherProvider } from "./views/viewer";
import { ViewerOptions, defaultViewerOptions } from "./views/viewer-options";
import { MouseTool, PopupMouseTool, MousePositionTracker } from "./views/mouse-tool";
import { KeyTool } from "./views/key-tool";
import { FocusFixPostprocessor, IVNodePostprocessor } from "./views/vnode-postprocessor";
import { ViewRegistry } from "./views/view";
import { ViewerCache } from "./views/viewer-cache";
import { DOMHelper } from "./views/dom-helper";
import { IdPostprocessor } from "./views/id-postprocessor";
import { configureCommand, CommandActionHandlerInitializer } from "./commands/command-registration";
import { CssClassPostprocessor } from "./views/css-class-postprocessor";
import { ToolManager, DefaultToolsEnablingKeyListener, ToolManagerActionHandler } from "./tool-manager/tool-manager";
import { EnableDefaultToolsAction, EnableToolsAction } from "./tool-manager/tool";
import { SetModelCommand } from "./features/set-model";
import { UIExtensionRegistry, SetUIExtensionVisibilityCommand } from "./ui-extensions/ui-extension-registry";
import { DefaultDiagramLocker } from "./actions/diagram-locker";

const defaultContainerModule = new ContainerModule((bind, _unbind, isBound) => {
    // Logging ---------------------------------------------
    bind(TYPES.ILogger).to(NullLogger).inSingletonScope();
    bind(TYPES.LogLevel).toConstantValue(LogLevel.warn);

    // Registries ---------------------------------------------
    bind(TYPES.SModelRegistry).to(SModelRegistry).inSingletonScope();
    bind(ActionHandlerRegistry).toSelf().inSingletonScope();
    bind(TYPES.ActionHandlerRegistryProvider).toProvider<ActionHandlerRegistry>(ctx => {
        return () => {
            return new Promise<ActionHandlerRegistry>((resolve) => {
                resolve(ctx.container.get<ActionHandlerRegistry>(ActionHandlerRegistry));
            });
        };
    });
    bind(TYPES.ViewRegistry).to(ViewRegistry).inSingletonScope();

    // Model Creation ---------------------------------------------
    bind(TYPES.IModelFactory).to(SModelFactory).inSingletonScope();

    // Action Dispatcher ---------------------------------------------
    bind(TYPES.IActionDispatcher).to(ActionDispatcher).inSingletonScope();
    bind(TYPES.IActionDispatcherProvider).toProvider<IActionDispatcher>(ctx => {
        return () => {
            return new Promise<IActionDispatcher>((resolve) => {
                resolve(ctx.container.get<IActionDispatcher>(TYPES.IActionDispatcher));
            });
        };
    });
    bind(TYPES.IDiagramLocker).to(DefaultDiagramLocker).inSingletonScope();

    // Action handler
    bind(TYPES.IActionHandlerInitializer).to(CommandActionHandlerInitializer);

    // Command Stack ---------------------------------------------
    bind(TYPES.ICommandStack).to(CommandStack).inSingletonScope();
    bind(TYPES.ICommandStackProvider).toProvider<ICommandStack>(ctx => {
        return () => {
            return new Promise<ICommandStack>((resolve) => {
                resolve(ctx.container.get<ICommandStack>(TYPES.ICommandStack));
            });
        };
    });
    bind<CommandStackOptions>(TYPES.CommandStackOptions).toConstantValue({
        defaultDuration: 250,
        undoHistoryLimit: 50
    });

    // Viewer ---------------------------------------------
    bind(ModelViewer).toSelf().inSingletonScope();
    bind(HiddenModelViewer).toSelf().inSingletonScope();
    bind(PopupModelViewer).toSelf().inSingletonScope();
    bind(TYPES.ModelViewer).toDynamicValue(ctx => {
        const container = ctx.container.createChild();
        container.bind(TYPES.IViewer).toService(ModelViewer);
        container.bind(ViewerCache).toSelf();
        return container.get(ViewerCache);
    }).inSingletonScope();
    bind(TYPES.PopupModelViewer).toDynamicValue(ctx => {
        const container = ctx.container.createChild();
        container.bind(TYPES.IViewer).toService(PopupModelViewer);
        container.bind(ViewerCache).toSelf();
        return container.get(ViewerCache);
    }).inSingletonScope();
    bind(TYPES.HiddenModelViewer).toService(HiddenModelViewer);
    bind(TYPES.IViewerProvider).toDynamicValue(ctx => {
        return {
            get modelViewer() {
                return ctx.container.get<IViewer>(TYPES.ModelViewer);
            },
            get hiddenModelViewer() {
                return ctx.container.get<IViewer>(TYPES.HiddenModelViewer);
            },
            get popupModelViewer() {
                return ctx.container.get<IViewer>(TYPES.PopupModelViewer);
            }
        };
    });
    bind<ViewerOptions>(TYPES.ViewerOptions).toConstantValue(defaultViewerOptions());
    bind(TYPES.PatcherProvider).to(PatcherProvider).inSingletonScope();
    bind(TYPES.DOMHelper).to(DOMHelper).inSingletonScope();
    bind(TYPES.ModelRendererFactory).toFactory<ModelRenderer>(ctx => {
        return (processors: IVNodePostprocessor[]) => {
            const viewRegistry = ctx.container.get<ViewRegistry>(TYPES.ViewRegistry);
            return new ModelRenderer(viewRegistry, processors);
        };
    });

    // Tools & Postprocessors --------------------------------------
    bind(IdPostprocessor).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(IdPostprocessor);
    bind(TYPES.HiddenVNodePostprocessor).toService(IdPostprocessor);
    bind(CssClassPostprocessor).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(CssClassPostprocessor);
    bind(TYPES.HiddenVNodePostprocessor).toService(CssClassPostprocessor);
    bind(MouseTool).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(MouseTool);
    bind(KeyTool).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(KeyTool);
    bind(FocusFixPostprocessor).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(FocusFixPostprocessor);
    bind(TYPES.PopupVNodePostprocessor).toService(IdPostprocessor);
    bind(PopupMouseTool).toSelf().inSingletonScope();
    bind(TYPES.PopupVNodePostprocessor).toService(PopupMouseTool);

    // Animation Frame Sync ------------------------------------------
    bind(TYPES.AnimationFrameSyncer).to(AnimationFrameSyncer).inSingletonScope();

    // Canvas Initialization ---------------------------------------------
    const context = { bind, isBound };
    configureCommand(context, InitializeCanvasBoundsCommand);
    bind(CanvasBoundsInitializer).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(CanvasBoundsInitializer);

    // Model commands ---------------------------------------------
    configureCommand(context, SetModelCommand);

    // Tool manager initialization ------------------------------------
    bind(TYPES.IToolManager).to(ToolManager).inSingletonScope();
    bind(TYPES.KeyListener).to(DefaultToolsEnablingKeyListener);
    bind(ToolManagerActionHandler).toSelf().inSingletonScope();
    configureActionHandler(context, EnableDefaultToolsAction.KIND, ToolManagerActionHandler);
    configureActionHandler(context, EnableToolsAction.KIND, ToolManagerActionHandler);

    // UIExtension registry initialization ------------------------------------
    bind(TYPES.UIExtensionRegistry).to(UIExtensionRegistry).inSingletonScope();
    configureCommand(context, SetUIExtensionVisibilityCommand);

    // Tracker for last known mouse position on diagram ------------------------
    bind(MousePositionTracker).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(MousePositionTracker);
});

export default defaultContainerModule;
