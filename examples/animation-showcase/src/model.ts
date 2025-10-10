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
    SModelElementImpl, SNodeImpl, SEdgeImpl, SLabelImpl,
    boundsFeature, selectFeature, moveFeature, hoverFeedbackFeature,
    fadeFeature
} from 'sprotty';
import { Bounds, Point } from 'sprotty-protocol';

/**
 * Animation states for nodes
 */
export type AnimationState = 'idle' | 'processing' | 'complete' | 'error';

/**
 * Animation types that can be triggered
 */
export type AnimationType = 'bounce' | 'pulse' | 'shake' | 'glow' | 'spin';

/**
 * Node that supports various animations and state transitions
 */
export class AnimatableNode extends SNodeImpl {
    // Animation state
    animationState: AnimationState = 'idle';

    // Current animation progress (0-1)
    animationProgress: number = 0;

    // Animation type currently playing
    currentAnimation?: AnimationType;

    // Animation properties
    originalBounds?: Bounds;
    originalPosition?: Point;

    // Visual properties that can be animated
    scale: number = 1;
    rotation: number = 0;
    override opacity: number = 1;
    glowIntensity: number = 0;

    // State transition properties
    stateProgress: number = 0; // Progress of state transition (0-1)
    previousState?: AnimationState;

    // Performance tracking
    animationStartTime?: number;
    frameCount: number = 0;

    override get outgoingEdges() {
        return super.outgoingEdges;
    }

    override hasFeature(feature: symbol): boolean {
        return AnimatableNode.DEFAULT_FEATURES.indexOf(feature) >= 0;
    }

    static override readonly DEFAULT_FEATURES = [boundsFeature, selectFeature, moveFeature, hoverFeedbackFeature, fadeFeature];

    /**
     * Start a new animation
     */
    startAnimation(type: AnimationType): void {
        this.currentAnimation = type;
        this.animationProgress = 0;
        this.animationStartTime = Date.now();
        this.frameCount = 0;

        // Store original values for restoration
        if (!this.originalBounds) {
            this.originalBounds = { ...this.bounds };
        }
        if (!this.originalPosition) {
            this.originalPosition = { ...this.position };
        }
    }

    /**
     * Update animation progress
     */
    updateAnimation(progress: number): void {
        this.animationProgress = progress;
        this.frameCount++;
    }

    /**
     * Complete current animation
     */
    completeAnimation(): void {
        this.currentAnimation = undefined;
        this.animationProgress = 0;
        this.frameCount = 0;

        // Reset to original values
        if (this.originalBounds) {
            this.bounds = { ...this.originalBounds };
        }
        if (this.originalPosition) {
            this.position = { ...this.originalPosition };
        }

        // Reset animation properties
        this.scale = 1;
        this.rotation = 0;
        this.glowIntensity = 0;
    }

    /**
     * Transition to a new state
     */
    transitionToState(newState: AnimationState): void {
        if (newState !== this.animationState) {
            this.previousState = this.animationState;
            // Don't immediately change animationState - let the animation do it
            // this.animationState = newState;
            this.stateProgress = 0;
        }
    }

    /**
     * Update state transition progress
     */
    updateStateTransition(progress: number): void {
        this.stateProgress = Math.min(1, Math.max(0, progress));
    }

    /**
     * Get current performance metrics
     */
    getPerformanceMetrics(): { fps: number; duration: number } {
        const duration = this.animationStartTime ? Date.now() - this.animationStartTime : 0;
        const fps = duration > 0 ? (this.frameCount * 1000) / duration : 0;
        return { fps, duration };
    }
}

/**
 * Edge that supports animation effects
 */
export class AnimatableEdge extends SEdgeImpl {
    // Animation properties
    animationProgress: number = 0;
    flowSpeed: number = 1;
    flowDirection: 'forward' | 'backward' | 'bidirectional' = 'forward';

    // Visual effects
    pulseIntensity: number = 0;
    thickness: number = 2;

    static override readonly DEFAULT_FEATURES = [fadeFeature];

    /**
     * Start flow animation
     */
    startFlow(speed: number = 1, direction: 'forward' | 'backward' | 'bidirectional' = 'forward'): void {
        this.flowSpeed = speed;
        this.flowDirection = direction;
        this.animationProgress = 0;
    }

    /**
     * Update flow animation
     */
    updateFlow(progress: number): void {
        this.animationProgress = progress;
    }

    /**
     * Start pulse effect
     */
    startPulse(intensity: number = 1): void {
        this.pulseIntensity = intensity;
    }

    /**
     * Stop all animations
     */
    stopAnimations(): void {
        this.animationProgress = 0;
        this.pulseIntensity = 0;
        this.flowSpeed = 1;
    }
}

/**
 * Label that supports text animation effects
 */
export class AnimatableLabel extends SLabelImpl {
    // Text animation properties
    typewriterProgress: number = 0;
    originalText: string = '';

    // Visual effects
    textGlow: number = 0;
    textScale: number = 1;

    static override readonly DEFAULT_FEATURES = [fadeFeature];

    /**
     * Start typewriter effect
     */
    startTypewriter(text: string): void {
        this.originalText = text;
        this.typewriterProgress = 0;
        this.text = '';
    }

    /**
     * Update typewriter progress
     */
    updateTypewriter(progress: number): void {
        this.typewriterProgress = progress;
        const targetLength = Math.floor(this.originalText.length * progress);
        this.text = this.originalText.substring(0, targetLength);
    }

    /**
     * Complete typewriter effect
     */
    completeTypewriter(): void {
        this.text = this.originalText;
        this.typewriterProgress = 1;
    }
}

/**
 * Type guards for animation features
 */
export function isAnimatable(element: SModelElementImpl): element is AnimatableNode {
    return element instanceof AnimatableNode;
}

export function isAnimatableEdge(element: SModelElementImpl): element is AnimatableEdge {
    return element instanceof AnimatableEdge;
}

export function isAnimatableLabel(element: SModelElementImpl): element is AnimatableLabel {
    return element instanceof AnimatableLabel;
}
