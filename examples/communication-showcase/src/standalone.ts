/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { TYPES, LocalModelSource, IActionDispatcher, InitializeCanvasBoundsAction } from 'sprotty';
import { FitToScreenAction } from 'sprotty-protocol';
import createContainer from './di.config';
import {
    CreateNodeAction,
    DeleteNodeAction,
    UpdateNodeAction,
    ConnectNodesAction,
    ShowDebugNotificationAction
} from './actions';
import { DebugActionInterceptor } from './debug-interceptor';

/**
 * Communication Patterns Showcase
 * This demonstrates Sprotty's action-based communication patterns through a practical debugging tool
 */

let modelSource: LocalModelSource;
let actionDispatcher: IActionDispatcher;
let debugInterceptor: DebugActionInterceptor;

export default function runCommunicationShowcase(): void {
    const container = createContainer('sprotty-app');
    modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    actionDispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    debugInterceptor = actionDispatcher as DebugActionInterceptor;

    console.log('🔍 Container created, modelSource:', modelSource);
    console.log('🔍 ActionDispatcher:', actionDispatcher);
    console.log('🔍 ActionDispatcher type:', actionDispatcher.constructor.name);

    // Create the initial debug model
    const model = createDebugModel();
    modelSource.setModel(model);

    // Setup debugging UI controls
    setupDebugControls();

    // Fit to screen and show welcome
    actionDispatcher.dispatch(FitToScreenAction.create([], { padding: 20, maxZoom: 1.2 }));

    // WORKAROUND: Manually dispatch InitializeCanvasBoundsAction to unblock actions
    setTimeout(() => {
        console.log('🔍 Manually dispatching InitializeCanvasBoundsAction to unblock actions...');
        actionDispatcher.dispatch(InitializeCanvasBoundsAction.create({ x: 0, y: 0, width: 800, height: 600 }));
    }, 200);

    // Welcome message demonstrating the debugging tool
    setTimeout(() => {
        actionDispatcher.dispatch({
            kind: 'showDebugNotification',
            message: 'Debug Tool Loaded! All actions are now being monitored and logged.',
            type: 'success',
            duration: 4000
        } as ShowDebugNotificationAction);
    }, 500);
}

/**
 * Setup debugging UI controls that demonstrate various Sprotty action patterns
 */
