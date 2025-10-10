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

import { Action } from 'sprotty-protocol';
import { AnimationType, AnimationState } from './model';

/**
 * Action to trigger an animation on a specific element
 */
export interface TriggerAnimationAction extends Action {
    kind: typeof TriggerAnimationAction.KIND;
    elementId: string;
    animationType: AnimationType;
    duration?: number;
}

export namespace TriggerAnimationAction {
    export const KIND = 'triggerAnimation';

    export function create(elementId: string, animationType: AnimationType, duration?: number): TriggerAnimationAction {
        return {
            kind: KIND,
            elementId,
            animationType,
            duration
        };
    }
}

/**
 * Action to transition an element to a new state
 */
export interface TransitionStateAction extends Action {
    kind: typeof TransitionStateAction.KIND;
    elementId: string;
    newState: AnimationState;
    duration?: number;
}

export namespace TransitionStateAction {
    export const KIND = 'transitionState';

    export function create(elementId: string, newState: AnimationState, duration?: number): TransitionStateAction {
        return {
            kind: KIND,
            elementId,
            newState,
            duration
        };
    }
}

/**
 * Action to start edge flow animation
 */
export interface StartEdgeFlowAction extends Action {
    kind: typeof StartEdgeFlowAction.KIND;
    edgeId: string;
    speed?: number;
    direction?: 'forward' | 'backward' | 'bidirectional';
    duration?: number;
}

export namespace StartEdgeFlowAction {
    export const KIND = 'startEdgeFlow';

    export function create(edgeId: string, speed?: number, direction?: 'forward' | 'backward' | 'bidirectional', duration?: number): StartEdgeFlowAction {
        return {
            kind: KIND,
            edgeId,
            speed,
            direction,
            duration
        };
    }
}

/**
 * Action to start typewriter animation on a label
 */
export interface StartTypewriterAction extends Action {
    kind: typeof StartTypewriterAction.KIND;
    labelId: string;
    text: string;
    duration?: number;
}

export namespace StartTypewriterAction {
    export const KIND = 'startTypewriter';

    export function create(labelId: string, text: string, duration?: number): StartTypewriterAction {
        return {
            kind: KIND,
            labelId,
            text,
            duration
        };
    }
}

/**
 * Action to configure animation settings
 */
export interface ConfigureAnimationAction extends Action {
    kind: typeof ConfigureAnimationAction.KIND;
    settings: {
        enabled?: boolean;
        defaultDuration?: number;
        performanceMode?: boolean;
        reducedMotion?: boolean;
    };
}

export namespace ConfigureAnimationAction {
    export const KIND = 'configureAnimation';

    export function create(settings: ConfigureAnimationAction['settings']): ConfigureAnimationAction {
        return {
            kind: KIND,
            settings
        };
    }
}

/**
 * Action to start a complex compound animation
 */
export interface StartComplexAnimationAction extends Action {
    kind: typeof StartComplexAnimationAction.KIND;
    elementId: string;
    animationSequence: {
        type: AnimationType;
        delay?: number;
        duration?: number;
    }[];
}

export namespace StartComplexAnimationAction {
    export const KIND = 'startComplexAnimation';

    export function create(elementId: string, animationSequence: StartComplexAnimationAction['animationSequence']): StartComplexAnimationAction {
        return {
            kind: KIND,
            elementId,
            animationSequence
        };
    }
}

/**
 * Action to stop all animations on an element
 */
export interface StopAnimationsAction extends Action {
    kind: typeof StopAnimationsAction.KIND;
    elementId?: string; // If undefined, stops all animations
}

export namespace StopAnimationsAction {
    export const KIND = 'stopAnimations';

    export function create(elementId?: string): StopAnimationsAction {
        return {
            kind: KIND,
            elementId
        };
    }
}

/**
 * Action to request animation performance metrics
 */
export interface RequestAnimationMetricsAction extends Action {
    kind: typeof RequestAnimationMetricsAction.KIND;
}

export namespace RequestAnimationMetricsAction {
    export const KIND = 'requestAnimationMetrics';

    export function create(): RequestAnimationMetricsAction {
        return {
            kind: KIND
        };
    }
}
