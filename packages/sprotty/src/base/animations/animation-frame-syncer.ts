/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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

import { injectable } from "inversify";

@injectable()
export class AnimationFrameSyncer {

    tasks: ((x?: number) => void) [] = [];
    endTasks: ((x?: number) => void) [] = [];
    triggered: boolean = false;

    isAvailable(): boolean {
        return typeof requestAnimationFrame === "function";
    }

    onNextFrame(task: (x?: number) => void) {
        this.tasks.push(task);
        this.trigger();
    }

    onEndOfNextFrame(task: (x?: number) => void) {
        this.endTasks.push(task);
        this.trigger();
    }

    protected trigger() {
        if (!this.triggered) {
            this.triggered = true;
            if (this.isAvailable())
                requestAnimationFrame((time: number) => this.run(time));
            else
                setTimeout((time: number) => this.run(time));
        }
    }

    protected run(time: number) {
        const tasks = this.tasks;
        const endTasks = this.endTasks;
        this.triggered = false;
        this.tasks = [];
        this.endTasks = [];
        tasks.forEach(task => task.call(undefined, time));
        endTasks.forEach(task => task.call(undefined, time));
    }
}
