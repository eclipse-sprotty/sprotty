/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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

import 'reflect-metadata';
import { Container, ContainerModule } from 'inversify';
import {
    TYPES,
    configureModelElement,
    configureCommand,
    SGraphImpl,
    SGraphView,
    SEdgeImpl,
    PolylineEdgeView,
    LocalModelSource,
    loadDefaultModules,
    configureViewerOptions,
    ActionHandlerRegistry
} from 'sprotty';
import {
    reactModule,
    configureReactNode
} from 'sprotty-react';
import {
    DefaultLayoutConfigurator,
    ElkFactory,
    ElkLayoutEngine,
    ILayoutConfigurator
} from 'sprotty-elk/lib/inversify';
import { LayoutOptions } from 'elkjs/lib/elk-api';
import { SGraph, SModelIndex, SNode, FitToScreenAction } from 'sprotty-protocol';
import ElkConstructor from 'elkjs/lib/elk.bundled';
import { TaskNode, UpdateTaskStatusCommand, UpdateTaskContentCommand, UpdateTaskAssigneeCommand, RemoveElementAction, AddLinkedNodeAction } from './model';
import { TaskNodeComponent } from './task-node';

/**
 * ELK factory for creating ELK layout instances.
 */
const elkFactory: ElkFactory = () => new ElkConstructor({
    algorithms: ['layered']
});

/**
 * Custom layout configurator for task diagrams.
 */
export class TaskLayoutConfigurator extends DefaultLayoutConfigurator {

    protected override graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions | undefined {
        return {
            'elk.algorithm': 'layered',
            'elk.direction': 'RIGHT',
            'elk.spacing.nodeNode': '50',
            'elk.layered.spacing.nodeNodeBetweenLayers': '80'
        };
    }

    protected override nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        // Node sizes are computed from React content measurement
        // No minimum size constraint - let content drive the size
        return {};
    }
}

/**
 * Container module configuring the example diagram.
 */
const exampleModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Configure the graph root element
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);

    // Configure edges
    configureModelElement(context, 'edge:dependency', SEdgeImpl, PolylineEdgeView);

    // Configure the task node with React rendering
    configureReactNode(context, 'node:task', TaskNode, TaskNodeComponent);

    // Register the UpdateTaskStatusCommand to handle status updates
    configureCommand(context, UpdateTaskStatusCommand);

    // Register the UpdateTaskContentCommand to handle title/description updates
    configureCommand(context, UpdateTaskContentCommand);

    // Register the UpdateTaskAssigneeCommand to handle assignee updates
    configureCommand(context, UpdateTaskAssigneeCommand);

    // Bind the model source
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();

    // ELK layout engine configuration
    bind(ElkFactory).toConstantValue(elkFactory);
    bind(ILayoutConfigurator).to(TaskLayoutConfigurator);
    bind(TYPES.IModelLayoutEngine).toDynamicValue((ctx) => (
        new ElkLayoutEngine(
            ctx.container.get(ElkFactory),
            undefined,
            ctx.container.get(ILayoutConfigurator)
        )
    )).inSingletonScope();

    // Configure viewer options
    // needsClientLayout: true enables hidden rendering for bounds measurement
    // needsServerLayout: true enables ELK for node positioning
    configureViewerOptions(context, {
        needsClientLayout: true,
        needsServerLayout: true,
        baseDiv: 'sprotty-container'
    });
});

/**
 * Create and configure the Inversify container.
 */
export function createContainer(): Container {
    const container = new Container();

    // Load default Sprotty modules
    loadDefaultModules(container);

    // Load the React module
    container.load(reactModule);

    // Load our example module
    container.load(exampleModule);

    // Register the custom action handler for removing elements
    // This handler updates the LocalModelSource and triggers a re-render
    const actionHandlerRegistry = container.get<ActionHandlerRegistry>(ActionHandlerRegistry);
    actionHandlerRegistry.register(RemoveElementAction.KIND, {
        handle: (action) => {
            const removeAction = action as RemoveElementAction;
            const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
            const model = modelSource.model;

            // Find all edges connected to the nodes being removed
            const elementIdsToRemove = new Set(removeAction.elementIds);
            if (model.children) {
                for (const child of model.children) {
                    if (child.type?.startsWith('edge:')) {
                        const edge = child as any;
                        if (elementIdsToRemove.has(edge.sourceId) || elementIdsToRemove.has(edge.targetId)) {
                            elementIdsToRemove.add(child.id);
                        }
                    }
                }
            }

            modelSource.removeElements([...elementIdsToRemove]);
        }
    });

    // Register the custom action handler for adding linked nodes
    // This handler creates a new node and edge, then updates the LocalModelSource
    actionHandlerRegistry.register(AddLinkedNodeAction.KIND, {
        handle: (action) => {
            const addAction = action as AddLinkedNodeAction;
            const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
            const model = modelSource.model;

            // Collect existing IDs to avoid conflicts
            const existingIds = new Set<string>();
            if (model.children) {
                for (const child of model.children) {
                    existingIds.add(child.id);
                }
            }

            // Generate unique task ID
            let taskCounter = 1;
            let newTaskId = `task${taskCounter}`;
            while (existingIds.has(newTaskId)) {
                taskCounter++;
                newTaskId = `task${taskCounter}`;
            }

            // Generate unique edge ID
            let edgeCounter = 1;
            let newEdgeId = `edge${edgeCounter}`;
            while (existingIds.has(newEdgeId)) {
                edgeCounter++;
                newEdgeId = `edge${edgeCounter}`;
            }

            // Create new task node
            const newNode = {
                type: 'node:task',
                id: newTaskId,
                size: { width: 220, height: 140 },
                title: 'New Task',
                description: 'Click to edit this task',
                status: 'todo' as const,
                assignee: 'None'
            };

            // Create edge from source to new node
            const newEdge = {
                type: 'edge:dependency',
                id: newEdgeId,
                sourceId: addAction.sourceNodeId,
                targetId: newTaskId
            };

            // Add elements to the model's children
            if (!model.children) {
                model.children = [];
            }
            model.children.push(newNode, newEdge);

            // Clear routing points on all edges so ELK computes fresh routes
            for (const child of model.children) {
                if (child.type?.startsWith('edge:')) {
                    (child as any).routingPoints = [];
                }
            }

            // Use updateModel() to trigger layout engine and re-render
            // This ensures ELK computes proper positions for all nodes
            modelSource.updateModel(model);
            console.log(`Added new task "${newTaskId}" linked from "${addAction.sourceNodeId}"`);

            // Fit to screen after adding the new node
            setTimeout(() => {
                modelSource.actionDispatcher.dispatch(FitToScreenAction.create([], { padding: 10 }));
            }, 100);
        }
    });

    return container;
}

