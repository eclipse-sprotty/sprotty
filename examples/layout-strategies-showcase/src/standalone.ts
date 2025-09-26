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

import { TYPES, LocalModelSource } from 'sprotty';
import { SGraph, SNode, SEdge, SLabel, SCompartment, FitToScreenAction } from 'sprotty-protocol';
import { createLayoutContainer } from './di.config';
// Global variables for the demo
let currentContainer: any;
let currentModelSource: LocalModelSource;
let currentStrategy: 'client' | 'server' | 'hybrid' = 'client';

/**
 * Main entry point for the Layout Strategies Showcase
 */
export default async function runLayoutStrategiesShowcase(): Promise<void> {
    console.log('Starting Layout Strategies Showcase...');

    // Initialize with client layout strategy
    await switchLayoutStrategy('client');

    // Set up UI controls
    setupControls();

    console.log('Layout Strategies Showcase loaded successfully!');
}

/**
 * Switch between different layout strategies
 */
async function switchLayoutStrategy(strategy: 'client' | 'server' | 'hybrid'): Promise<void> {
    currentStrategy = strategy;

    console.log(`Switching to ${strategy} layout strategy...`);

    // Create new container with the selected strategy
    currentContainer = createLayoutContainer(strategy);
    currentModelSource = await currentContainer.getAsync(TYPES.ModelSource);

    // Create and set the appropriate model
    const model = createModelForStrategy(strategy);

    // Debug: Log the model for hybrid layout
    if (strategy === 'hybrid') {
        console.log('Hybrid model:', JSON.stringify(model, null, 2));
    }

    await currentModelSource.setModel(model);

    // Fit to screen after a short delay
    setTimeout(() => {
        currentModelSource.actionDispatcher.dispatch(FitToScreenAction.create([], { padding: 20 }));
    }, 100);

    // Update active button state
    updateActiveButton();

    console.log(`${strategy} layout applied`);
}

/**
 * Create model appropriate for the selected layout strategy
 * All strategies use the same content for fair performance comparison
 */
function createModelForStrategy(strategy: 'client' | 'server' | 'hybrid'): SGraph {
    return createStandardDiagramModel(strategy);
}

/**
 * Create standardized diagram model for all layout strategies
 * Same content, different layout approach
 */
function createStandardDiagramModel(strategy: 'client' | 'server' | 'hybrid'): SGraph {
    const graphId = `${strategy}-layout-demo`;

    // Standard microservices architecture with 5 nodes and 6 edges
    // Adjust positions based on strategy to accommodate different node sizes
    const positions = getPositionsForStrategy(strategy);

    const baseModel: SGraph = {
        type: 'graph',
        id: graphId,
        children: [
            // Frontend Node
            createNodeForStrategy('frontend', 'Web App', 'React frontend application', '🌐', 'frontend', strategy, positions.frontend),

            // API Gateway Node
            createNodeForStrategy('gateway', 'API Gateway', 'Routes and manages requests', '🚪', 'gateway', strategy, positions.gateway),

            // Auth Service Node
            createNodeForStrategy('auth', 'Auth Service', 'Handles authentication', '🔐', 'service', strategy, positions.auth),

            // User Service Node
            createNodeForStrategy('users', 'User Service', 'Manages user data', '👤', 'service', strategy, positions.users),

            // Database Node
            createNodeForStrategy('database', 'PostgreSQL', 'Primary data storage', '🗄️', 'database', strategy, positions.database),

            // Standard edges connecting the services
            createEdgeForStrategy('edge-1', 'frontend', 'gateway', 'communication', strategy),
            createEdgeForStrategy('edge-2', 'gateway', 'auth', 'communication', strategy),
            createEdgeForStrategy('edge-3', 'gateway', 'users', 'communication', strategy),
            createEdgeForStrategy('edge-4', 'auth', 'database', 'dependency', strategy),
            createEdgeForStrategy('edge-5', 'users', 'database', 'dependency', strategy),
            createEdgeForStrategy('edge-6', 'auth', 'users', 'communication', strategy)
        ]
    };

    return baseModel;
}

/**
 * Create a node adapted for the specific layout strategy
 */
