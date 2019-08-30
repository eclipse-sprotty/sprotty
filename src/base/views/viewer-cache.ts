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

import { inject, injectable } from "inversify";
import { SModelRoot } from "../model/smodel";
import { TYPES } from "../types";
import { Action } from "../actions/action";
import { AnimationFrameSyncer } from "../animations/animation-frame-syncer";
import { IViewer } from "./viewer";

/**
 * Updating the view is rather expensive, and it doesn't make sense to calculate
 * more then one update per animation (rendering) frame. So this class batches
 * all incoming model changes and only renders the last one when the next animation
 * frame comes.
 */
@injectable()
export class ViewerCache implements IViewer {

    @inject(TYPES.IViewer) protected delegate: IViewer;
    @inject(TYPES.AnimationFrameSyncer) protected syncer: AnimationFrameSyncer;

    protected cachedModel?: SModelRoot;

    update(model: SModelRoot, cause?: Action): void {
        if (cause !== undefined) {
            // Forward the update immediately in order to pass the cause action
            this.delegate.update(model, cause);
            this.cachedModel = undefined;
        } else {
            const isCacheEmpty = this.cachedModel === undefined;
            this.cachedModel = model;
            if (isCacheEmpty) {
                this.scheduleUpdate();
            }
        }
    }

    protected scheduleUpdate() {
        this.syncer.onEndOfNextFrame(() => {
            if (this.cachedModel) {
                this.delegate.update(this.cachedModel);
                this.cachedModel = undefined;
            }
        });
    }
}
