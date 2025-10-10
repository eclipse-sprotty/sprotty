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

import {
    LocalModelSource, TYPES, IActionDispatcher
} from 'sprotty';
import { FitToScreenAction } from 'sprotty-protocol';
import type { SGraph, SNode, SEdge, SLabel } from 'sprotty-protocol';
import createContainer from './di.config';
import {
    TriggerAnimationAction, TransitionStateAction, StartEdgeFlowAction,
    ConfigureAnimationAction, StartComplexAnimationAction,
    StopAnimationsAction
} from './actions';
import { AnimationSettings } from './handlers';
import './actions';
import { AnimationState } from './model';

export default async function runAnimationShowcase() {
    console.log('Starting Animation Showcase...');

    // Initialize the dependency injection container
    const container = createContainer();

    // Get the model source and action dispatcher
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    const animationSettings = AnimationSettings.getInstance();

    // Configure initial animation settings
    dispatcher.dispatch(ConfigureAnimationAction.create({
        enabled: true,
        defaultDuration: 600,
        performanceMode: false,
        reducedMotion: false
    }));

    // Create the sample model with animatable elements
    const sampleModel: SGraph = {
        type: 'graph',
        id: 'animation-showcase',
        children: [
            // Animatable nodes demonstrating different animation types
            {
                type: 'node:animatable',
                id: 'bounce-node',
                position: { x: 50, y: 50 },
                size: { width: 100, height: 60 },
                animationState: 'idle' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'bounce-label',
                        text: 'Bounce',
                        position: { x: 50, y: 30 }
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:animatable',
                id: 'pulse-node',
                position: { x: 200, y: 50 },
                size: { width: 100, height: 60 },
                animationState: 'processing' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'pulse-label',
                        text: 'Pulse',
                        position: { x: 50, y: 30 }
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:animatable',
                id: 'shake-node',
                position: { x: 350, y: 50 },
                size: { width: 100, height: 60 },
                animationState: 'complete' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'shake-label',
                        text: 'Shake',
                        position: { x: 50, y: 30 }
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:animatable',
                id: 'glow-node',
                position: { x: 500, y: 50 },
                size: { width: 100, height: 60 },
                animationState: 'error' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'glow-label',
                        text: 'Glow',
                        position: { x: 50, y: 30 }
                    } as SLabel
                ]
            } as SNode,

            // State transition demonstration nodes
            {
                type: 'node:animatable',
                id: 'state-node-1',
                position: { x: 50, y: 150 },
                size: { width: 120, height: 60 },
                animationState: 'idle' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'state-label-1',
                        text: 'State Demo 1',
                        position: { x: 60, y: 30 }
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:animatable',
                id: 'state-node-2',
                position: { x: 220, y: 150 },
                size: { width: 120, height: 60 },
                animationState: 'processing' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'state-label-2',
                        text: 'State Demo 2',
                        position: { x: 60, y: 30 }
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:animatable',
                id: 'state-node-3',
                position: { x: 390, y: 150 },
                size: { width: 120, height: 60 },
                animationState: 'complete' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'state-label-3',
                        text: 'State Demo 3',
                        position: { x: 60, y: 30 }
                    } as SLabel
                ]
            } as SNode,

            // Compound animation demonstration
            {
                type: 'node:animatable',
                id: 'complex-node',
                position: { x: 300, y: 250 },
                size: { width: 140, height: 80 },
                animationState: 'idle' as AnimationState,
                children: [
                    {
                        type: 'label:text',
                        id: 'complex-label',
                        text: 'Complex Animation',
                        position: { x: 70, y: 40 }
                    } as SLabel
                ]
            } as SNode,

            // Animatable edges with flow effects
            {
                type: 'edge:animatable',
                id: 'flow-edge-1',
                sourceId: 'bounce-node',
                targetId: 'pulse-node',
                thickness: 2,
                flowSpeed: 1,
                flowDirection: 'forward'
            } as SEdge,

            {
                type: 'edge:animatable',
                id: 'flow-edge-2',
                sourceId: 'pulse-node',
                targetId: 'shake-node',
                thickness: 3,
                flowSpeed: 1.5,
                flowDirection: 'forward'
            } as SEdge,

            {
                type: 'edge:animatable',
                id: 'flow-edge-3',
                sourceId: 'shake-node',
                targetId: 'glow-node',
                thickness: 2,
                flowSpeed: 0.8,
                flowDirection: 'bidirectional'
            } as SEdge,

            {
                type: 'edge:animatable',
                id: 'state-edge-1',
                sourceId: 'state-node-1',
                targetId: 'state-node-2',
                thickness: 2
            } as SEdge,

            {
                type: 'edge:animatable',
                id: 'state-edge-2',
                sourceId: 'state-node-2',
                targetId: 'state-node-3',
                thickness: 2
            } as SEdge,

            {
                type: 'edge:animatable',
                id: 'complex-edge-1',
                sourceId: 'state-node-2',
                targetId: 'complex-node',
                thickness: 3
            } as SEdge
        ]
    };

    // Initialize the model
    modelSource.setModel(sampleModel);

    // Fit the diagram to screen with padding
    setTimeout(() => {
        dispatcher.dispatch(FitToScreenAction.create([], { padding: 50 }));
    }, 100);

    // Set up interaction handlers
    setupInteractionHandlers(dispatcher, modelSource, animationSettings);

    // Start some initial animations to demonstrate the system
    setTimeout(() => {
        startDemoAnimations(dispatcher);
    }, 1000);

    // Set up performance monitoring
    setupPerformanceMonitoring(animationSettings);

    console.log('Animation Showcase loaded successfully!');
    console.log('Interactions:');
    console.log('- Click nodes: Each node has its own animation');
    console.log('- Ctrl+Click state nodes: Transition between states');
    console.log('- Shift+Click complex node: Compound animation');
    console.log('- Click edges: Start flow animation');
}

