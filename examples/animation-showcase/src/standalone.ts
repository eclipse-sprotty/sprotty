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
import { TriggerAnimationAction, ChangeStateAction, AnimateFlowAction, CompositeAnimationAction } from './actions';
import { AnimatedNode, AnimatedEdge, AnimationState } from './model';

export default async function runAnimationShowcase() {
    const container = createContainer();
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);

    // Create demo model
    const model: SGraph = {
        type: 'graph',
        id: 'animation-demo',
        children: [
            // Row 1: Basic animations
            {
                type: 'node:animated',
                id: 'node-bounce',
                position: { x: 50, y: 50 },
                size: { width: 120, height: 80 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-bounce',
                        text: 'Bounce',
                        position: { x: 35, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            {
                type: 'node:animated',
                id: 'node-pulse',
                position: { x: 200, y: 50 },
                size: { width: 120, height: 80 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-pulse',
                        text: 'Pulse',
                        position: { x: 40, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            {
                type: 'node:animated',
                id: 'node-shake',
                position: { x: 350, y: 50 },
                size: { width: 120, height: 80 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-shake',
                        text: 'Shake',
                        position: { x: 40, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            {
                type: 'node:animated',
                id: 'node-spin',
                position: { x: 500, y: 50 },
                size: { width: 120, height: 80 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-spin',
                        text: 'Spin',
                        position: { x: 45, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            {
                type: 'node:animated',
                id: 'node-glow',
                position: { x: 650, y: 50 },
                size: { width: 120, height: 80 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-glow',
                        text: 'Glow',
                        position: { x: 45, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            // Row 2: State cycle demonstration
            {
                type: 'node:animated',
                id: 'node-state-cycle',
                position: { x: 340, y: 180 },
                size: { width: 140, height: 80 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-state-cycle',
                        text: 'State: idle',
                        position: { x: 35, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            // Row 3: Composite animations
            {
                type: 'node:animated',
                id: 'node-composite',
                position: { x: 335, y: 310 },
                size: { width: 150, height: 100 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-composite',
                        text: 'Complex Animation',
                        position: { x: 15, y: 45 },
                        fontSize: 14
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            // Row 4: Network with animated edges
            {
                type: 'node:animated',
                id: 'node-source',
                position: { x: 150, y: 450 },
                size: { width: 100, height: 60 },
                state: 'active',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-source',
                        text: 'Source',
                        position: { x: 30, y: 30 },
                        fontSize: 12
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            {
                type: 'node:animated',
                id: 'node-target',
                position: { x: 550, y: 450 },
                size: { width: 100, height: 60 },
                state: 'idle',
                children: [
                    {
                        type: 'label:animated',
                        id: 'label-target',
                        text: 'Target',
                        position: { x: 30, y: 30 },
                        fontSize: 12
                    } as SLabel
                ]
            } as AnimatedNode & SNode,

            // Animated edge
            {
                type: 'edge:animated',
                id: 'edge-flow',
                sourceId: 'node-source',
                targetId: 'node-target',
                animated: false
            } as AnimatedEdge & SEdge
        ]
    };

    // Set initial model
    await modelSource.setModel(model);

    // Fit the diagram to screen with padding
    dispatcher.dispatch(FitToScreenAction.create([], { padding: 50 }));

    // Set up control panel interactions
    setupControlPanel(dispatcher);
}

function setupControlPanel(dispatcher: IActionDispatcher) {
    // Basic animation buttons
    const bounceBtn = document.getElementById('btn-bounce');
    if (bounceBtn) {
        bounceBtn.onclick = () => dispatcher.dispatch(TriggerAnimationAction.create('node-bounce', 'bounce'));
    }

    const pulseBtn = document.getElementById('btn-pulse');
    if (pulseBtn) {
        pulseBtn.onclick = () => dispatcher.dispatch(TriggerAnimationAction.create('node-pulse', 'pulse'));
    }

    const shakeBtn = document.getElementById('btn-shake');
    if (shakeBtn) {
        shakeBtn.onclick = () => dispatcher.dispatch(TriggerAnimationAction.create('node-shake', 'shake'));
    }

    const spinBtn = document.getElementById('btn-spin');
    if (spinBtn) {
        spinBtn.onclick = () => dispatcher.dispatch(TriggerAnimationAction.create('node-spin', 'spin'));
    }

    const glowBtn = document.getElementById('btn-glow');
    if (glowBtn) {
        glowBtn.onclick = () => dispatcher.dispatch(TriggerAnimationAction.create('node-glow', 'glow'));
    }

    // State cycle button
    const stateCycleBtn = document.getElementById('btn-cycle-state');
    if (stateCycleBtn) {
        const states: AnimationState[] = ['idle', 'active', 'loading', 'success', 'error'];
        let currentStateIndex = 0; // Start at 'idle'

        stateCycleBtn.onclick = () => {
            // Move to next state
            currentStateIndex = (currentStateIndex + 1) % states.length;
            const nextState = states[currentStateIndex];

            // Dispatch state change action
            dispatcher.dispatch(ChangeStateAction.create('node-state-cycle', nextState));
        };
    }

    // Composite animation button
    const compositeBtn = document.getElementById('btn-composite');
    if (compositeBtn) {
        compositeBtn.onclick = () => dispatcher.dispatch(CompositeAnimationAction.create('node-composite'));
    }

    // Edge flow animation button
    const flowBtn = document.getElementById('btn-flow');
    if (flowBtn) {
        flowBtn.onclick = () => dispatcher.dispatch(AnimateFlowAction.create('edge-flow'));
    }

    // Animate all button
    const animateAllBtn = document.getElementById('btn-animate-all');
    if (animateAllBtn) {
        animateAllBtn.onclick = () => {
            const animations = ['bounce', 'pulse', 'shake', 'spin', 'glow'] as const;
            const nodes = ['node-bounce', 'node-pulse', 'node-shake', 'node-spin', 'node-glow'];

            nodes.forEach((nodeId, index) => {
                setTimeout(() => {
                    dispatcher.dispatch(TriggerAnimationAction.create(nodeId, animations[index]));
                }, index * 200);
            });
        };
    }
}