function createNodeForStrategy(
    id: string,
    title: string,
    description: string,
    icon: string,
    nodeType: string,
    strategy: 'client' | 'server' | 'hybrid',
    position: { x: number, y: number }
): SNode {
    const nodeId = `${strategy}-${id}`;

    switch (strategy) {
        case 'client':
            // Create rich content structure for client layout demonstration
            const clientChildren: Array<SLabel | SCompartment> = [
                // Header section with icon and title
                {
                    id: `${nodeId}-header`,
                    type: 'compartment:layout',
                    layout: 'hbox',
                    layoutOptions: {
                        paddingTop: 4,
                        paddingBottom: 4,
                        hGap: 8,
                        hAlign: 'left'
                    },
                    children: [
                        {
                            id: `${nodeId}-icon`,
                            type: 'label:text',
                            text: icon
                        } as SLabel,
                        {
                            id: `${nodeId}-title`,
                            type: 'label:text',
                            text: title
                        } as SLabel
                    ]
                } as SCompartment,

                // Description section
                {
                    id: `${nodeId}-desc`,
                    type: 'label:text',
                    text: description
                } as SLabel,

                // Properties section with multiple key-value pairs
                {
                    id: `${nodeId}-properties`,
                    type: 'compartment:layout',
                    layout: 'vbox',
                    layoutOptions: {
                        paddingTop: 4,
                        vGap: 2,
                        hAlign: 'left'
                    },
                    children: [
                        {
                            id: `${nodeId}-status`,
                            type: 'label:text',
                            text: getStatusForNode(nodeType)
                        } as SLabel,
                        {
                            id: `${nodeId}-version`,
                            type: 'label:text',
                            text: getVersionForNode(nodeType)
                        } as SLabel,
                        {
                            id: `${nodeId}-env`,
                            type: 'label:text',
                            text: 'Environment: Production'
                        } as SLabel
                    ]
                } as SCompartment,

                // Metrics section
                {
                    id: `${nodeId}-metrics`,
                    type: 'compartment:layout',
                    layout: 'hbox',
                    layoutOptions: {
                        paddingTop: 4,
                        hGap: 12,
                        hAlign: 'left'
                    },
                    children: [
                        {
                            id: `${nodeId}-cpu`,
                            type: 'label:text',
                            text: getCpuForNode(nodeType)
                        } as SLabel,
                        {
                            id: `${nodeId}-memory`,
                            type: 'label:text',
                            text: getMemoryForNode(nodeType)
                        } as SLabel
                    ]
                } as SCompartment
            ];

            return {
                id: nodeId,
                type: 'node:client',
                position,
                size: { width: 220, height: 160 },
                layout: 'vbox',
                layoutOptions: {
                    paddingTop: 8,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingBottom: 8,
                    vGap: 6
                },
                children: clientChildren
            } as SNode;

        case 'server':
            return {
                id: nodeId,
                type: 'node',
                size: { width: 120, height: 80 },
                nodeType,
                label: title,
                category: description
            } as SNode;

        case 'hybrid':
            // Calculate width based on content
            const titleWidth = (title.length * 8) + 40; // Approximate text width + icon space
            const descWidth = (description.length * 7) + 20; // Approximate text width + padding
            const contentWidth = Math.max(titleWidth, descWidth, 120);

            // Debug logging
            console.log(`Hybrid node ${nodeId}:`, {
                title,
                description,
                titleWidth,
                descWidth,
                contentWidth
            });

            return {
                id: nodeId,
                type: 'node:hybrid',
                size: { width: contentWidth, height: 100 },
                // Store original width in custom property that ELK won't touch
                originalWidth: contentWidth,
                title,
                description,
                icon,
                nodeType,
                children: [
                    {
                        type: 'compartment:layout',
                        id: `${nodeId}-content`,
                        position: { x: 0, y: 0 },
                        layout: 'vbox',
                        layoutOptions: {
                            paddingTop: 8,
                            paddingLeft: 10,
                            paddingRight: 10,
                            paddingBottom: 8,
                            vGap: 4
                        },
                        children: [
                            {
                                type: 'label:layout',
                                id: `${nodeId}-desc`,
                                position: { x: 0, y: 0 },
                                text: description
                            } as SLabel
                        ]
                    } as SCompartment
                ]
            } as SNode;

        default:
            throw new Error(`Unknown strategy: ${strategy}`);
    }
}

