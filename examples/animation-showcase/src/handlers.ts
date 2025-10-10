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

import { injectable } from 'inversify';
import {
    Command, CommandExecutionContext, CommandReturn,
    IActionHandler, ICommand
} from 'sprotty';
import {
    TriggerAnimationAction, TransitionStateAction, StartEdgeFlowAction,
    StartTypewriterAction, ConfigureAnimationAction, StartComplexAnimationAction,
    StopAnimationsAction
} from './actions';
import {
    BounceAnimation, PulseAnimation, ShakeAnimation, SpinAnimation, GlowAnimation,
    StateTransitionAnimation, EdgeFlowAnimation, TypewriterAnimation,
    ComplexTransitionAnimation, MonitoredAnimation
} from './animations';
import { isAnimatable, isAnimatableEdge, isAnimatableLabel } from './model';

/**
 * Animation settings manager - stored globally
 */
export class AnimationSettings {
    private static instance: AnimationSettings;

    enabled: boolean = true;
    defaultDuration: number = 600;
    performanceMode: boolean = false;
    reducedMotion: boolean = false;

    // Performance tracking
    activeAnimations: number = 0;
    totalAnimations: number = 0;
    averageFps: number = 60;

    static getInstance(): AnimationSettings {
        if (!AnimationSettings.instance) {
            AnimationSettings.instance = new AnimationSettings();
        }
        return AnimationSettings.instance;
    }

    update(settings: Partial<AnimationSettings>): void {
        Object.assign(this, settings);
    }

    shouldAnimate(): boolean {
        return this.enabled && !this.reducedMotion;
    }

    getDuration(requestedDuration?: number): number {
        const duration = requestedDuration || this.defaultDuration;
        return this.performanceMode ? duration * 0.5 : duration;
    }
}

/**
 * Command to trigger animations on elements
 */
@injectable()
export class TriggerAnimationCommand extends Command {
    static readonly KIND = TriggerAnimationAction.KIND;

    constructor(protected action: TriggerAnimationAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const settings = AnimationSettings.getInstance();

        if (!settings.shouldAnimate()) {
            return context.root;
        }

        const element = context.root.index.getById(this.action.elementId);
        if (!element || !isAnimatable(element)) {
            return context.root;
        }

        // Start the animation on the element
        element.startAnimation(this.action.animationType);

        const duration = settings.getDuration(this.action.duration);
        const animationContext = { ...context, duration };

        let animation;
        switch (this.action.animationType) {
            case 'bounce':
                animation = new BounceAnimation(context.root, this.action.elementId, animationContext);
                break;
            case 'pulse':
                animation = new PulseAnimation(context.root, this.action.elementId, animationContext);
                break;
            case 'shake':
                animation = new ShakeAnimation(context.root, this.action.elementId, animationContext);
                break;
            case 'spin':
                animation = new SpinAnimation(context.root, this.action.elementId, animationContext);
                break;
            case 'glow':
                animation = new GlowAnimation(context.root, this.action.elementId, animationContext);
                break;
            default:
                return context.root;
        }

        // Wrap with performance monitoring if enabled
        if (settings.performanceMode) {
            animation = new MonitoredAnimation(animation, animationContext);
        }

        settings.activeAnimations++;
        settings.totalAnimations++;

        return animation.start().then(model => {
            settings.activeAnimations--;
            return model;
        });
    }

