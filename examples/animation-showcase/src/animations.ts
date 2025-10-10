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
    Animation, CompoundAnimation, CommandExecutionContext, SModelRootImpl,
    isBoundsAware
} from 'sprotty';
import { AnimatableNode, isAnimatable, isAnimatableEdge, isAnimatableLabel, AnimationState } from './model';

/**
 * Custom easing functions for natural motion
 */
export namespace Easing {
    export function easeOutBounce(t: number): number {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }

    export function easeOutElastic(t: number): number {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 :
            Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    export function easeInOutBack(t: number): number {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }

    export function easeOutCirc(t: number): number {
        return Math.sqrt(1 - Math.pow(t - 1, 2));
    }
}

/**
 * Bounce animation that makes elements jump up and down
 */
export class BounceAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected elementId: string,
        context: CommandExecutionContext
    ) {
        super(context, Easing.easeOutBounce);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (element && isAnimatable(element)) {
            element.updateAnimation(t);

            // Bounce effect using sine wave with decay
            const bounceHeight = 30 * Math.sin(t * Math.PI * 3) * (1 - t);

            if (element.originalPosition) {
                element.position = {
                    x: element.originalPosition.x,
                    y: element.originalPosition.y - bounceHeight
                };
            }

            if (t === 1) {
                element.completeAnimation();
            }
        }
        return this.model;
    }
}

/**
 * Pulse animation that scales elements in and out
 */
export class PulseAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected elementId: string,
        context: CommandExecutionContext
    ) {
        super(context, Easing.easeInOutBack);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (element && isAnimatable(element) && isBoundsAware(element)) {
            element.updateAnimation(t);

            // Pulse effect using cosine wave
            const scale = 1 + 0.3 * Math.cos(t * Math.PI * 4) * (1 - t);
            element.scale = scale;

            if (element.originalBounds) {
                const centerX = element.originalBounds.x + element.originalBounds.width / 2;
                const centerY = element.originalBounds.y + element.originalBounds.height / 2;

                element.bounds = {
                    x: centerX - (element.originalBounds.width * scale) / 2,
                    y: centerY - (element.originalBounds.height * scale) / 2,
                    width: element.originalBounds.width * scale,
                    height: element.originalBounds.height * scale
                };
            }

            if (t === 1) {
                element.completeAnimation();
            }
        }
        return this.model;
    }
}

/**
 * Shake animation that vibrates elements horizontally
 */
export class ShakeAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected elementId: string,
        context: CommandExecutionContext
    ) {
        super(context);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (element && isAnimatable(element)) {
            element.updateAnimation(t);

            // Shake effect with larger amplitude and slower frequency
            const amplitude = 20 * (1 - t); // Increased from 8 to 20
            const frequency = 8; // Reduced from 20 to 8 for slower shaking
            const offset = amplitude * Math.sin(t * frequency * Math.PI);

            if (element.originalPosition) {
                element.position = {
                    x: element.originalPosition.x + offset,
                    y: element.originalPosition.y
                };
            }

            if (t === 1) {
                element.completeAnimation();
            }
        }
        return this.model;
    }
}

/**
 * Spin animation that rotates elements
 */
export class SpinAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected elementId: string,
        context: CommandExecutionContext
    ) {
        super(context, Easing.easeOutCirc);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (element && isAnimatable(element)) {
            element.updateAnimation(t);

            // Full rotation (360 degrees)
            element.rotation = t * 360;

            if (t === 1) {
                element.completeAnimation();
            }
        }
        return this.model;
    }
}

/**
 * Glow animation that creates a pulsing glow effect
 */
export class GlowAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected elementId: string,
        context: CommandExecutionContext
    ) {
        super(context);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (element && isAnimatable(element)) {
            element.updateAnimation(t);

            // Glow intensity using sine wave with higher intensity
            // Oscillates between 0.5 and 1.5 for more visible effect
            element.glowIntensity = Math.sin(t * Math.PI * 4) * 0.5 + 1.0;

            if (t === 1) {
                element.completeAnimation();
                element.glowIntensity = 0; // Reset glow when done
            }
        }
        return this.model;
    }
}

/**
 * State transition animation that smoothly changes element states
 */
