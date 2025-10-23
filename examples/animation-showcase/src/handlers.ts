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

import { injectable, inject } from 'inversify';
import { Command, CommandExecutionContext, CommandReturn, TYPES, SNodeImpl } from 'sprotty';
import {
    TriggerAnimationAction,
    ChangeStateAction,
    AnimateFlowAction,
    CompositeAnimationAction
} from './actions';
import {
    BounceAnimation,
    PulseAnimation,
    ShakeAnimation,
    SpinAnimation,
    GlowAnimation,
    StateTransitionAnimation,
    EdgeFlowAnimation,
    ComplexTransitionAnimation
} from './animations';
import { AnimationState } from './model';

/**
 * Command handler for triggering animations
 */
@injectable()
export class TriggerAnimationCommand extends Command {
    static KIND = TriggerAnimationAction.KIND;

    constructor(@inject(TYPES.Action) private action: TriggerAnimationAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const { elementId, animationType } = this.action;

        let animation;
        switch (animationType) {
            case 'bounce':
                animation = new BounceAnimation(context.root, elementId, context);
                break;
            case 'pulse':
                animation = new PulseAnimation(context.root, elementId, context);
                break;
            case 'shake':
                animation = new ShakeAnimation(context.root, elementId, context);
                break;
            case 'spin':
                animation = new SpinAnimation(context.root, elementId, context);
                break;
            case 'glow':
                animation = new GlowAnimation(context.root, elementId, context);
                break;
            default:
                return context.root;
        }

        return animation.start();
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command handler for state transitions
 */
@injectable()
export class ChangeStateCommand extends Command {
    static KIND = ChangeStateAction.KIND;

    constructor(@inject(TYPES.Action) private action: ChangeStateAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const { elementId, newState } = this.action;

        const element = context.root.index.getById(elementId);
        if (!element || !(element instanceof SNodeImpl)) {
            return context.root;
        }

        // Get current state from element
        const currentState: AnimationState = (element as any).state || 'idle';

        // Create state transition animation
        const animation = new StateTransitionAnimation(
            context.root,
            elementId,
            currentState,
            newState,
            context
        );

        return animation.start();
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command handler for edge flow animations
 */
@injectable()
export class AnimateFlowCommand extends Command {
    static KIND = AnimateFlowAction.KIND;

    constructor(@inject(TYPES.Action) private action: AnimateFlowAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const { edgeId } = this.action;

        const animation = new EdgeFlowAnimation(context.root, edgeId, context);
        return animation.start();
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command handler for composite animations
 */
@injectable()
export class CompositeAnimationCommand extends Command {
    static KIND = CompositeAnimationAction.KIND;

    constructor(@inject(TYPES.Action) private action: CompositeAnimationAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const { elementId } = this.action;

        const animation = new ComplexTransitionAnimation(context.root, elementId, context);
        return animation.start();
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

