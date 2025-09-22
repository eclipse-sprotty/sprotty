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

import { TYPES, LocalModelSource, IActionDispatcher } from 'sprotty';
import { SGraph, SNode, SEdge, SLabel, FitToScreenAction } from 'sprotty-protocol';
import createContainer from './di.config';

export default async function runStylingShowcase() {
    const container = createContainer();
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);

    // Create the network topology diagram demonstrating different styling approaches
    const graph: SGraph = {
        id: 'graph',
        type: 'graph',
        children: [
            // Section 1: Default styling - only sprotty-node CSS class
            {
                id: 'default1',
                type: 'node:default',
                position: { x: 50, y: 50 },
                size: { width: 120, height: 60 },
                children: [{
                    id: 'default1-label',
                    type: 'label:text',
                    text: 'Server A',
                    position: { x: 40, y: 35 }
                } as SLabel]
            } as SNode,
            {
                id: 'default2',
                type: 'node:default',
                position: { x: 200, y: 50 },
                size: { width: 120, height: 60 },
                children: [{
                    id: 'default2-label',
                    type: 'label:text',
                    text: 'Client B',
                    position: { x: 40, y: 35 }
                } as SLabel]
            } as SNode,

            // Section 2: Subtype-based styling - sprotty-node + subtype CSS classes
            {
                id: 'server1',
                type: 'node:server',
                position: { x: 50, y: 150 },
                size: { width: 120, height: 60 },
                children: [{
                    id: 'server1-label',
                    type: 'label:text',
                    text: 'Database',
                    position: { x: 35, y: 35 }
                } as SLabel]
            } as SNode,
            {
                id: 'router1',
                type: 'node:router',
                position: { x: 200, y: 150 },
                size: { width: 120, height: 60 },
                children: [{
                    id: 'router1-label',
                    type: 'label:text',
                    text: 'Router',
                    position: { x: 45, y: 35 }
                } as SLabel]
            } as SNode,
            {
                id: 'database1',
                type: 'node:database',
                position: { x: 350, y: 150 },
                size: { width: 120, height: 60 },
                children: [{
                    id: 'database1-label',
                    type: 'label:text',
                    text: 'Host',
                    position: { x: 50, y: 35 }
                } as SLabel]
            } as SNode,

            // Section 3: Custom CSS classes - per-element styling
            {
                id: 'critical1',
                type: 'node:critical',
                position: { x: 50, y: 280 },
                size: { width: 120, height: 60 },
                cssClasses: ['critical-system', 'high-priority'],
                children: [{
                    id: 'critical1-label',
                    type: 'label:text',
                    text: 'Critical Server',
                    position: { x: 25, y: 35 }
                } as SLabel]
            } as SNode,

            // Section 4: Conditional styling - custom view with dynamic classes
            {
                id: 'monitor1',
                type: 'node:load-monitor',
                position: { x: 200, y: 270 },
                size: { width: 120, height: 80 },
                loadPercentage: 45
            } as SNode & { loadPercentage: number },

            // Section 5: Interactive styling - selection and hover features
            {
                id: 'interactive1',
                type: 'node:interactive',
                position: { x: 50, y: 400 },
                size: { width: 120, height: 60 },
                children: [{
                    id: 'interactive1-label',
                    type: 'label:text',
                    text: 'Gateway',
                    position: { x: 37, y: 35 }
                } as SLabel]
            } as SNode,

            // Edges demonstrating different edge styling
            {
                id: 'edge1',
                type: 'edge:ethernet',
                sourceId: 'default1',
                targetId: 'default2'
            } as SEdge,
            {
                id: 'edge2',
                type: 'edge:wireless',
                sourceId: 'server1',
                targetId: 'router1'
            } as SEdge,
            {
                id: 'edge3',
                type: 'edge:fiber',
                sourceId: 'router1',
                targetId: 'database1'
            } as SEdge,
            {
                id: 'edge4',
                type: 'edge:ethernet',
                sourceId: 'critical1',
                targetId: 'monitor1'
            } as SEdge
        ]
    };

    // Initialize the model
    modelSource.setModel(graph);

    // Fit the diagram to screen with padding when first loaded
    dispatcher.dispatch(FitToScreenAction.create([], { padding: 20 }));

    // Button to simulate load changes for conditional styling demonstration
    document.getElementById('changeLoad')?.addEventListener('click', () => {
        const currentModel = modelSource.model;
        const monitor = currentModel.children?.find(child => child.id === 'monitor1') as SNode & { loadPercentage: number };
        if (monitor) {
            // Cycle through different load values to demonstrate conditional styling
            const loadValues = [25, 45, 85, 15, 60, 95];
            const currentIndex = loadValues.indexOf(monitor.loadPercentage);
            const nextIndex = (currentIndex + 1) % loadValues.length;
            monitor.loadPercentage = loadValues[nextIndex];

            // Update the model to trigger re-rendering
            modelSource.updateModel(currentModel);
        }
    });
}
