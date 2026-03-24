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
import { LogLevel, NullLogger } from "../utils/logging.js";
import { ActionDispatcher, IActionDispatcher } from "./actions/action-dispatcher.js";
import { ActionHandlerRegistry } from "./actions/action-handler.js";
import { DefaultDiagramLocker } from "./actions/diagram-locker.js";
import { AnimationFrameSyncer } from "./animations/animation-frame-syncer.js";
import { CommandActionHandlerInitializer, configureCommand } from "./commands/command-registration.js";
import { CommandStackOptions, defaultCommandStackOptions } from "./commands/command-stack-options.js";
import { CommandStack, ICommandStack } from "./commands/command-stack.js";
import { CanvasBoundsInitializer, InitializeCanvasBoundsCommand } from './features/initialize-canvas.js';
import { SetModelCommand } from "./features/set-model.js";
import { SModelFactory, SModelRegistry } from './model/smodel-factory.js';
import { TYPES } from "./types.js";
import { SetUIExtensionVisibilityCommand, UIExtensionRegistry } from "./ui-extensions/ui-extension-registry.js";
import { CssClassPostprocessor } from "./views/css-class-postprocessor.js";
import { DOMHelper } from "./views/dom-helper.js";
import { IdPostprocessor } from "./views/id-postprocessor.js";
import { KeyTool } from "./views/key-tool.js";
import { MousePositionTracker, MouseTool, PopupMouseTool } from "./views/mouse-tool.js";
import { PointerTool } from "./views/pointer-tool.js";
import { TouchTool } from "./views/touch-tool.js";
import { IViewArgs, RenderingTargetKind, ViewRegistry } from "./views/view.js";
import { ViewerCache } from "./views/viewer-cache.js";
import { ViewerOptions, defaultViewerOptions } from "./views/viewer-options.js";
import { HiddenModelViewer, IViewer, ModelRenderer, ModelViewer, PatcherProvider, PopupModelViewer } from "./views/viewer.js";
import { FocusFixPostprocessor, IVNodePostprocessor } from "./views/vnode-postprocessor.js";

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
    bind(CommandActionHandlerInitializer).toSelf().inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).toService(CommandActionHandlerInitializer);

    // Command Stack ---------------------------------------------
    bind(TYPES.ICommandStack).to(CommandStack).inSingletonScope();
    bind(TYPES.ICommandStackProvider).toProvider<ICommandStack>(ctx => {
        return () => {
            return new Promise<ICommandStack>((resolve) => {
                resolve(ctx.container.get<ICommandStack>(TYPES.ICommandStack));
            });
        };
    });
    bind<CommandStackOptions>(TYPES.CommandStackOptions).toConstantValue(defaultCommandStackOptions());

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
        return (targetKind: RenderingTargetKind, processors: IVNodePostprocessor[], args: IViewArgs = {}) => {
            const viewRegistry = ctx.container.get<ViewRegistry>(TYPES.ViewRegistry);
            return new ModelRenderer(viewRegistry, targetKind, processors, args);
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
    bind(PointerTool).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(PointerTool);
    bind(TouchTool).toSelf().inSingletonScope();
    bind(TYPES.IVNodePostprocessor).toService(TouchTool);
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

    // UIExtension registry initialization ------------------------------------
    bind(TYPES.UIExtensionRegistry).to(UIExtensionRegistry).inSingletonScope();
    configureCommand(context, SetUIExtensionVisibilityCommand);

    // Tracker for last known mouse position on diagram ------------------------
    bind(MousePositionTracker).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(MousePositionTracker);
});

export default defaultContainerModule;
