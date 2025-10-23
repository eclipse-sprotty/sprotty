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

import { Action } from 'sprotty-protocol';
import { AnimationState } from './model';

/**
 * Action to trigger a specific animation on an element
 */
export interface TriggerAnimationAction extends Action {
    kind: typeof TriggerAnimationAction.KIND;
    elementId: string;
    animationType: 'bounce' | 'pulse' | 'shake' | 'spin' | 'glow';
}

export namespace TriggerAnimationAction {
    export const KIND = 'triggerAnimation';

    export function create(
        elementId: string,
        animationType: TriggerAnimationAction['animationType']
    ): TriggerAnimationAction {
        return { kind: KIND, elementId, animationType };
    }
}

/**
 * Action to change an element's state with animation
 */
export interface ChangeStateAction extends Action {
    kind: typeof ChangeStateAction.KIND;
    elementId: string;
    newState: AnimationState;
}

export namespace ChangeStateAction {
    export const KIND = 'changeState';

    export function create(elementId: string, newState: AnimationState): ChangeStateAction {
        return { kind: KIND, elementId, newState };
    }
}

/**
 * Action to start edge flow animation
 */
export interface AnimateFlowAction extends Action {
    kind: typeof AnimateFlowAction.KIND;
    edgeId: string;
}

export namespace AnimateFlowAction {
    export const KIND = 'animateFlow';

    export function create(edgeId: string): AnimateFlowAction {
        return { kind: KIND, edgeId };
    }
}

/**
 * Action to trigger multiple animations in sequence
 */
export interface CompositeAnimationAction extends Action {
    kind: typeof CompositeAnimationAction.KIND;
    elementId: string;
}

export namespace CompositeAnimationAction {
    export const KIND = 'compositeAnimation';

    export function create(elementId: string): CompositeAnimationAction {
        return { kind: KIND, elementId };
    }
}

