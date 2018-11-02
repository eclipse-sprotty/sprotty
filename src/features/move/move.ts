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
import { Point, centerOfLine } from '../../utils/geometry';
import { SChildElement } from '../../base/model/smodel';
import { VNode } from "snabbdom/vnode";
import { SModelElement, SModelIndex, SModelRoot } from "../../base/model/smodel";
import { findParentByFeature, translatePoint } from "../../base/model/smodel-utils";
import { Action } from "../../base/actions/action";
import { ICommand, CommandExecutionContext, MergeableCommand } from "../../base/commands/command";
import { Animation } from "../../base/animations/animation";
import { MouseListener } from "../../base/views/mouse-tool";
import { setAttr } from "../../base/views/vnode-utils";
import { IVNodeDecorator } from "../../base/views/vnode-decorators";
import { isViewport } from "../viewport/model";
import { isSelectable } from "../select/model";
import { isAlignable, findChildrenAtPosition } from "../bounds/model";
import { Routable, isRoutable, SRoutingHandle } from '../edit/model';
import { MoveRoutingHandleAction, HandleMove, SwitchEditModeAction } from "../edit/edit-routing";
import { isMoveable, Locateable, isLocateable } from './model';
import { RoutedPoint } from "../../graph/routing";
import { isCreatingOnDrag } from "../edit/create-on-drag";
import { SelectAllAction, SelectAction } from "../select/select";
import { SDanglingAnchor } from "../../graph/sgraph";
import { isConnectable, ReconnectAction } from "../edit/reconnect";
import { DeleteElementAction } from "../edit/delete";

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
    elementId: string
    element: SModelElement & Locateable
    fromPosition: Point
    toPosition: Point
}

export interface ResolvedElementRoute {
    elementId: string
    element: SModelElement & Routable
    fromRoute: Point[]
    toRoute: Point[]
}

export class MoveCommand extends MergeableCommand {
    static readonly KIND = 'move';

    resolvedMoves: Map<string, ResolvedElementMove> = new Map;
    resolvedRoutes: Map<string, ResolvedElementRoute> = new Map;

    constructor(protected action: MoveAction) {
        super();
    }

    execute(context: CommandExecutionContext) {
        const model = context.root;
        const attachedElements: Set<SModelElement> = new Set;
        this.action.moves.forEach(move => {
            const resolvedMove = this.resolve(move, model.index);
            if (resolvedMove !== undefined) {
                this.resolvedMoves.set(resolvedMove.elementId, resolvedMove);
                model.index.getAttachedElements(resolvedMove.element).forEach(e => attachedElements.add(e));
            }
        });
        attachedElements.forEach(element => this.handleAttachedElement(element));
        if (this.action.animate) {
            return new MoveAnimation(model, this.resolvedMoves, this.resolvedRoutes, context).start();
        } else {
            return this.doMove(context);
        }
    }

    protected resolve(move: ElementMove, index: SModelIndex<SModelElement>): ResolvedElementMove | undefined {
        const element = index.getById(move.elementId);
        if (element !== undefined && isLocateable(element)) {
            const fromPosition = move.fromPosition || { x: element.position.x, y: element.position.y };
            return {
                elementId: move.elementId,
                element: element,
                fromPosition: fromPosition,
                toPosition: move.toPosition
            };
        }
        return undefined;
    }

    protected handleAttachedElement(element: SModelElement): void {
        if (isRoutable(element)) {
            const source = element.source;
            const sourceMove = source ? this.resolvedMoves.get(source.id) : undefined;
            const target = element.target;
            const targetMove = target ? this.resolvedMoves.get(target.id) : undefined;
            if (sourceMove !== undefined && targetMove !== undefined) {
                const deltaX = targetMove.toPosition.x - targetMove.fromPosition.x;
                const deltaY = targetMove.toPosition.y - targetMove.fromPosition.y;
                this.resolvedRoutes.set(element.id, {
                    elementId: element.id,
                    element,
                    fromRoute: element.routingPoints,
                    toRoute: element.routingPoints.map(rp => ({
                        x: rp.x + deltaX,
                        y: rp.y + deltaY
                    }))
                });
            }
        }
    }

    protected doMove(context: CommandExecutionContext, reverse?: boolean): SModelRoot {
        this.resolvedMoves.forEach(res => {
            if (reverse)
                res.element.position = res.fromPosition;
            else
                res.element.position = res.toPosition;
        });
        this.resolvedRoutes.forEach(res => {
            if (reverse)
                res.element.routingPoints = res.fromRoute;
            else
                res.element.routingPoints = res.toRoute;
        });
        return context.root;
    }

    undo(context: CommandExecutionContext) {
        return new MoveAnimation(context.root, this.resolvedMoves, this.resolvedRoutes, context, true).start();
    }

    redo(context: CommandExecutionContext) {
        return new MoveAnimation(context.root, this.resolvedMoves, this.resolvedRoutes, context, false).start();
    }

