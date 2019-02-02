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

import { inject, injectable, optional } from "inversify";
import { VNode } from "snabbdom/vnode";
import { Action } from "../../base/actions/action";
import { Animation, CompoundAnimation } from "../../base/animations/animation";
import { CommandExecutionContext, ICommand, MergeableCommand } from "../../base/commands/command";
import { SChildElement, SModelElement, SModelRoot } from '../../base/model/smodel';
import { findParentByFeature, translatePoint } from "../../base/model/smodel-utils";
import { TYPES } from "../../base/types";
import { MouseListener } from "../../base/views/mouse-tool";
import { IVNodeDecorator } from "../../base/views/vnode-decorators";
import { setAttr } from "../../base/views/vnode-utils";
import { add, linear, Point, subtract, center } from '../../utils/geometry';
import { findChildrenAtPosition, isAlignable } from "../bounds/model";
import { isCreatingOnDrag } from "../edit/create-on-drag";
import { DeleteElementAction } from "../edit/delete";
import { SwitchEditModeAction } from "../edit/edit-routing";
import { ReconnectAction, ReconnectCommand } from "../edit/reconnect";
import { isConnectable, SRoutableElement, SRoutingHandle } from "../routing/model";
import { EdgeRouterRegistry, EdgeSnapshot, EdgeMemento } from "../routing/routing";
import { isSelectable } from "../select/model";
import { SelectAction, SelectAllAction } from "../select/select";
import { isViewport } from "../viewport/model";
import { isLocateable, isMoveable, Locateable } from './model';

export class MoveAction implements Action {
    kind = MoveCommand.KIND;

    constructor(public readonly moves: ElementMove[],
                public readonly animate: boolean = true) {
    }
}

export interface ElementMove {
    elementId: string
    fromPosition?: Point
    toPosition: Point
}

export interface ResolvedElementMove {
    element: SModelElement & Locateable
    fromPosition: Point
    toPosition: Point
}

export interface ResolvedHandleMove {
    handle: SRoutingHandle
    fromPosition: Point
    toPosition: Point
}

@injectable()
export class MoveCommand extends MergeableCommand {
    static readonly KIND = 'move';

    @inject(EdgeRouterRegistry)@optional() edgeRouterRegistry?: EdgeRouterRegistry;

    resolvedMoves: Map<string, ResolvedElementMove> = new Map;
    edgeMementi: EdgeMemento[] = [];

    constructor(@inject(TYPES.Action) protected action: MoveAction) {
        super();
    }

    execute(context: CommandExecutionContext) {
        const index = context.root.index;
        const edge2handleMoves = new Map<SRoutableElement, ResolvedHandleMove[]>();
        const attachedEdgeShifts = new Map<SRoutableElement, Point>();
        this.action.moves.forEach(move => {
            const element = index.getById(move.elementId);
            if (element instanceof SRoutingHandle && this.edgeRouterRegistry) {
                const edge = element.parent;
                if (edge instanceof SRoutableElement) {
                    const resolvedMove = this.resolveHandleMove(element, edge, move);
                    if (resolvedMove) {
                        let movesByEdge = edge2handleMoves.get(edge);
                        if (!movesByEdge) {
                            movesByEdge = [];
                            edge2handleMoves.set(edge, movesByEdge);
                        }
                        movesByEdge.push(resolvedMove);
                    }
                }
            } else if (element && isLocateable(element)) {
                const resolvedMove = this.resolveElementMove(element, move);
                if (resolvedMove) {
                    this.resolvedMoves.set(resolvedMove.element.id, resolvedMove);
                    if (this.edgeRouterRegistry) {
                        index.getAttachedElements(element).forEach(edge => {
                            if (edge instanceof SRoutableElement) {
                                const existingDelta = attachedEdgeShifts.get(edge);
                                const newDelta = subtract(resolvedMove.toPosition, resolvedMove.fromPosition);
                                const delta = (existingDelta)
                                    ? linear(existingDelta, newDelta, 0.5)
                                    : newDelta;
                                attachedEdgeShifts.set(edge, delta);
                            }
                        });
                    }
                }
            }
        });
        this.doMove(edge2handleMoves, attachedEdgeShifts);
        if (this.action.animate) {
            this.undoMove();
            return new CompoundAnimation(context.root, context, [
                new MoveAnimation(context.root, this.resolvedMoves, context, false),
                new MorphEdgesAnimation(context.root, this.edgeMementi, context, false)
            ]).start();
        }
        return context.root;
    }

