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

import { inject, injectable } from 'inversify';
import { Action, ComputedBoundsAction, RequestBoundsAction, SetBoundsAction } from 'sprotty-protocol/lib/actions';
import { Bounds, Dimension, Point } from 'sprotty-protocol/lib/utils/geometry';
import { CommandExecutionContext, CommandResult, CommandReturn, HiddenCommand, SystemCommand } from '../../base/commands/command';
import { SModelElementImpl } from '../../base/model/smodel';
import { TYPES } from '../../base/types';
import { Alignable, BoundsAware, isBoundsAware } from './model';

export interface ResolvedElementAndBounds {
    element: SModelElementImpl & BoundsAware
    oldBounds: Bounds
    newPosition?: Point
    newSize: Dimension
}

export interface ResolvedElementAndAlignment {
    element: SModelElementImpl & Alignable
    oldAlignment: Point
    newAlignment: Point
}

@injectable()
export class SetBoundsCommand extends SystemCommand {
    static readonly KIND: string = SetBoundsAction.KIND;

    protected bounds: ResolvedElementAndBounds[] = [];

    constructor(@inject(TYPES.Action) protected readonly action: SetBoundsAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.action.bounds.forEach(
            b => {
                const element = context.root.index.getById(b.elementId);
                if (element && isBoundsAware(element)) {
                    this.bounds.push({
                        element: element,
                        oldBounds: element.bounds,
                        newPosition: b.newPosition,
                        newSize: b.newSize
                    });
                }
            }
        );
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): CommandReturn {
        this.bounds.forEach(
            b => b.element.bounds = b.oldBounds
        );
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        this.bounds.forEach(
            b => {
                if (b.newPosition)
                    b.element.bounds = {
                        ...b.newPosition,
                        ...b.newSize,
                    };
                else
                    // keep the position
                    b.element.bounds = {
                        x: b.element.bounds.x,
                        y: b.element.bounds.y,
                        ...b.newSize
                    };
            }
        );
        return context.root;
    }
}

@injectable()
export class RequestBoundsCommand extends HiddenCommand {
    static readonly KIND: string = RequestBoundsAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RequestBoundsAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        return {
            model: context.modelFactory.createRoot(this.action.newRoot),
            modelChanged: true,
            cause: this.action
        };
    }

    get blockUntil(): (action: Action) => boolean {
        return action => action.kind === ComputedBoundsAction.KIND;
    }
}