function setupInteractionHandlers(dispatcher: IActionDispatcher, modelSource: LocalModelSource, settings: AnimationSettings) {
    // Map node IDs to their specific animation types
    const nodeAnimations: { [key: string]: string } = {
        'bounce-node': 'bounce',
        'pulse-node': 'pulse',
        'shake-node': 'shake',
        'glow-node': 'glow',
        'complex-node': 'spin'
    };

    // Track current state of each state node locally
    const nodeStates: { [key: string]: AnimationState } = {
        'state-node-1': 'idle',
        'state-node-2': 'processing',
        'state-node-3': 'complete'
    };

    let lastClickedNode: string | null = null;

    // Wait for SVG to be rendered, then attach listeners
    setTimeout(() => {
        const svg = document.querySelector('#sprotty-animation svg');

        if (!svg) {
            console.error('SVG element not found');
            return;
        }

        // Use mousedown to capture the clicked node
        svg.addEventListener('mousedown', (event) => {
            const target = event.target as SVGElement;
            const nodeElement = target.closest('.sprotty-node');

            if (nodeElement) {
                const nodeId = getNodeId(nodeElement);
                lastClickedNode = nodeId;
            }
        }, true);

        // Use mouseup to trigger animations
        svg.addEventListener('mouseup', (event) => {
            const mouseEvent = event as MouseEvent;
            if (!lastClickedNode) return;

            const nodeId = lastClickedNode;
            lastClickedNode = null;

            // Check if it's a state node - they always transition states on click
            if (nodeId.startsWith('state-node')) {
                // State transition - cycle to the next state
                const states: AnimationState[] = ['idle', 'processing', 'complete', 'error'];

                // Get the current state from our local tracking
                const currentState = nodeStates[nodeId] || 'idle';

                // Find next state in the cycle
                const currentIndex = states.indexOf(currentState);
                const nextState = states[(currentIndex + 1) % states.length];

                // Update our local tracking
                nodeStates[nodeId] = nextState;

                // Dispatch with a duration for smooth transition (800ms)
                dispatcher.dispatch(TransitionStateAction.create(nodeId, nextState, 800));
            } else if (mouseEvent.shiftKey && nodeId === 'complex-node') {
                // Complex animation for complex node
                dispatcher.dispatch(StartComplexAnimationAction.create(nodeId, [
                    { type: 'bounce', duration: 800 },
                    { type: 'glow', delay: 200, duration: 1200 }
                ]));
            } else {
                // Trigger node-specific animation
                const animationType = nodeAnimations[nodeId];
                if (animationType) {
                    dispatcher.dispatch(TriggerAnimationAction.create(nodeId, animationType as any));
                }
            }
        }, true);

        // Edge click handler
        svg.addEventListener('mouseup', (event) => {
            const target = event.target as SVGElement;
            const edgeElement = target.closest('.sprotty-edge');
            const nodeElement = target.closest('.sprotty-node');

            if (edgeElement && !nodeElement) {
                const edgeId = getEdgeId(edgeElement);
                if (edgeId) {
                    dispatcher.dispatch(StartEdgeFlowAction.create(edgeId, 1, 'forward', 3000));
                }
            }
        }, true);
    }, 500); // Wait 500ms for SVG to be created
}

function startDemoAnimations(dispatcher: IActionDispatcher) {
    // No automatic animations - user will trigger them by clicking
    // This prevents the infinite render loop from edge flow animations
}

function setupPerformanceMonitoring(settings: AnimationSettings) {
    // Monitor performance metrics
    setInterval(() => {
        const metrics = {
            activeAnimations: settings.activeAnimations,
            totalAnimations: settings.totalAnimations,
            averageFps: settings.averageFps
        };

        // Update performance display
        updatePerformanceDisplay(metrics);

        // Log performance warnings
        if (settings.activeAnimations > 10) {
            console.warn('High number of active animations:', settings.activeAnimations);
        }

        if (settings.averageFps < 30) {
            console.warn('Low FPS detected:', settings.averageFps);
        }
    }, 1000);
}

function updatePerformanceDisplay(metrics: any) {
    const display = document.getElementById('performance-metrics');
    if (display) {
        display.innerHTML = `
            <div>Active Animations: ${metrics.activeAnimations}</div>
            <div>Total Animations: ${metrics.totalAnimations}</div>
            <div>Average FPS: ${metrics.averageFps.toFixed(1)}</div>
        `;
    }
}

function getNodeId(element: Element): string | null {
    // Extract node ID from DOM element - remove the base div prefix if present
    const id = element.id;
    if (id) {
        // Remove 'sprotty-animation_' prefix if present
        return id.replace(/^sprotty-animation_/, '');
    }
    return null;
}

function getEdgeId(element: Element): string | null {
    // Extract edge ID from DOM element
    const className = (element as SVGElement).className;
    const classStr = typeof className === 'string' ? className : (className as any).baseVal || '';
    const match = classStr.match(/sprotty-edge-(\S+)/);
    return match ? match[1] : element.id || null;
}

// Add keyboard shortcuts for animation controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        // Stop all animations
        const container = createContainer();
        const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
        dispatcher.dispatch(StopAnimationsAction.create());
    }
});

// Export for use in HTML
(window as any).runAnimationShowcase = runAnimationShowcase;