    protected resolveHandleMove(handle: SRoutingHandle, edge: SRoutableElement, move: ElementMove): ResolvedHandleMove | undefined {
        let fromPosition = move.fromPosition;
        if (!fromPosition) {
            const router = this.edgeRouterRegistry!.get(edge.routerKind);
            fromPosition = router.getHandlePosition(edge, router.route(edge), handle);
        }
        if (fromPosition)
            return {
                handle,
                fromPosition,
                toPosition: move.toPosition
            };
        return undefined;
    }

    protected resolveElementMove(element: SModelElement & Locateable, move: ElementMove): ResolvedElementMove | undefined {
        const fromPosition = move.fromPosition
            || { x: element.position.x, y: element.position.y };
        return {
            element,
            fromPosition,
            toPosition: move.toPosition
        };
    }

    protected doMove(edge2move: Map<SRoutableElement, ResolvedHandleMove[]>, attachedEdgeShifts: Map<SRoutableElement, Point>) {
        this.resolvedMoves.forEach(res => {
            res.element.position = res.toPosition;
        });
        edge2move.forEach((moves, edge) => {
            const router = this.edgeRouterRegistry!.get(edge.routerKind);
            const before = router.takeSnapshot(edge);
            router.applyHandleMoves(edge, moves);
            const after = router.takeSnapshot(edge);
            this.edgeMementi.push({ edge, before, after });
        });
        attachedEdgeShifts.forEach((delta, edge) => {
            if (!edge2move.get(edge)) {
                const router = this.edgeRouterRegistry!.get(edge.routerKind);
                const before = router.takeSnapshot(edge);
                if (edge.source
                    && edge.target
                    && this.resolvedMoves.get(edge.source.id)
                    && this.resolvedMoves.get(edge.target.id)) {
                    // move the entire edge when both source and target are moved
                    edge.routingPoints = edge.routingPoints.map(rp => add(rp, delta));
                } else {
                    // add/remove RPs according to the new positions
                    router.applyHandleMoves(edge, []);
                }
                const after = router.takeSnapshot(edge);
                this.edgeMementi.push({ edge, before, after });
            }
        });
    }

    protected undoMove() {
        this.resolvedMoves.forEach(res => {
            (res.element as any).position = res.fromPosition;
        });
        this.edgeMementi.forEach(memento => {
            const router = this.edgeRouterRegistry!.get(memento.edge.routerKind);
            router.applySnapshot(memento.edge, memento.before);
        });
    }

    undo(context: CommandExecutionContext) {
        return new CompoundAnimation(context.root, context, [
            new MoveAnimation(context.root, this.resolvedMoves, context, true),
            new MorphEdgesAnimation(context.root, this.edgeMementi, context, true)
        ]).start();
    }

    redo(context: CommandExecutionContext) {
        return new CompoundAnimation(context.root, context, [
            new MoveAnimation(context.root, this.resolvedMoves, context, false),
            new MorphEdgesAnimation(context.root, this.edgeMementi, context, false)
        ]).start();
    }

    merge(other: ICommand, context: CommandExecutionContext) {
        if (!this.action.animate && other instanceof MoveCommand) {
            other.resolvedMoves.forEach(
                (otherMove, otherElementId) => {
                    const existingMove = this.resolvedMoves.get(otherElementId);
                    if (existingMove) {
                        existingMove.toPosition = otherMove.toPosition;
                    } else {
                        this.resolvedMoves.set(otherElementId, otherMove);
                    }
                }
            );
            other.edgeMementi.forEach(otherMemento => {
                const existingMemento = this.edgeMementi.find(edgeMemento => edgeMemento.edge.id === otherMemento.edge.id);
                if (existingMemento) {
                    existingMemento.after = otherMemento.after;
                } else {
                    this.edgeMementi.push(otherMemento);
                }
            });
            return true;
        } else if (other instanceof ReconnectCommand) {
            const otherMemento = other.memento;
            if (otherMemento) {
                const existingMemento = this.edgeMementi.find(edgeMemento => edgeMemento.edge.id === otherMemento.edge.id);
                if (existingMemento) {
                    existingMemento.after = otherMemento.after;
                } else {
                    this.edgeMementi.push(otherMemento);
                }
            }
            return true;
        }
        return false;
    }
}

export class MoveAnimation extends Animation {

    constructor(protected model: SModelRoot,
                public elementMoves: Map<string, ResolvedElementMove>,
                context: CommandExecutionContext,
                protected reverse: boolean = false) {
        super(context);
    }

