/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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

import { describe, expect, it } from 'vitest';
import { CommandExecutionContext } from '../commands/command.js';
import { SModelRootImpl } from '../model/smodel.js';
import { NullLogger } from '../../utils/logging.js';
import { Animation } from './animation.js';
import { AnimationFrameSyncer } from './animation-frame-syncer.js';

/** Runs animation frames only when the test calls `frame` with an explicit timestamp. */
class ManualFrameSyncer extends AnimationFrameSyncer {
    override isAvailable(): boolean {
        return true;
    }

    protected override trigger(): void {
    }

    frame(time: number): void {
        this.run(time);
    }
}

class RecordingAnimation extends Animation {
    readonly values: number[] = [];

    constructor(protected model: SModelRootImpl, context: CommandExecutionContext) {
        super(context);
    }

    tween(t: number): SModelRootImpl {
        this.values.push(t);
        return this.model;
    }
}

describe('Animation', () => {
    function createContext(syncer: AnimationFrameSyncer): CommandExecutionContext {
        return {
            root: new SModelRootImpl(),
            modelFactory: undefined!,
            duration: 250,
            modelChanged: { update: () => {} },
            logger: new NullLogger(),
            syncer
        };
    }

    it('ends once tween was passed 1, even if the duration has not fully elapsed', async () => {
        const syncer = new ManualFrameSyncer();
        const animation = new RecordingAnimation(new SModelRootImpl(), createContext(syncer));
        const result = animation.start();

        // The second frame is just short of the 250 ms duration, so t < 1, but easeInOut(t) rounds to exactly 1.
        for (const time of [0, 249.999999, 250]) {
            syncer.frame(time);
        }
        await result;

        expect(animation.values).toEqual([0, 1]);
    });
});
