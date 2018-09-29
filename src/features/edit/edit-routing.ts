/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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
import { Point } from "../../utils/geometry";
import { Routable, isRoutable, canEditRouting, SRoutingHandle } from './model';
import { Action } from "../../base/actions/action";
import { Command, CommandExecutionContext, CommandResult } from "../../base/commands/command";
import { SModelElement, SModelRoot, SParentElement, SModelIndex } from '../../base/model/smodel';
import { Animation } from '../../base/animations/animation';

export function createRoutingHandle(kind: 'junction' | 'line', parentId: string, index: number): SRoutingHandle {
    const handle = new SRoutingHandle();
    handle.type = kind === 'junction' ? 'routing-point' : 'volatile-routing-point';
    handle.kind = kind;
    handle.pointIndex = index;
    return handle;
}

export function createRoutingHandles(editTarget: SParentElement & Routable): void {
    const rpCount = editTarget.routingPoints.length;
    const targetId = editTarget.id;
    editTarget.add(createRoutingHandle('line', targetId, -1));
    for (let i = 0; i < rpCount; i++) {
        editTarget.add(createRoutingHandle('junction', targetId, i));
        editTarget.add(createRoutingHandle('line', targetId, i));
    }
}

export class SwitchEditModeAction implements Action {
    kind = SwitchEditModeCommand.KIND;

    constructor(public readonly elementsToActivate: string[] = [],
                public readonly elementsToDeactivate: string[] = []) {
    }
}

@injectable()
export class SwitchEditModeCommand extends Command {
    static KIND: string = "switchEditMode";

    protected elementsToActivate: SModelElement[] = [];
    protected elementsToDeactivate: SModelElement[] = [];
    protected handlesToRemove: { handle: SRoutingHandle, parent: SParentElement & Routable, point?: Point }[] = [];

    constructor(public action: SwitchEditModeAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const index = context.root.index;
        this.action.elementsToActivate.forEach(id => {
            const element = index.getById(id);
            if (element !== undefined )
                this.elementsToActivate.push(element);
        });
        this.action.elementsToDeactivate.forEach(id => {
            const element = index.getById(id);
            if (element !== undefined)
                this.elementsToDeactivate.push(element);
            if (element instanceof SRoutingHandle && isRoutable(element.parent)) {
                const parent = element.parent;
                if (this.shouldRemoveHandle(element, parent)) {
                    this.handlesToRemove.push({ handle: element, parent });
                    this.elementsToDeactivate.push(parent);
                    this.elementsToActivate.push(parent);
                }
            }
        });
        return this.doExecute(context);
    }

    protected doExecute(context: CommandExecutionContext): SModelRoot {
        this.handlesToRemove.forEach(entry => {
            entry.point = entry.parent.routingPoints.splice(entry.handle.pointIndex, 1)[0];
        });
        this.elementsToDeactivate.forEach(element => {
            if (isRoutable(element) && element instanceof SParentElement)
                element.removeAll(child => child instanceof SRoutingHandle);
            else if (element instanceof SRoutingHandle)
                element.editMode = false;
        });
        this.elementsToActivate.forEach(element => {
            if (canEditRouting(element) && element instanceof SParentElement)
                createRoutingHandles(element);
            else if (element instanceof SRoutingHandle)
                element.editMode = true;
        });
        return context.root;
    }

    protected shouldRemoveHandle(handle: SRoutingHandle, parent: Routable): boolean {
        if (handle.kind === 'junction') {
            const route = parent.route();
            return route.find(rp => rp.pointIndex === handle.pointIndex) === undefined;
        }
        return false;
    }

    undo(context: CommandExecutionContext): CommandResult {
        this.handlesToRemove.forEach(entry => {
            if (entry.point !== undefined)
                entry.parent.routingPoints.splice(entry.handle.pointIndex, 0, entry.point);
        });
        this.elementsToActivate.forEach(element => {
            if (isRoutable(element) && element instanceof SParentElement)
                element.removeAll(child => child instanceof SRoutingHandle);
            else if (element instanceof SRoutingHandle)
                element.editMode = false;
        });
        this.elementsToDeactivate.forEach(element => {
            if (canEditRouting(element) && element instanceof SParentElement)
                createRoutingHandles(element);
            else if (element instanceof SRoutingHandle)
                element.editMode = true;
        });
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        return this.doExecute(context);
    }
}

export interface HandleMove {
    elementId: string
    fromPosition?: Point
    toPosition: Point
}

export interface ResolvedHandleMove {
    elementId: string
    element: SRoutingHandle
    parent: SParentElement
    fromPosition?: Point
    toPosition: Point
}

export class MoveRoutingHandleAction implements Action {
    kind: string = MoveRoutingHandleCommand.KIND;