function setupDebugControls(): void {

    // Node creation controls
    const createClientBtn = document.getElementById('create-client');
    if (createClientBtn) {
        createClientBtn.addEventListener('click', () => {
            const position = getRandomPosition();
            const action = CreateNodeAction.create({
                nodeType: 'client',
                position: position,
                label: `Client ${Date.now() % 1000}`
            });
            console.log('🔍 Dispatching CreateNodeAction:', action);
            console.log('🔍 ActionDispatcher before dispatch:', actionDispatcher);
            console.log('🔍 ActionDispatcher registry:', (actionDispatcher as any).actionHandlerRegistry);
            console.log('🔍 ActionDispatcher postponedActions:', (actionDispatcher as any).postponedActions);
            console.log('🔍 ActionDispatcher blockUntil:', (actionDispatcher as any).blockUntil);

            // Try to dispatch after a small delay to ensure initialization is complete
            setTimeout(() => {
                console.log('🔍 Dispatching after timeout...');
                actionDispatcher.dispatch(action);
            }, 100);
        });
    }

    const createServerBtn = document.getElementById('create-server');
    if (createServerBtn) {
        createServerBtn.addEventListener('click', () => {
            const position = getRandomPosition();
            const action = CreateNodeAction.create({
                nodeType: 'server',
                position: position,
                label: `Server ${Date.now() % 1000}`
            });
            console.log('🔍 Dispatching CreateNodeAction:', action);
            actionDispatcher.dispatch(action);
        });
    }

    const createDatabaseBtn = document.getElementById('create-database');
    if (createDatabaseBtn) {
        createDatabaseBtn.addEventListener('click', () => {
            const position = getRandomPosition();
            const action = CreateNodeAction.create({
                nodeType: 'database',
                position: position,
                label: `DB ${Date.now() % 1000}`
            });
            console.log('🔍 Dispatching CreateNodeAction:', action);
            actionDispatcher.dispatch(action);
        });
    }

    // Node manipulation controls
    const updateNodeBtn = document.getElementById('update-random-node');
    if (updateNodeBtn) {
        updateNodeBtn.addEventListener('click', () => {
            const nodes = document.querySelectorAll('.debug-node');
            if (nodes.length > 0) {
                const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
                const domElementId = randomNode.closest('.sprotty-node')?.id;
                if (domElementId) {
                    // Extract the actual node ID by removing the sprotty-app_ prefix
                    const nodeId = domElementId.replace('sprotty-app_', '');
                    console.log('🔍 DOM element ID:', domElementId, '-> Model node ID:', nodeId);

                    const statuses = ['online', 'offline', 'error', 'processing'];
                    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

                    const action = UpdateNodeAction.create(nodeId, {
                        status: randomStatus as any,
                        label: `Updated ${Date.now() % 1000}`
                    });
                    console.log('🔍 Dispatching UpdateNodeAction:', action);
                    actionDispatcher.dispatch(action);
                }
            }
        });
    }

    const deleteRandomBtn = document.getElementById('delete-random-node');
    if (deleteRandomBtn) {
        deleteRandomBtn.addEventListener('click', () => {
            const nodes = document.querySelectorAll('.debug-node');
            if (nodes.length > 0) {
                const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
                const domElementId = randomNode.closest('.sprotty-node')?.id;
                if (domElementId) {
                    // Extract the actual node ID by removing the sprotty-app_ prefix
                    const nodeId = domElementId.replace('sprotty-app_', '');
                    console.log('🔍 DOM element ID:', domElementId, '-> Model node ID:', nodeId);

                    const action = DeleteNodeAction.create(nodeId);
                    console.log('🔍 Dispatching DeleteNodeAction:', action);
                    actionDispatcher.dispatch(action);
                }
            }
        });
    }

    // Connection controls
    const connectRandomBtn = document.getElementById('connect-random-nodes');
    if (connectRandomBtn) {
        connectRandomBtn.addEventListener('click', () => {
            const nodes = Array.from(document.querySelectorAll('.debug-node'));
            if (nodes.length >= 2) {
                const shuffled = nodes.sort(() => 0.5 - Math.random());
                const sourceDomId = shuffled[0].closest('.sprotty-node')?.id;
                const targetDomId = shuffled[1].closest('.sprotty-node')?.id;

                if (sourceDomId && targetDomId) {
                    // Extract the actual node IDs by removing the sprotty-app_ prefix
                    const sourceId = sourceDomId.replace('sprotty-app_', '');
                    const targetId = targetDomId.replace('sprotty-app_', '');
                    console.log('🔍 DOM IDs:', sourceDomId, targetDomId, '-> Model IDs:', sourceId, targetId);

                    const edgeTypes = ['communication', 'dependency'];
                    const randomType = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];

                    const action = ConnectNodesAction.create(sourceId, targetId, randomType as any);
                    console.log('🔍 Dispatching ConnectNodesAction:', action);
                    actionDispatcher.dispatch(action);
                }
            }
        });
    }

    // Debug log controls
    const clearLogBtn = document.getElementById('clear-debug-log');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            console.log('🔍 Clearing debug log directly...');
            if (debugInterceptor && typeof debugInterceptor.clearLog === 'function') {
                debugInterceptor.clearLog();
            } else {
                console.warn('🚨 Debug interceptor not available or clearLog method not found');
            }
        });
    }



    // Demonstration sequence
    const runDemoBtn = document.getElementById('run-demo-sequence');
    if (runDemoBtn) {
        runDemoBtn.addEventListener('click', runDemoSequence);
    }
}


/**
 * Run a comprehensive demonstration sequence showing various action patterns
 * This creates a realistic microservices architecture scenario
 */