/**
 * Create an edge for the specific layout strategy
 */
function createEdgeForStrategy(
    id: string,
    sourceId: string,
    targetId: string,
    edgeType: string,
    strategy: 'client' | 'server' | 'hybrid'
): SEdge {
    return {
        id: `${strategy}-${id}`,
        type: 'edge',
        sourceId: `${strategy}-${sourceId}`,
        targetId: `${strategy}-${targetId}`,
        edgeType
    } as SEdge;
}




/**
 * Set up UI controls for switching layout strategies
 */
function setupControls(): void {
    const clientButton = document.getElementById('client-layout-btn');
    const serverButton = document.getElementById('server-layout-btn');
    const hybridButton = document.getElementById('hybrid-layout-btn');

    if (clientButton) {
        clientButton.addEventListener('click', () => switchLayoutStrategy('client'));
    }

    if (serverButton) {
        serverButton.addEventListener('click', () => switchLayoutStrategy('server'));
    }

    if (hybridButton) {
        hybridButton.addEventListener('click', () => switchLayoutStrategy('hybrid'));
    }

    // Update active button state
    updateActiveButton();
}

/**
 * Update active button state in UI
 */
function updateActiveButton(): void {
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeButton = document.getElementById(`${currentStrategy}-layout-btn`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

/**
 * Get appropriate node positions for each layout strategy
 */
function getPositionsForStrategy(strategy: 'client' | 'server' | 'hybrid') {
    switch (strategy) {
        case 'client':
            // Larger spacing for bigger client layout nodes (220×160)
            return {
                frontend: { x: 50, y: 50 },
                gateway: { x: 320, y: 50 },
                auth: { x: 50, y: 250 },
                users: { x: 320, y: 250 },
                database: { x: 185, y: 450 }
            };

        case 'server':
            // Compact spacing for smaller server nodes (120×80) - ELK will optimize anyway
            return {
                frontend: { x: 50, y: 50 },
                gateway: { x: 300, y: 50 },
                auth: { x: 150, y: 200 },
                users: { x: 450, y: 200 },
                database: { x: 300, y: 350 }
            };

        case 'hybrid':
            // Medium spacing for hybrid nodes (variable width, 100 height)
            return {
                frontend: { x: 50, y: 50 },
                gateway: { x: 300, y: 50 },
                auth: { x: 120, y: 200 },
                users: { x: 400, y: 200 },
                database: { x: 260, y: 350 }
            };
    }
}

/**
 * Helper functions to generate realistic content for client layout demonstration
 */
function getStatusForNode(nodeType: string): string {
    const statuses = {
        frontend: 'Status: ✅ Online',
        gateway: 'Status: ⚡ Active',
        service: 'Status: 🟢 Running',
        database: 'Status: 💾 Connected'
    };
    return statuses[nodeType as keyof typeof statuses] || 'Status: ✅ Online';
}

function getVersionForNode(nodeType: string): string {
    const versions = {
        frontend: 'Version: v2.1.4',
        gateway: 'Version: v1.8.2',
        service: 'Version: v3.0.1',
        database: 'Version: v14.5'
    };
    return versions[nodeType as keyof typeof versions] || 'Version: v1.0.0';
}

function getCpuForNode(nodeType: string): string {
    const cpuUsage = {
        frontend: 'CPU: 15%',
        gateway: 'CPU: 32%',
        service: 'CPU: 8%',
        database: 'CPU: 45%'
    };
    return cpuUsage[nodeType as keyof typeof cpuUsage] || 'CPU: 12%';
}

function getMemoryForNode(nodeType: string): string {
    const memUsage = {
        frontend: 'RAM: 256MB',
        gateway: 'RAM: 512MB',
        service: 'RAM: 128MB',
        database: 'RAM: 2.1GB'
    };
    return memUsage[nodeType as keyof typeof memUsage] || 'RAM: 64MB';
}

