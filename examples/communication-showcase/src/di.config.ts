/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { Container, ContainerModule } from 'inversify';
import {
    TYPES,
    configureViewerOptions,
    ConsoleLogger,
    LogLevel,
    loadDefaultModules,
    configureModelElement,
    SGraphView,
    SLabelView,
    SGraphImpl,
    SNodeImpl,
    SEdgeImpl,
    SLabelImpl,
    ActionDispatcher,
    IActionDispatcher
} from 'sprotty';
import { DebugNodeView, DebugEdgeView } from './views';
import { DebugModelSource } from './model-source';
import { DebugActionInterceptor } from './debug-interceptor';

/**
 * DI Configuration for the Communication Patterns Showcase
 * This demonstrates how to configure Sprotty with custom action interceptors and debugging tools
 */

export default function createContainer(containerId: string): Container {
    const debugModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(DebugModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);

        const context = { bind, unbind, isBound, rebind };

        // Configure model elements for debugging
        configureModelElement(context, 'graph', SGraphImpl, SGraphView);
        configureModelElement(context, 'node:debug', SNodeImpl, DebugNodeView);
        configureModelElement(context, 'edge:debug', SEdgeImpl, DebugEdgeView);
        configureModelElement(context, 'label', SLabelImpl, SLabelView);

        // Configure action handlers - use the correct Sprotty pattern!
        // Actions will be handled by our custom DebugModelSource

        // Enable debug interceptor for action logging
        bind('BaseActionDispatcher').to(ActionDispatcher).inSingletonScope();
        rebind(TYPES.IActionDispatcher).toDynamicValue((context) => {
            const baseDispatcher = context.container.get<IActionDispatcher>('BaseActionDispatcher');
            const interceptor = new DebugActionInterceptor();
            (interceptor as any).baseDispatcher = baseDispatcher;
            return interceptor;
        }).inSingletonScope();

        // Configure viewer options
        configureViewerOptions(context, {
            needsClientLayout: true, // Let Sprotty handle positioning for dynamic nodes
            needsServerLayout: false,
            baseDiv: containerId,
            hiddenDiv: containerId + '_hidden'
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(debugModule);
    return container;
}