    undo(context: CommandExecutionContext): CommandReturn {
        // Stop the animation and restore original state
        const element = context.root.index.getById(this.action.elementId);
        if (element && isAnimatable(element)) {
            element.completeAnimation();
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to transition element states
 */
@injectable()
export class TransitionStateCommand extends Command {
    static readonly KIND = TransitionStateAction.KIND;

    constructor(protected action: TransitionStateAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const settings = AnimationSettings.getInstance();

        const element = context.root.index.getById(this.action.elementId);
        if (!element || !isAnimatable(element)) {
            return context.root;
        }

        const fromState = element.animationState;
        element.transitionToState(this.action.newState);

        if (!settings.shouldAnimate()) {
            element.animationState = this.action.newState;
            element.stateProgress = 1;
            return context.root;
        }

        const duration = settings.getDuration(this.action.duration);
        const animationContext = { ...context, duration };

        const animation = new StateTransitionAnimation(
            context.root,
            this.action.elementId,
            fromState,
            this.action.newState,
            animationContext
        );

        settings.activeAnimations++;
        return animation.start().then(model => {
            settings.activeAnimations--;
            return model;
        });
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.elementId);
        if (element && isAnimatable(element) && element.previousState) {
            element.transitionToState(element.previousState);
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to start edge flow animations
 */
@injectable()
export class StartEdgeFlowCommand extends Command {
    static readonly KIND = StartEdgeFlowAction.KIND;

    constructor(protected action: StartEdgeFlowAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const settings = AnimationSettings.getInstance();

        if (!settings.shouldAnimate()) {
            return context.root;
        }

        const element = context.root.index.getById(this.action.edgeId);
        if (!element || !isAnimatableEdge(element)) {
            return context.root;
        }

        element.startFlow(this.action.speed, this.action.direction);

        const duration = settings.getDuration(this.action.duration || 2000);
        const animationContext = { ...context, duration };

        const animation = new EdgeFlowAnimation(context.root, this.action.edgeId, animationContext);

        settings.activeAnimations++;
        return animation.start().then(model => {
            settings.activeAnimations--;
            return model;
        });
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.edgeId);
        if (element && isAnimatableEdge(element)) {
            element.stopAnimations();
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to start typewriter animations
 */
@injectable()
export class StartTypewriterCommand extends Command {
    static readonly KIND = StartTypewriterAction.KIND;

    constructor(protected action: StartTypewriterAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const settings = AnimationSettings.getInstance();

        const element = context.root.index.getById(this.action.labelId);
        if (!element || !isAnimatableLabel(element)) {
            return context.root;
        }

        element.startTypewriter(this.action.text);

        if (!settings.shouldAnimate()) {
            element.completeTypewriter();
            return context.root;
        }

        const duration = settings.getDuration(this.action.duration || 1000);
        const animationContext = { ...context, duration };

        const animation = new TypewriterAnimation(
            context.root,
            this.action.labelId,
            this.action.text,
            animationContext
        );

        settings.activeAnimations++;
        return animation.start().then(model => {
            settings.activeAnimations--;
            return model;
        });
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.labelId);
        if (element && isAnimatableLabel(element)) {
            element.text = element.originalText;
            element.typewriterProgress = 0;
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to configure animation settings
 */
@injectable()
export class ConfigureAnimationCommand extends Command {
    static readonly KIND = ConfigureAnimationAction.KIND;

    constructor(protected action: ConfigureAnimationAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const settings = AnimationSettings.getInstance();
        settings.update(this.action.settings);

        // Check for reduced motion preference
        if (typeof window !== 'undefined' && window.matchMedia) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                settings.reducedMotion = true;
            }
        }

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        // Animation settings changes are not undoable
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to start complex compound animations
 */
@injectable()
export class StartComplexAnimationCommand extends Command {
    static readonly KIND = StartComplexAnimationAction.KIND;

    constructor(protected action: StartComplexAnimationAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const settings = AnimationSettings.getInstance();

        if (!settings.shouldAnimate()) {
            return context.root;
        }

        const element = context.root.index.getById(this.action.elementId);
        if (!element || !isAnimatable(element)) {
            return context.root;
        }

        const duration = settings.getDuration();
        const animationContext = { ...context, duration };

        const animation = new ComplexTransitionAnimation(
            context.root,
            this.action.elementId,
            animationContext
        );

        settings.activeAnimations++;
        return animation.start().then(model => {
            settings.activeAnimations--;
            return model;
        });
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.elementId);
        if (element && isAnimatable(element)) {
            element.completeAnimation();
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to stop animations
 */
@injectable()
export class StopAnimationsCommand extends Command {
    static readonly KIND = StopAnimationsAction.KIND;

    constructor(protected action: StopAnimationsAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        if (this.action.elementId) {
            // Stop animations on specific element
            const element = context.root.index.getById(this.action.elementId);
            if (element) {
                if (isAnimatable(element)) {
                    element.completeAnimation();
                }
                if (isAnimatableEdge(element)) {
                    element.stopAnimations();
                }
            }
        } else {
            // Stop all animations
            context.root.index.all().forEach(element => {
                if (isAnimatable(element)) {
                    element.completeAnimation();
                }
                if (isAnimatableEdge(element)) {
                    element.stopAnimations();
                }
            });
        }

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        // Cannot undo stopping animations
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Action handler for animation-related actions
 */
@injectable()
export class AnimationActionHandler implements IActionHandler {
    handle(action: any): ICommand | void {
        switch (action.kind) {
            case TriggerAnimationAction.KIND:
                return new TriggerAnimationCommand(action);
            case TransitionStateAction.KIND:
                return new TransitionStateCommand(action);
            case StartEdgeFlowAction.KIND:
                return new StartEdgeFlowCommand(action);
            case StartTypewriterAction.KIND:
                return new StartTypewriterCommand(action);
            case ConfigureAnimationAction.KIND:
                return new ConfigureAnimationCommand(action);
            case StartComplexAnimationAction.KIND:
                return new StartComplexAnimationCommand(action);
            case StopAnimationsAction.KIND:
                return new StopAnimationsCommand(action);
        }
    }
}