export class StateTransitionAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected elementId: string,
        protected fromState: AnimationState,
        protected toState: AnimationState,
        context: CommandExecutionContext
    ) {
        super(context, Easing.easeInOutBack);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (element && isAnimatable(element)) {
            element.updateStateTransition(t);

            // Interpolate between state properties
            this.interpolateStateProperties(element, t);

            // Debug: log interpolation
            if (t === 0 || t === 0.5 || t === 1) {
                console.log(`t=${t.toFixed(2)}: ${this.fromState} -> ${this.toState}, color: ${(element as any).interpolatedColor}`);
            }

            if (t === 1) {
                element.animationState = this.toState;
                element.stateProgress = 1;
                // Clear interpolated color so the view uses the actual state color
                delete (element as any).interpolatedColor;
            }
        }
        return this.model;
    }

    private interpolateStateProperties(element: AnimatableNode, t: number): void {
        // Color transitions based on state - must match the hex colors in views.tsx
        const stateColors = {
            idle: { r: 176, g: 176, b: 176 },      // #b0b0b0 - Medium gray
            processing: { r: 255, g: 193, b: 7 },  // #ffc107 - Bright yellow/amber
            complete: { r: 76, g: 175, b: 80 },    // #4caf50 - Green
            error: { r: 244, g: 67, b: 54 }        // #f44336 - Red
        };

        const fromColor = stateColors[this.fromState];
        const toColor = stateColors[this.toState];

        if (fromColor && toColor) {
            const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * t);
            const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * t);
            const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * t);

            // Store interpolated color for use in views
            (element as any).interpolatedColor = `rgb(${r}, ${g}, ${b})`;
        }
    }
}

/**
 * Edge flow animation that shows data flowing along edges
 */
export class EdgeFlowAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected edgeId: string,
        context: CommandExecutionContext
    ) {
        super(context);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.edgeId);
        if (element && isAnimatableEdge(element)) {
            element.updateFlow(t);

            // Create flowing effect
            element.pulseIntensity = Math.sin(t * Math.PI * 6) * 0.5 + 0.5;

            if (t === 1) {
                element.stopAnimations();
                element.pulseIntensity = 0;
            }
        }
        return this.model;
    }
}

/**
 * Typewriter animation for labels
 */
export class TypewriterAnimation extends Animation {
    constructor(
        protected model: SModelRootImpl,
        protected labelId: string,
        protected targetText: string,
        context: CommandExecutionContext
    ) {
        super(context);
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.labelId);
        if (element && isAnimatableLabel(element)) {
            element.updateTypewriter(t);

            if (t === 1) {
                element.completeTypewriter();
            }
        }
        return this.model;
    }
}

/**
 * Compound animation that combines multiple effects
 */
export class ComplexTransitionAnimation extends CompoundAnimation {
    constructor(
        model: SModelRootImpl,
        elementId: string,
        context: CommandExecutionContext
    ) {
        const components = [
            new BounceAnimation(model, elementId, { ...context, duration: 800 }),
            new GlowAnimation(model, elementId, { ...context, duration: 1200 }),
            new StateTransitionAnimation(model, elementId, 'idle', 'complete', { ...context, duration: 1000 })
        ];

        super(model, context, components);
    }
}

/**
 * Performance monitoring animation wrapper
 */
export class MonitoredAnimation extends Animation {
    private startTime: number = 0;
    private frameCount: number = 0;

    constructor(
        protected wrappedAnimation: Animation,
        context: CommandExecutionContext
    ) {
        super(context);
    }

    override start(): Promise<SModelRootImpl> {
        this.startTime = performance.now();
        this.frameCount = 0;
        return super.start();
    }

    override tween(t: number, context: CommandExecutionContext): SModelRootImpl {
        this.frameCount++;

        // Log performance metrics periodically
        if (this.frameCount % 30 === 0) {
            const elapsed = performance.now() - this.startTime;
            const fps = (this.frameCount * 1000) / elapsed;
            console.log(`Animation FPS: ${fps.toFixed(1)}, Frames: ${this.frameCount}`);
        }

        return this.wrappedAnimation.tween(t, context);
    }
}