    tween(t: number) {
        this.elementMoves.forEach((elementMove) => {
            if (this.reverse) {
                elementMove.element.position = {
                    x: (1 - t) * elementMove.toPosition.x + t * elementMove.fromPosition.x,
                    y: (1 - t) * elementMove.toPosition.y + t * elementMove.fromPosition.y
                };
            } else {
                elementMove.element.position = {
                    x: (1 - t) * elementMove.fromPosition.x + t * elementMove.toPosition.x,
                    y: (1 - t) * elementMove.fromPosition.y + t * elementMove.toPosition.y
                };
            }
        });
        return this.model;
    }
}

export class MorphEdgesAnimation extends Animation {

    protected expandedMementi: EdgeMemento[] = [];

    constructor(protected model: SModelRoot,
                protected originalMementi: EdgeMemento[],
                context: CommandExecutionContext,
                protected reverse: boolean = false) {
        super(context);
        originalMementi.forEach(edgeMemento => {
            const start = this.reverse ? edgeMemento.after : edgeMemento.before;
            const end = this.reverse ? edgeMemento.before : edgeMemento.after;

            // duplicate RPs such that both snapshots have the same number of RPs
            const startRpsExpanded = start.routingPoints.slice();
            const endRpsExpanded = end.routingPoints.slice();
            const midPoint = this.midPoint(edgeMemento);
            let diff = startRpsExpanded.length - endRpsExpanded.length;
            while (diff > 0) {
                endRpsExpanded.push(endRpsExpanded[endRpsExpanded.length - 1] || midPoint);
                --diff;
            }
            while (diff < 0) {
                startRpsExpanded.push(startRpsExpanded[startRpsExpanded.length - 1] || midPoint);
                ++diff;
            }
            this.expandedMementi.push({
                edge: edgeMemento.edge,
                before: {
                    ...start,
                    routingPoints: startRpsExpanded,
                },
                after: {
                    ...end,
                    routingPoints: endRpsExpanded
                }
            });
        });
    }

    protected midPoint(edgeMemento: EdgeMemento): Point {
        const edge = edgeMemento.edge;
        const source = edgeMemento.edge.source!;
        const target = edgeMemento.edge.target!;
        return linear(
            translatePoint(center(source.bounds), source.parent, edge.parent),
            translatePoint(center(target.bounds), target.parent, edge.parent),
            0.5);
    }

    start() {
        this.expandedMementi.forEach(memento => {
            memento.edge.removeAll(e => e instanceof SRoutingHandle);
        });
        return super.start();
    }

    tween(t: number) {
        if (t === 1) {
            this.originalMementi.forEach(memento => {
                if (this.reverse)
                    memento.after.router.applySnapshot(memento.edge, memento.before);
                else
                    memento.after.router.applySnapshot(memento.edge, memento.after);
            });
        } else {
            this.expandedMementi.forEach(memento => {
                const newRoutingPoints: Point[] = [];
                for (let i = 0; i < memento.before.routingPoints.length; ++i) {
                    const startPoint = memento.before.routingPoints[i];
                    const endPoint = memento.after.routingPoints[i];
                    newRoutingPoints.push({
                        x: (1 - t) * startPoint.x + t * endPoint.x,
                        y: (1 - t) * startPoint.y + t * endPoint.y
                    });
                }
                const closestSnapshot = t < 0.5 ? memento.before : memento.after;
                const newSnapshot: EdgeSnapshot = {
                    ...closestSnapshot,
                    routingPoints: newRoutingPoints,
                    routingHandles: []
                };
                closestSnapshot.router.applySnapshot(memento.edge, newSnapshot);
            });
        }
        return this.model;
    }
}

export const edgeInProgressID = 'edge-in-progress';

export class MoveMouseListener extends MouseListener {

    @inject(EdgeRouterRegistry)@optional() edgeRouterRegistry?: EdgeRouterRegistry;

