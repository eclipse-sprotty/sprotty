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

import { Animation, CompoundAnimation, CommandExecutionContext, SModelRootImpl, SNodeImpl, SEdgeImpl } from 'sprotty';
import { AnimationState } from './model';
import { STATE_COLORS } from './constants';

/**
 * Custom easing functions for natural motion
 */
export namespace Easing {
    export function easeOutBounce(t: number): number {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            t -= 1.5 / 2.75;
            return 7.5625 * t * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            t -= 2.25 / 2.75;
            return 7.5625 * t * t + 0.9375;
        } else {
            t -= 2.625 / 2.75;
            return 7.5625 * t * t + 0.984375;
        }
    }

    export function easeOutElastic(t: number): number {
        const p = 0.3;
        const s = p / 4;
        return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    }

    export function easeInOutBack(t: number): number {
        const s = 1.70158 * 1.525;
        t *= 2;
        if (t < 1) {
            return 0.5 * (t * t * ((s + 1) * t - s));
        }
        t -= 2;
        return 0.5 * (t * t * ((s + 1) * t + s) + 2);
    }

    export function easeOutCirc(t: number): number {
        return Math.sqrt(1 - (--t * t));
    }
}

/**
 * Bounce animation that makes elements jump up and down
 */
export class BounceAnimation extends Animation {
    protected elementId: string;
    private originalPosition: { x: number; y: number } | null = null;

    constructor(protected model: SModelRootImpl, elementId: string, context: CommandExecutionContext) {
        super(context);
        this.elementId = elementId;
        context.duration = 600;

        const element = this.model.index.getById(elementId);
        if (element && element instanceof SNodeImpl) {
            this.originalPosition = { ...element.position };
        }
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (!(element instanceof SNodeImpl) || !this.originalPosition) {
            return this.model;
        }

        const bounceHeight = 50;
        const progress = Easing.easeOutBounce(t);
        const offset = bounceHeight * (1 - progress);

        // Directly mutate element position
        element.position = {
            x: this.originalPosition.x,
            y: this.originalPosition.y - offset
        };

        return this.model;
    }
}

/**
 * Pulse animation that scales elements in and out
 */
export class PulseAnimation extends Animation {
    protected elementId: string;
    private originalSize: { width: number; height: number } | null = null;

    constructor(protected model: SModelRootImpl, elementId: string, context: CommandExecutionContext) {
        super(context);
        this.elementId = elementId;
        context.duration = 800;

        const element = this.model.index.getById(elementId);
        if (element && element instanceof SNodeImpl) {
            this.originalSize = { ...element.size };
        }
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (!(element instanceof SNodeImpl) || !this.originalSize) {
            return this.model;
        }

        // Pulse: grow then shrink using scale property
        const scale = 1 + 0.3 * Math.sin(t * Math.PI);

        // Directly mutate element scale property
        (element as any).scale = scale;

        return this.model;
    }
}

/**
 * Shake animation that vibrates elements horizontally
 */
export class ShakeAnimation extends Animation {
    protected elementId: string;
    private originalPosition: { x: number; y: number } | null = null;

    constructor(protected model: SModelRootImpl, elementId: string, context: CommandExecutionContext) {
        super(context);
        this.elementId = elementId;
        context.duration = 500;

        const element = this.model.index.getById(elementId);
        if (element && element instanceof SNodeImpl) {
            this.originalPosition = { ...element.position };
        }
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (!(element instanceof SNodeImpl) || !this.originalPosition) {
            return this.model;
        }

        // Shake with decreasing amplitude
        const amplitude = 10 * (1 - t);
        const frequency = 20;
        const offset = amplitude * Math.sin(t * frequency);

        // Directly mutate element position
        element.position = {
            x: this.originalPosition.x + offset,
            y: this.originalPosition.y
        };

        return this.model;
    }
}

/**
 * Spin animation that rotates elements
 */
export class SpinAnimation extends Animation {
    protected elementId: string;

