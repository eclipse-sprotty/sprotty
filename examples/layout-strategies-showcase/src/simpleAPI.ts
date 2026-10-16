/********************************************************************************
 * Copyright (c) 2025-2026 TypeFox and others.
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
import { ContainerModule } from 'inversify';
import {
    TYPES,
    createSprottyDiagram,
    LogLevel,
    SprottyDiagram,
    SprottyDiagramOptions,
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
} from 'sprotty-elk';
import { LayoutOptions } from 'elkjs';
import { SGraph, SModelIndex, SNode } from 'sprotty-protocol';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import {
    ServerLayoutNode,
    LayoutEdge
} from './model.js';
import {
    ClientLayoutNodeView,
    ServerLayoutNodeView,
    HybridLayoutNodeView,
    LayoutEdgeView
} from './views.js';

/**
 * ELK factory for creating ELK layout instances
 */
const elkFactory: ElkFactory = () => new ElkConstructor.default({
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
 * Binds the ELK layout engine with the given configurator. The server and hybrid strategies use it;
 * the client strategy computes all layout in the browser.
 */
function elkLayoutEngineModule(configurator: typeof DefaultLayoutConfigurator): ContainerModule {
    return new ContainerModule((bind) => {
        bind(ElkFactory).toConstantValue(elkFactory);
        bind(ILayoutConfigurator).to(configurator);
        bind(TYPES.IModelLayoutEngine).toDynamicValue((context) => (
            new ElkLayoutEngine(
                context.container.get(ElkFactory), // elk factory
                undefined, // filter
                context.container.get(ILayoutConfigurator), // layout configurator
                undefined, // layout preprocessor
                undefined // layout postprocessor
            )
        )).inSingletonScope();
    });
}

/**
 * The diagram options of each strategy. Every strategy replaces the default view of the basic
 * 'edge' type with `LayoutEdgeView`; the server strategy also replaces the basic 'node' type.
 */
const strategyOptions: Record<'client' | 'server' | 'hybrid', () => SprottyDiagramOptions> = {

    // Client-only layout: `needsClientLayout: true, needsServerLayout: false` are the defaults
    client: () => ({
        logLevel: LogLevel.log,
        elements: {
            'node:client': [SNodeImpl, ClientLayoutNodeView],
            'compartment:layout': [SCompartmentImpl, SCompartmentView, {
                enable: [layoutContainerFeature, layoutableChildFeature]
            }],
            'label:layout': [SLabelImpl, SLabelView, {
                enable: [layoutableChildFeature]
            }],
            'label:text': [SLabelImpl, SLabelView, {
                enable: [layoutableChildFeature]
            }],
            'edge': [SEdgeImpl, LayoutEdgeView]
        }
    }),

    // Server-only layout
    server: () => ({
        viewerOptions: {
            needsClientLayout: false,
            needsServerLayout: true
        },
        logLevel: LogLevel.log,
        modules: [elkLayoutEngineModule(ServerLayoutConfigurator)],
        elements: {
            'node': [ServerLayoutNode, ServerLayoutNodeView],
            'edge': [LayoutEdge, LayoutEdgeView]
        }
    }),

    // Hybrid layout: client layout (the default) for the node contents, server layout for positions
    // Note: Same registrations as client layout since hybrid uses same rich content structure
    hybrid: () => ({
        viewerOptions: {
            needsServerLayout: true
        },
        logLevel: LogLevel.log,
        modules: [elkLayoutEngineModule(HybridLayoutConfigurator)],
        elements: {
            'node:hybrid': [SNodeImpl, HybridLayoutNodeView, {
                enable: [layoutContainerFeature, layoutableChildFeature, boundsFeature]
            }],
            'compartment:layout': [SCompartmentImpl, SCompartmentView, {
                enable: [layoutContainerFeature, layoutableChildFeature, boundsFeature]
            }],
            'label:layout': [SLabelImpl, SLabelView, {
                enable: [layoutableChildFeature, boundsFeature]
            }],
            'label:text': [SLabelImpl, SLabelView, {
                enable: [layoutableChildFeature, boundsFeature]
            }],
            'edge': [SEdgeImpl, LayoutEdgeView]
        }
    })
};

/**
 * Create a diagram configured for a specific layout strategy
 */
export function createLayoutDiagram(strategy: 'client' | 'server' | 'hybrid'): SprottyDiagram {
    const options = strategyOptions[strategy];
    if (!options) {
        throw new Error(`Unknown layout strategy: ${strategy}`);
    }
    return createSprottyDiagram(options());
}