    hasDragged = false;
    lastDragPosition: Point | undefined;

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            const moveable = findParentByFeature(target, isMoveable);
            const isRoutingHandle = target instanceof SRoutingHandle;
            if (moveable !== undefined || isRoutingHandle || isCreatingOnDrag(target)) {
                this.lastDragPosition = { x: event.pageX, y: event.pageY };
            } else {
                this.lastDragPosition = undefined;
            }
            this.hasDragged = false;
            if (isCreatingOnDrag(target)) {
                result.push(new SelectAllAction(false));
                result.push(target.createAction(edgeInProgressID));
                result.push(new SelectAction([edgeInProgressID], []));
                result.push(new SwitchEditModeAction([edgeInProgressID], []));
                result.push(new SelectAction([edgeInProgressID + '-target-anchor'], []));
                result.push(new SwitchEditModeAction([edgeInProgressID + '-target-anchor'], []));
            } else if (isRoutingHandle) {
                result.push(new SwitchEditModeAction([target.id], []));
            }
        }
        return result;
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.buttons === 0)
            this.mouseUp(target, event);
        else if (this.lastDragPosition) {
            const viewport = findParentByFeature(target, isViewport);
            this.hasDragged = true;
            const zoom = viewport ? viewport.zoom : 1;
            const dx = (event.pageX - this.lastDragPosition.x) / zoom;
            const dy = (event.pageY - this.lastDragPosition.y) / zoom;
            const elementMoves: ElementMove[] = [];
            target.root.index.all()
                .filter(element => isSelectable(element) && element.selected)
                .forEach(element => {
                    if (isMoveable(element)) {
                        elementMoves.push({
                            elementId: element.id,
                            fromPosition: {
                                x: element.position.x,
                                y: element.position.y
                            },
                            toPosition: {
                                x: element.position.x + dx,
                                y: element.position.y + dy
                            }
                        });
                    } else if (element instanceof SRoutingHandle) {
                        const point = this.getHandlePosition(element);
                        if (point !== undefined) {
                            elementMoves.push({
                                elementId: element.id,
                                fromPosition: point,
                                toPosition: {
                                    x: point.x + dx,
                                    y: point.y + dy
                                }
                            });
                        }
                    }
                });
            this.lastDragPosition = { x: event.pageX, y: event.pageY };
            if (elementMoves.length > 0)
                result.push(new MoveAction(elementMoves, false));
        }
        return result;
    }

    protected getHandlePosition(handle: SRoutingHandle): Point | undefined {
        if (this.edgeRouterRegistry) {
            const parent = handle.parent;
            if (!(parent instanceof SRoutableElement))
                return undefined;
            const router = this.edgeRouterRegistry.get(parent.routerKind);
            const route = router.route(parent);
            return router.getHandlePosition(parent, route, handle);
        }
        return undefined;
    }

    mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SModelRoot && event.buttons === 0)
            this.mouseUp(target, event);
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        let hasReconnected = false;
        if (this.lastDragPosition) {
            target.root.index.all()
                .forEach(element => {
                    if (element instanceof SRoutingHandle) {
                        const parent = element.parent;
                        if (parent instanceof SRoutableElement && element.danglingAnchor) {
                            const handlePos = this.getHandlePosition(element);
                            if (handlePos) {
                                const handlePosAbs = translatePoint(handlePos, element.parent, element.root);
                                const newEnd = findChildrenAtPosition(target.root, handlePosAbs)
                                    .find(e => isConnectable(e) && e.canConnect(parent, element.kind as ('source' | 'target')));
                                if (newEnd && this.hasDragged) {
                                    result.push(new ReconnectAction(element.parent.id,
                                        element.kind === 'source' ? newEnd.id : parent.sourceId,
                                        element.kind === 'target' ? newEnd.id : parent.targetId));
                                    hasReconnected = true;
                                }
                            }
                        }
                        if (element.editMode)
                            result.push(new SwitchEditModeAction([], [element.id]));
                    }
                });
        }
        if (!hasReconnected) {
            const edgeInProgress = target.root.index.getById(edgeInProgressID);
            if (edgeInProgress instanceof SChildElement) {
                const deleteIds: string[] = [];
                deleteIds.push(edgeInProgressID);
                edgeInProgress.children.forEach(c => {
                    if (c instanceof SRoutingHandle && c.danglingAnchor)
                        deleteIds.push(c.danglingAnchor.id);
                });
                result.push(new DeleteElementAction(deleteIds));
            }
        }
        this.hasDragged = false;
        this.lastDragPosition = undefined;
        return result;
    }

    decorate(vnode: VNode, element: SModelElement): VNode {
        return vnode;
    }
}

@injectable()
export class LocationDecorator implements IVNodeDecorator {

    decorate(vnode: VNode, element: SModelElement): VNode {
        let translate: string  = '';
        if (isLocateable(element) && element instanceof SChildElement && element.parent !== undefined) {
            translate = 'translate(' + element.position.x + ', ' + element.position.y + ')';
        }
        if (isAlignable(element)) {
            if (translate.length > 0)
                translate += ' ';
            translate += 'translate('  + element.alignment.x + ', ' + element.alignment.y + ')';
        }
        if (translate.length > 0)
            setAttr(vnode, 'transform', translate);
        return vnode;
    }

    postUpdate(): void {
    }
}