function runDemoSequence(): void {
    console.log('🎭 Starting comprehensive demo sequence...');

    // Clear existing diagram first
    if (debugInterceptor && typeof debugInterceptor.clearLog === 'function') {
        debugInterceptor.clearLog();
    }

    actionDispatcher.dispatch({
        kind: 'showDebugNotification',
        message: '🎭 Demo: Building a Microservices Architecture - Watch the Action Log!',
        type: 'info',
        duration: 4000
    } as ShowDebugNotificationAction);


    // Comprehensive sequence demonstrating real-world patterns
    const sequence = [
        // Phase 1: Infrastructure Setup
        () => {
            console.log('🏗️ Phase 1: Setting up infrastructure...');
            actionDispatcher.dispatch(CreateNodeAction.create({
                nodeType: 'database',
                position: { x: 400, y: 300 },
                label: 'PostgreSQL DB'
            }));
        },

        () => {
            actionDispatcher.dispatch(CreateNodeAction.create({
                nodeType: 'server',
                position: { x: 200, y: 200 },
                label: 'API Gateway'
            }));
        },

        // Phase 2: Core Services
        () => {
            console.log('🔧 Phase 2: Deploying core services...');
            actionDispatcher.dispatch(CreateNodeAction.create({
                nodeType: 'server',
                position: { x: 100, y: 100 },
                label: 'Auth Service'
            }));
        },

        () => {
            actionDispatcher.dispatch(CreateNodeAction.create({
                nodeType: 'server',
                position: { x: 300, y: 100 },
                label: 'User Service'
            }));
        },

        () => {
            actionDispatcher.dispatch(CreateNodeAction.create({
                nodeType: 'server',
                position: { x: 500, y: 100 },
                label: 'Order Service'
            }));
        },

        // Phase 3: Client Applications
        () => {
            console.log('📱 Phase 3: Adding client applications...');
            actionDispatcher.dispatch(CreateNodeAction.create({
                nodeType: 'client',
                position: { x: 50, y: 50 },
                label: 'Web App'
            }));
        },

        () => {
            actionDispatcher.dispatch(CreateNodeAction.create({
                nodeType: 'client',
                position: { x: 350, y: 50 },
                label: 'Mobile App'
            }));
        },

        // Phase 4: Connect Infrastructure (Database connections)
        () => {
            console.log('🔗 Phase 4: Connecting to database...');
            setTimeout(() => {
                const nodes = Array.from(document.querySelectorAll('.sprotty-node'));
                const authNode = nodes.find(n => n.textContent?.includes('Auth Service'));
                const userNode = nodes.find(n => n.textContent?.includes('User Service'));
                const orderNode = nodes.find(n => n.textContent?.includes('Order Service'));
                const dbNode = nodes.find(n => n.textContent?.includes('PostgreSQL'));

                const authId = authNode?.id?.replace('sprotty-app_', '');
                const userId = userNode?.id?.replace('sprotty-app_', '');
                const orderId = orderNode?.id?.replace('sprotty-app_', '');
                const dbId = dbNode?.id?.replace('sprotty-app_', '');

                if (authId && dbId) {
                    actionDispatcher.dispatch(ConnectNodesAction.create(authId, dbId, 'dependency'));
                }

                if (userId && dbId) {
                    setTimeout(() => {
                        actionDispatcher.dispatch(ConnectNodesAction.create(userId, dbId, 'dependency'));
                    }, 300);
                }

                if (orderId && dbId) {
                    setTimeout(() => {
                        actionDispatcher.dispatch(ConnectNodesAction.create(orderId, dbId, 'dependency'));
                    }, 600);
                }
            }, 200);
        },

        // Phase 5: Connect Services through Gateway
        () => {
            console.log('🌐 Phase 5: Routing through API Gateway...');
            setTimeout(() => {
                const nodes = Array.from(document.querySelectorAll('.sprotty-node'));
                const gatewayNode = nodes.find(n => n.textContent?.includes('API Gateway'));
                const authNode = nodes.find(n => n.textContent?.includes('Auth Service'));
                const userNode = nodes.find(n => n.textContent?.includes('User Service'));
                const orderNode = nodes.find(n => n.textContent?.includes('Order Service'));

                const gatewayId = gatewayNode?.id?.replace('sprotty-app_', '');
                const authId = authNode?.id?.replace('sprotty-app_', '');
                const userId = userNode?.id?.replace('sprotty-app_', '');
                const orderId = orderNode?.id?.replace('sprotty-app_', '');

                if (gatewayId && authId) {
                    actionDispatcher.dispatch(ConnectNodesAction.create(gatewayId, authId, 'communication'));
                }

                if (gatewayId && userId) {
                    setTimeout(() => {
                        actionDispatcher.dispatch(ConnectNodesAction.create(gatewayId, userId, 'communication'));
                    }, 300);
                }

                if (gatewayId && orderId) {
                    setTimeout(() => {
                        actionDispatcher.dispatch(ConnectNodesAction.create(gatewayId, orderId, 'communication'));
                    }, 600);
                }
            }, 200);
        },

        // Phase 6: Connect Clients to Gateway
        () => {
            console.log('📲 Phase 6: Connecting client applications...');
            setTimeout(() => {
                const nodes = Array.from(document.querySelectorAll('.sprotty-node'));
                const gatewayNode = nodes.find(n => n.textContent?.includes('API Gateway'));
                const webNode = nodes.find(n => n.textContent?.includes('Web App'));
                const mobileNode = nodes.find(n => n.textContent?.includes('Mobile App'));

                const gatewayId = gatewayNode?.id?.replace('sprotty-app_', '');
                const webId = webNode?.id?.replace('sprotty-app_', '');
                const mobileId = mobileNode?.id?.replace('sprotty-app_', '');

                if (webId && gatewayId) {
                    actionDispatcher.dispatch(ConnectNodesAction.create(webId, gatewayId, 'communication'));
                }

                if (mobileId && gatewayId) {
                    setTimeout(() => {
                        actionDispatcher.dispatch(ConnectNodesAction.create(mobileId, gatewayId, 'communication'));
                    }, 300);
                }
            }, 200);
        },

        // Phase 7: Service-to-Service Communication
        () => {
            console.log('🔄 Phase 7: Adding service-to-service communication...');
            setTimeout(() => {
                const nodes = Array.from(document.querySelectorAll('.sprotty-node'));
                const userNode = nodes.find(n => n.textContent?.includes('User Service'));
                const orderNode = nodes.find(n => n.textContent?.includes('Order Service'));

                const userId = userNode?.id?.replace('sprotty-app_', '');
                const orderId = orderNode?.id?.replace('sprotty-app_', '');

                if (userId && orderId) {
                    actionDispatcher.dispatch(ConnectNodesAction.create(orderId, userId, 'communication'));
                }
            }, 200);
        },

        // Phase 8: Simulate System Activity
        () => {
            console.log('⚡ Phase 8: Simulating system activity...');
            setTimeout(() => {
                const nodes = Array.from(document.querySelectorAll('.sprotty-node'));
                const authNode = nodes.find(n => n.textContent?.includes('Auth Service'));
                const authId = authNode?.id?.replace('sprotty-app_', '');

                if (authId) {
                    actionDispatcher.dispatch(UpdateNodeAction.create(authId, { status: 'processing' }));
                }
            }, 200);
        },

        () => {
            setTimeout(() => {
                const nodes = Array.from(document.querySelectorAll('.sprotty-node'));
                const userNode = nodes.find(n => n.textContent?.includes('User Service'));
                const userId = userNode?.id?.replace('sprotty-app_', '');

                if (userId) {
                    actionDispatcher.dispatch(UpdateNodeAction.create(userId, { status: 'online' }));
                }
            }, 400);
        },

        () => {
            setTimeout(() => {
                const nodes = Array.from(document.querySelectorAll('.sprotty-node'));
                const dbNode = nodes.find(n => n.textContent?.includes('PostgreSQL'));
                const dbId = dbNode?.id?.replace('sprotty-app_', '');

                if (dbId) {
                    actionDispatcher.dispatch(UpdateNodeAction.create(dbId, { status: 'error' }));
                }
            }, 600);
        },

        // Phase 9: Final Notification
        () => {
            console.log('✅ Demo sequence completed!');
            actionDispatcher.dispatch({
                kind: 'showDebugNotification',
                message: '✅ Microservices Architecture Complete! Check the action log to see all ' +
                    'the communication patterns and actions that were executed.',
                type: 'success',
                duration: 6000
            } as ShowDebugNotificationAction);
        }
    ];

    // Execute sequence with progressive delays (faster at the beginning, slower for connections)
    const delays = [0, 800, 1400, 1800, 2200, 2800, 3200, 4000, 5500, 7000, 8000, 8500, 9000, 9500, 10500];

    sequence.forEach((action, index) => {
        setTimeout(action, delays[index] || (index * 1000));
    });
}