    constructor(public readonly moves: HandleMove[],
                public readonly animate: boolean = true) {
    }

}

@injectable()
export class MoveRoutingHandleCommand extends Command {
    static KIND: string = 'moveHandle';

    resolvedMoves: Map<string, ResolvedHandleMove> = new Map;
    originalRoutingPoints: Map<string, Point[]> = new Map;

    constructor(protected action: MoveRoutingHandleAction) {
        super();
    }

    execute(context: CommandExecutionContext) {
        const model = context.root;
        this.action.moves.forEach(
            move => {
                const resolvedMove = this.resolve(move, model.index);
                if (resolvedMove !== undefined) {
                    this.resolvedMoves.set(resolvedMove.elementId, resolvedMove);
                    const parent = resolvedMove.parent;
                    if (isRoutable(parent))
                        this.originalRoutingPoints.set(parent.id, parent.routingPoints.slice());
                }
            }
        );
        if (this.action.animate) {
            return new MoveHandlesAnimation(model, this.resolvedMoves, this.originalRoutingPoints, context).start();
        } else {
            return this.doMove(context);
        }
    }

    protected resolve(move: HandleMove, index: SModelIndex<SModelElement>): ResolvedHandleMove | undefined {
        const element = index.getById(move.elementId);
        if (element instanceof SRoutingHandle) {
            return {
                elementId: move.elementId,
                element: element,
                parent: element.parent,
                fromPosition: move.fromPosition,
                toPosition: move.toPosition
            };
        }
        return undefined;
    }

    protected doMove(context: CommandExecutionContext): SModelRoot {
        this.resolvedMoves.forEach(res => {
            const handle = res.element;
            const parent = res.parent;
            if (isRoutable(parent)) {
                const points = parent.routingPoints;
                let index = handle.pointIndex;
                if (handle.kind === 'line') {
                    // Upgrade to a proper routing point
                    handle.kind = 'junction';
                    handle.type = 'routing-point';
                    points.splice(index + 1, 0, res.fromPosition || points[Math.max(index, 0)]);
                    parent.children.forEach(child => {
                        if (child instanceof SRoutingHandle && (child === handle || child.pointIndex > index))
                            child.pointIndex++;
                    });
                    parent.add(createRoutingHandle('line', parent.id, index));
                    parent.add(createRoutingHandle('line', parent.id, index + 1));
                    index++;
                }
                if (index >= 0 && index < points.length) {
                    points[index] = res.toPosition;
                }
            }
        });
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandResult {
        if (this.action.animate) {
            return new MoveHandlesAnimation(context.root, this.resolvedMoves, this.originalRoutingPoints, context, true).start();
        } else {
            this.resolvedMoves.forEach(res => {
                const parent = res.parent;
                const points = this.originalRoutingPoints.get(parent.id);
                if (points !== undefined && isRoutable(parent)) {
                    parent.routingPoints = points;
                    parent.removeAll(e => e instanceof SRoutingHandle);
                    createRoutingHandles(parent);
                }
            });
            return context.root;
        }
    }

    redo(context: CommandExecutionContext): CommandResult {
        if (this.action.animate) {
            return new MoveHandlesAnimation(context.root, this.resolvedMoves, this.originalRoutingPoints, context, false).start();
        } else {
            return this.doMove(context);
        }
    }

}

export class MoveHandlesAnimation extends Animation {

    constructor(protected model: SModelRoot,
                public handleMoves: Map<string, ResolvedHandleMove>,
                public originalRoutingPoints: Map<string, Point[]>,
                context: CommandExecutionContext,
                protected reverse: boolean = false) {
        super(context);
    }

    tween(t: number) {
        this.handleMoves.forEach(handleMove => {
            const parent = handleMove.parent;
            if (isRoutable(parent) && handleMove.fromPosition !== undefined) {
                if (this.reverse && t === 1) {
                    const revPoints = this.originalRoutingPoints.get(parent.id);
                    if (revPoints !== undefined) {
                        parent.routingPoints = revPoints;
                        parent.removeAll(e => e instanceof SRoutingHandle);
                        createRoutingHandles(parent);
                        return;
                    }
                }
                const points = parent.routingPoints;
                const index = handleMove.element.pointIndex;
                if (index >= 0 && index < points.length) {
                    if (this.reverse) {
                        points[index] = {
                            x: (1 - t) * handleMove.toPosition.x + t * handleMove.fromPosition.x,
                            y: (1 - t) * handleMove.toPosition.y + t * handleMove.fromPosition.y
                        };
                    } else {
                        points[index] = {
                            x: (1 - t) * handleMove.fromPosition.x + t * handleMove.toPosition.x,
                            y: (1 - t) * handleMove.fromPosition.y + t * handleMove.toPosition.y
                        };
                    }
                }
            }
        });
        return this.model;
    }
}
