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

import 'reflect-metadata';
import {
    TYPES,
    LocalModelSource,
    IActionDispatcher
} from 'sprotty';
import {
    ViewportRootElement,
    SNode,
    SEdge,
    SLabel,
    SButton,
    Projectable,
    FitToScreenAction
} from 'sprotty-protocol';
import createContainer from './di.config';

export default async function runAdvancedInteractionsShowcase() {
    // Create DI container using the factory function
    const container = createContainer();

    // Get model source and action dispatcher
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);

    // Create sample diagram with interactive elements
    function createSampleModel(): ViewportRootElement {
        return {
            type: 'graph',
            id: 'root',
            children: [
                // Interactive nodes with buttons and rich content
                {
                    id: 'service-1',
                    type: 'node:interactive',
                    position: { x: 50, y: 50 },
                    size: { width: 200, height: 120 },
                    title: 'User Service',
                    description: 'Handles user authentication',
                    icon: '👤',
                    status: 'online',
                    projectionCssClasses: ['service-projection'],
                    children: [
                        {
                            id: 'service-1-info',
                            type: 'button:interactive',
                            position: { x: 170, y: 40 },
                            size: { width: 24, height: 24 },
                            buttonType: 'info',
                            tooltip: 'Show details',
                            pressed: false,
                            enabled: true
                        } as SButton,
                        {
                            id: 'service-1-edit',
                            type: 'button:interactive',
                            position: { x: 170, y: 70 },
                            size: { width: 24, height: 24 },
                            buttonType: 'edit',
                            tooltip: 'Edit service',
                            pressed: false,
                            enabled: true
                        } as SButton,
                        {
                            id: 'service-1-delete',
                            type: 'button:interactive',
                            position: { x: 170, y: 100 },
                            size: { width: 24, height: 24 },
                            buttonType: 'delete',
                            tooltip: 'Delete service',
                            pressed: false,
                            enabled: true
                        } as SButton
                    ]
                } as SNode & Projectable,

                {
                    id: 'service-2',
                    type: 'node:interactive',
                    position: { x: 450, y: 50 },
                    size: { width: 200, height: 120 },
                    title: 'Database Service',
                    description: 'PostgreSQL database',
                    icon: '🗄️',
                    status: 'warning',
                    projectionCssClasses: ['service-projection', 'database-projection'],
                    children: [
                        {
                            id: 'service-2-info',
                            type: 'button:interactive',
                            position: { x: 170, y: 40 },
                            size: { width: 24, height: 24 },
                            buttonType: 'info',
                            tooltip: 'Show details',
                            pressed: false,
                            enabled: true
                        } as SButton,
                        {
                            id: 'service-2-settings',
                            type: 'button:interactive',
                            position: { x: 170, y: 70 },
                            size: { width: 24, height: 24 },
                            buttonType: 'settings',
                            tooltip: 'Configure database',
                            pressed: false,
                            enabled: true
                        } as SButton
                    ]
                } as SNode & Projectable,

                {
                    id: 'service-3',
                    type: 'node:interactive',
                    position: { x: 250, y: 230 },
                    size: { width: 200, height: 120 },
                    title: 'API Gateway',
                    description: 'Routes external requests',
                    icon: '🌐',
                    status: 'error',
                    projectionCssClasses: ['service-projection', 'critical-projection'],
                    children: [
                        {
                            id: 'service-3-info',
                            type: 'button:interactive',
                            position: { x: 170, y: 40 },
                            size: { width: 24, height: 24 },
                            buttonType: 'info',
                            tooltip: 'Show details',
                            pressed: false,
                            enabled: true
                        } as SButton,
                        {
                            id: 'service-3-edit',
                            type: 'button:interactive',
                            position: { x: 170, y: 70 },
                            size: { width: 24, height: 24 },
                            buttonType: 'edit',
                            tooltip: 'Edit configuration',
                            pressed: false,
                            enabled: true
                        } as SButton
                    ]
                } as SNode & Projectable,

                // Connecting edges
                {
                    id: 'edge-1',
                    type: 'edge',
                    sourceId: 'service-1',
                    targetId: 'service-2',
                    children: [
                        {
                            id: 'edge-1-label',
                            type: 'label:edge',
                            text: 'queries',
                            position: { x: 0, y: 0 }
                        } as SLabel
                    ]
                } as SEdge,

                {
                    id: 'edge-2',
                    type: 'edge',
                    sourceId: 'service-1',
                    targetId: 'service-3',
                    children: [
                        {
                            id: 'edge-2-label',
                            type: 'label:edge',
                            text: 'routes',
                            position: { x: 0, y: 0 }
                        } as SLabel
                    ]
                } as SEdge,

                {
                    id: 'edge-3',
                    type: 'edge',
                    sourceId: 'service-3',
                    targetId: 'service-2',
                    children: [
                        {
                            id: 'edge-3-label',
                            type: 'label:edge',
                            text: 'fetches',
                            position: { x: 0, y: 0 }
                        } as SLabel
                    ]
                } as SEdge
            ]
        };
    }

    // Initialize the diagram
    function initializeDiagram(): void {
        const model = createSampleModel();
        modelSource.setModel(model);

        // Fit to screen with padding to account for projection bars (right and bottom)
        setTimeout(() => {
            dispatcher.dispatch(FitToScreenAction.create([], {
                padding: 30,  // Increased padding to account for projection bars
                maxZoom: 1.1
            }));
        }, 100);
    }

    // Initialize immediately
    initializeDiagram();
}