    constructor(protected model: SModelRootImpl, elementId: string, context: CommandExecutionContext) {
        super(context);
        this.elementId = elementId;
        context.duration = 1000;
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (!element) {
            return this.model;
        }

        // Full 360 degree rotation
        const rotation = t * 360;

        // Directly mutate element rotation property
        (element as any).rotation = rotation;

        return this.model;
    }
}

/**
 * Glow animation that creates a pulsing glow effect
 */
export class GlowAnimation extends Animation {
    protected elementId: string;

    constructor(protected model: SModelRootImpl, elementId: string, context: CommandExecutionContext) {
        super(context);
        this.elementId = elementId;
        context.duration = 1500;
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (!element) {
            return this.model;
        }

        // Pulsing glow intensity
        const glowIntensity = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);

        // Directly mutate element animationClass property
        const animationClass = glowIntensity > 0.7 ? 'glow-high' : glowIntensity > 0.4 ? 'glow-medium' : 'glow-low';
        (element as any).animationClass = animationClass;

        return this.model;
    }
}

/**
 * State transition animation that smoothly changes element states
 */
export class StateTransitionAnimation extends Animation {
    protected elementId: string;
    protected fromState: AnimationState;
    protected toState: AnimationState;

    constructor(
        protected model: SModelRootImpl,
        elementId: string,
        fromState: AnimationState,
        toState: AnimationState,
        context: CommandExecutionContext
    ) {
        super(context);
        this.elementId = elementId;
        this.fromState = fromState;
        this.toState = toState;
        context.duration = 400;
    }

    tween(t: number): SModelRootImpl {
        const element = this.model.index.getById(this.elementId);
        if (!element) {
            return this.model;
        }

        const easedT = Easing.easeInOutBack(t);

        // Interpolate color between states
        const color = this.interpolateColor(
            STATE_COLORS[this.fromState],
            STATE_COLORS[this.toState],
            easedT
        );

        // Add subtle scale pulse during transition
        const scale = 1 + 0.1 * Math.sin(easedT * Math.PI);

        // Directly mutate element properties
        (element as any).color = color;
        (element as any).scale = scale;
        (element as any).state = this.toState;

        // Update label text for state cycle node
        const label = (element as any).children?.find((c: any) => c.id === 'label-state-cycle');
        if (label && label.type === 'label:animated') {
            label.text = `State: ${this.toState}`;
        }

        return this.model;
    }

    private interpolateColor(from: string, to: string, t: number): string {
        const fromRgb = this.hexToRgb(from);
        const toRgb = this.hexToRgb(to);

        const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
        const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
        const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);

        return this.rgbToHex(r, g, b);
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    private rgbToHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
}

/**
 * Edge flow animation that shows data flowing along edges
 */
export class EdgeFlowAnimation extends Animation {
    protected edgeId: string;

    constructor(protected model: SModelRootImpl, edgeId: string, context: CommandExecutionContext) {
        super(context);
        this.edgeId = edgeId;
        context.duration = 4000; // Longer duration
    }

    tween(t: number): SModelRootImpl {
        const edge = this.model.index.getById(this.edgeId);
        if (!(edge instanceof SEdgeImpl)) {
            return this.model;
        }

        if (t < 1) {
            // During animation: faster movement with larger multiplier
            const strokeDashOffset = 80 * (1 - t);

            // Directly mutate edge properties
            (edge as any).strokeDashOffset = strokeDashOffset;
            (edge as any).animated = true;
        } else {
            // At the end: return to solid line
            (edge as any).strokeDashOffset = 0;
            (edge as any).animated = false;
        }

        return this.model;
    }
}

/**
 * Compound animation that combines multiple effects
 */
export class ComplexTransitionAnimation extends CompoundAnimation {
    constructor(model: SModelRootImpl, elementId: string, context: CommandExecutionContext) {
        super(model, context, [
            new PulseAnimation(model, elementId, context),
            new SpinAnimation(model, elementId, context),
            new BounceAnimation(model, elementId, context)
        ]);
    }
}