    merge(command: ICommand, context: CommandExecutionContext) {
        if (!this.action.animate && command instanceof MoveCommand) {
            command.action.moves.forEach(
                otherMove => {
                    const existingMove = this.resolvedMoves.get(otherMove.elementId);
                    if (existingMove) {
                        existingMove.toPosition = otherMove.toPosition;
                    } else {
                        const resolvedMove = this.resolve(otherMove, context.root.index);
                        if (resolvedMove)
                            this.resolvedMoves.set(resolvedMove.elementId, resolvedMove);
                    }
                }
            );
            return true;
        }
        return false;
    }
}

export class MoveAnimation extends Animation {

    constructor(protected model: SModelRoot,
                public elementMoves: Map<string, ResolvedElementMove>,
                public elementRoutes: Map<string, ResolvedElementRoute>,
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
        this.elementRoutes.forEach(elementRoute => {
            const route: Point[] = [];
            for (let i = 0; i < elementRoute.fromRoute.length && i < elementRoute.toRoute.length; i++) {
                const fp = elementRoute.fromRoute[i];
                const tp = elementRoute.toRoute[i];
                if (this.reverse) {
                    route.push({
                        x: (1 - t) * tp.x + t * fp.x,
                        y: (1 - t) * tp.y + t * fp.y
                    });
                } else {
                    route.push({
                        x: (1 - t) * fp.x + t * tp.x,
                        y: (1 - t) * fp.y + t * tp.y
                    });
                }
            }
            elementRoute.element.routingPoints = route;
        });
        return this.model;
    }
}

export const edgeInProgressID = 'edge-in-progress';

export class MoveMouseListener extends MouseListener {

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
            const nodeMoves: ElementMove[] = [];
            const handleMoves: HandleMove[] = [];
            target.root.index.all()
                .filter(element => isSelectable(element) && element.selected)
                .forEach(element => {
                    if (isMoveable(element)) {
                        nodeMoves.push({
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
                            handleMoves.push({
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
            if (nodeMoves.length > 0)
                result.push(new MoveAction(nodeMoves, false));
            if (handleMoves.length > 0)
                result.push(new MoveRoutingHandleAction(handleMoves, false));
        }
        return result;
    }

    protected getHandlePosition(handle: SRoutingHandle): Point | undefined {
        const parent = handle.parent;
        if (!isRoutable(parent)) {
            return undefined;
        }
        switch (handle.kind) {
            case 'source':
                if (parent.source instanceof SDanglingAnchor)
                    return parent.source.position;
                else
                    return parent.route()[0];
            case 'target':
                if (parent.target instanceof SDanglingAnchor)
                    return parent.target.position;
                else {
                    const route = parent.route();
                    return route[route.length - 1];
                }
            case 'line': {
                const getIndex = (rp: RoutedPoint) => {
                    if (rp.pointIndex !== undefined)
                        return rp.pointIndex;
                    else if (rp.kind === 'target')
                        return parent.routingPoints.length;
                    else
                        return -1;
                };
                const route = parent.route();
                let rp1, rp2: RoutedPoint | undefined;
                for (const rp of route) {
                    const i = getIndex(rp);
                    if (i <= handle.pointIndex && (rp1 === undefined || i > getIndex(rp1)))
                        rp1 = rp;
                    if (i > handle.pointIndex && (rp2 === undefined || i < getIndex(rp2)))
                        rp2 = rp;
                }
                if (rp1 !== undefined && rp2 !== undefined) {
                    return centerOfLine(rp1, rp2);
                }
                return undefined;
            }
            default:
                if (handle.pointIndex >= 0)
                    return parent.routingPoints[handle.pointIndex];
                return undefined;
        }
    }

    mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SModelRoot && event.buttons === 0)
            this.mouseUp(target, event);
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (this.lastDragPosition) {
            target.root.index.all()
                .forEach(element => {
                    if (element instanceof SRoutingHandle) {
                        const parent = element.parent;
                        if (isRoutable(parent) && (element.danglingAnchor || parent.id === edgeInProgressID)) {
                            const handlePos = this.getHandlePosition(element);
                            if (handlePos) {
                                const handlePosAbs = translatePoint(handlePos, element.parent, element.root);
                                const newEnd = findChildrenAtPosition(target.root, handlePosAbs)
                                    .find(e => isConnectable(e) && e.canConnect(parent, element.kind as ('source' | 'target')));
                                if (newEnd && this.hasDragged) {
                                    result.push(new ReconnectAction(element.parent.id,
                                        element.kind === 'source' ? newEnd.id : parent.sourceId,
                                        element.kind === 'target' ? newEnd.id : parent.targetId));
                                } else if (parent.id === edgeInProgressID) {
                                    if (element.danglingAnchor)
                                        result.push(new DeleteElementAction([edgeInProgressID, element.danglingAnchor.id]));
                                    else
                                        result.push(new DeleteElementAction([edgeInProgressID]));
                                }
                            }
                        }
                        if (element.editMode)
                            result.push(new SwitchEditModeAction([], [element.id]));
                    }
                });
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
