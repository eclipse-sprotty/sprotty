/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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

import '../css/diagram.css';
import { Container, ContainerModule } from 'inversify';
import {
    TYPES,
    configureModelElement,
    configureViewerOptions,
    loadDefaultModules,
    ConsoleLogger,
    LogLevel,
    LocalModelSource,
    SGraphImpl,
    SGraphView,
    SNodeImpl,
    SEdgeImpl,
    SCompartmentImpl,
    SCompartmentView,
    SLabelImpl,
    SLabelView,
    layoutableChildFeature,
    layoutContainerFeature,
    boundsFeature
} from 'sprotty';
import {
    DefaultLayoutConfigurator,
    ElkFactory,
    ElkLayoutEngine,
    ILayoutConfigurator
} from 'sprotty-elk/lib/inversify';
import { LayoutOptions } from 'elkjs/lib/elk-api';
import { SGraph, SModelIndex, SNode } from 'sprotty-protocol';
import ElkConstructor from 'elkjs/lib/elk.bundled';
import {
    ServerLayoutNode,
    LayoutEdge
} from './model';
import {
    ClientLayoutNodeView,
    ServerLayoutNodeView,
    HybridLayoutNodeView,
    LayoutEdgeView
} from './views';

/**
 * ELK factory for creating ELK layout instances
 */
const elkFactory: ElkFactory = () => new ElkConstructor({
    algorithms: ['layered']
});

/**
 * Custom layout configurator for server-side layout strategies
 */
export class ServerLayoutConfigurator extends DefaultLayoutConfigurator {

    protected override graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions | undefined {
        return {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '50',
            'elk.layered.spacing.nodeNodeBetweenLayers': '80'
        };
    }

    protected override nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        return {
            'elk.nodeSize.constraints': 'NODE_LABELS MINIMUM_SIZE',
            'elk.nodeSize.minimum': '(100, 60)',
            'elk.nodeLabels.placement': 'INSIDE H_CENTER V_CENTER'
        };
    }
}

/**
 * Custom layout configurator for hybrid layout strategies
 */
export class HybridLayoutConfigurator extends DefaultLayoutConfigurator {

    protected override graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions | undefined {
        return {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '60',
            'elk.layered.spacing.nodeNodeBetweenLayers': '80'
        };
    }

    protected override nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        // For hybrid layout, ELK should only position nodes, not their children
        // Client layout handles all internal positioning (labels, compartments, etc.)
        return undefined;
    }
}

/**
 * Client-only layout configuration
 */
export const clientLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Bind model source
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();

    // Configure for client-side layout only
    configureViewerOptions(context, {
        needsClientLayout: true,
        needsServerLayout: false,
        baseDiv: 'sprotty'
    });

    // Register model elements and views
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);
    configureModelElement(context, 'node:client', SNodeImpl, ClientLayoutNodeView);
    configureModelElement(context, 'compartment:layout', SCompartmentImpl, SCompartmentView, {
        enable: [layoutContainerFeature, layoutableChildFeature]
    });
    configureModelElement(context, 'label:layout', SLabelImpl, SLabelView, {
        enable: [layoutableChildFeature]
    });
    configureModelElement(context, 'label:text', SLabelImpl, SLabelView, {
        enable: [layoutableChildFeature]
    });
    configureModelElement(context, 'edge', SEdgeImpl, LayoutEdgeView);

    // Logging
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
});

/**
 * Server-only layout configuration
 */
export const serverLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Bind model source
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();

    // Layout engine configuration
    bind(ElkFactory).toConstantValue(elkFactory);
    bind(ILayoutConfigurator).to(ServerLayoutConfigurator);
    bind(TYPES.IModelLayoutEngine).toDynamicValue((context) => (
        new ElkLayoutEngine(
            context.container.get(ElkFactory), // elk factory
            undefined, // filter
            context.container.get(ILayoutConfigurator), // layout configurator
            undefined, // layout preprocessor
            undefined, // layout postprocessor
        )
    )).inSingletonScope();

    // Configure for server-side layout only
    configureViewerOptions(context, {
        needsClientLayout: false,
        needsServerLayout: true,
        baseDiv: 'sprotty'
    });

    // Register model elements and views
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);
    configureModelElement(context, 'node', ServerLayoutNode, ServerLayoutNodeView);
    configureModelElement(context, 'edge', LayoutEdge, LayoutEdgeView);

    // Logging
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
});

/**
 * Hybrid layout configuration
 */
export const hybridLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Bind model source
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();

    // Layout engine configuration
    bind(ElkFactory).toConstantValue(elkFactory);
    bind(ILayoutConfigurator).to(HybridLayoutConfigurator);
    bind(TYPES.IModelLayoutEngine).toDynamicValue((context) => (
        new ElkLayoutEngine(
            context.container.get(ElkFactory), // elk factory
            undefined, // filter
            context.container.get(ILayoutConfigurator), // layout configurator
            undefined, // layout preprocessor
            undefined, // layout postprocessor
        )
    )).inSingletonScope();

    // Configure for both client and server layout
    configureViewerOptions(context, {
        needsClientLayout: true,
        needsServerLayout: true,
        baseDiv: 'sprotty'
    });

    // Register model elements and views
    // Note: Same registrations as client layout since hybrid uses same rich content structure
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);
    configureModelElement(context, 'node:hybrid', SNodeImpl, HybridLayoutNodeView, {
        enable: [layoutContainerFeature, layoutableChildFeature, boundsFeature]
    });
    configureModelElement(context, 'compartment:layout', SCompartmentImpl, SCompartmentView, {
        enable: [layoutContainerFeature, layoutableChildFeature, boundsFeature]
    });
    configureModelElement(context, 'label:layout', SLabelImpl, SLabelView, {
        enable: [layoutableChildFeature, boundsFeature]
    });
    configureModelElement(context, 'label:text', SLabelImpl, SLabelView, {
        enable: [layoutableChildFeature, boundsFeature]
    });
    configureModelElement(context, 'edge', SEdgeImpl, LayoutEdgeView);

    // Logging
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
});

/**
 * Create and configure container for a specific layout strategy
 */
export function createLayoutContainer(strategy: 'client' | 'server' | 'hybrid'): Container {
    let module: ContainerModule;

    // Select strategy-specific module
    switch (strategy) {
        case 'client':
            module = clientLayoutModule;
            break;
        case 'server':
            module = serverLayoutModule;
            break;
        case 'hybrid':
            module = hybridLayoutModule;
            break;
        default:
            throw new Error(`Unknown layout strategy: ${strategy}`);
    }

    // Create container and load modules
    const container = new Container();
    loadDefaultModules(container);
    container.load(module);

    return container;
}