/**
 * Generate random position for new nodes
 */
function getRandomPosition(): { x: number, y: number } {
    return {
        x: 50 + Math.random() * 400,
        y: 50 + Math.random() * 200
    };
}

/**
 * Create initial debug model with a few sample nodes
 */
function createDebugModel() {
    return {
        type: 'graph',
        id: 'debug-tool-demo',
        children: [
            // Debug nodes
            {
                type: 'node:debug',
                id: 'debug-client-1',
                position: { x: 100, y: 100 },
                size: { width: 150, height: 100 },
                nodeType: 'client',
                label: 'Web Client',
                status: 'online',
                createdAt: Date.now() - 10000
            },
            {
                type: 'node:debug',
                id: 'debug-server-1',
                position: { x: 350, y: 100 },
                size: { width: 150, height: 100 },
                nodeType: 'server',
                label: 'API Server',
                status: 'online',
                createdAt: Date.now() - 8000
            },
            // Debug edges
            {
                type: 'edge:debug',
                id: 'debug-edge-1',
                sourceId: 'debug-client-1',
                targetId: 'debug-server-1',
                edgeType: 'communication',
                createdAt: Date.now() - 5000,
                children: [{
                    type: 'label',
                    id: 'debug-edge-1-label',
                    text: 'API Calls'
                }]
            }
        ],
        // Required Sprotty graph properties to prevent scroll.x error
        scroll: { x: 0, y: 0 },
        zoom: 1,
        canvasBounds: { x: 0, y: 0, width: 800, height: 600 }
    };
}