/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
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

import { inject, injectable, optional } from 'inversify';
import { VNode } from 'snabbdom';
import { Bounds, Point } from 'sprotty-protocol/lib/utils/geometry';
import { Action, DeleteElementAction, ReconnectAction, SelectAction, SelectAllAction, MoveAction } from 'sprotty-protocol/lib/actions';
import { Animation, CompoundAnimation } from '../../base/animations/animation';
import { CommandExecutionContext, ICommand, MergeableCommand, CommandReturn } from '../../base/commands/command';
import { SChildElementImpl, SModelElementImpl, SModelRootImpl } from '../../base/model/smodel';
import { findParentByFeature, translatePoint } from '../../base/model/smodel-utils';
import { TYPES } from '../../base/types';
import { MouseListener } from '../../base/views/mouse-tool';
import { IVNodePostprocessor } from '../../base/views/vnode-postprocessor';
import { setAttr } from '../../base/views/vnode-utils';
import { SEdgeImpl } from '../../graph/sgraph';
import { CommitModelAction } from '../../model-source/commit-model';
import { findChildrenAtPosition, isAlignable } from '../bounds/model';
import { CreatingOnDrag, isCreatingOnDrag } from '../edit/create-on-drag';
import { SwitchEditModeAction } from '../edit/edit-routing';
import { ReconnectCommand } from '../edit/reconnect';
import { edgeInProgressID, edgeInProgressTargetHandleID, isConnectable, SRoutableElementImpl, SRoutingHandleImpl } from '../routing/model';
import { EdgeMemento, EdgeRouterRegistry, EdgeSnapshot, RoutedPoint } from '../routing/routing';
import { isEdgeLayoutable } from '../edge-layout/model';
import { isSelectable } from '../select/model';
import { isViewport } from '../viewport/model';
import { isLocateable, isMoveable, Locateable } from './model';
import { ISnapper } from './snap';

export interface ElementMove {
    elementId: string
    elementType?: string
    fromPosition?: Point
    toPosition: Point
}

export interface ResolvedElementMove {
    element: SModelElementImpl & Locateable
    fromPosition: Point
    toPosition: Point
}

export interface ResolvedHandleMove {
    handle: SRoutingHandleImpl
    fromPosition: Point
    toPosition: Point
}

@injectable()
export class MoveCommand extends MergeableCommand {
    static readonly KIND = MoveAction.KIND;

    @inject(EdgeRouterRegistry) @optional() edgeRouterRegistry?: EdgeRouterRegistry;

    protected resolvedMoves: Map<string, ResolvedElementMove> = new Map;
    protected edgeMementi: EdgeMemento[] = [];

    constructor(@inject(TYPES.Action) protected readonly action: MoveAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        const edge2handleMoves = new Map<SRoutableElementImpl, ResolvedHandleMove[]>();
        const attachedEdgeShifts = new Map<SRoutableElementImpl, Point>();
        this.action.moves.forEach(move => {
            const element = index.getById(move.elementId);
            if (element instanceof SRoutingHandleImpl && this.edgeRouterRegistry) {
                const edge = element.parent;
                if (edge instanceof SRoutableElementImpl) {
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
                            if (edge instanceof SRoutableElementImpl) {
                                const existingDelta = attachedEdgeShifts.get(edge);
                                const newDelta = Point.subtract(resolvedMove.toPosition, resolvedMove.fromPosition);
                                const delta = (existingDelta)
                                    ? Point.linear(existingDelta, newDelta, 0.5)
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

    protected resolveHandleMove(handle: SRoutingHandleImpl, edge: SRoutableElementImpl, move: ElementMove): ResolvedHandleMove | undefined {
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

    protected resolveElementMove(element: SModelElementImpl & Locateable, move: ElementMove): ResolvedElementMove | undefined {
        const fromPosition = move.fromPosition
            || { x: element.position.x, y: element.position.y };
        return {
            element,
            fromPosition,
            toPosition: move.toPosition
        };
    }

    protected doMove(edge2move: Map<SRoutableElementImpl, ResolvedHandleMove[]>, attachedEdgeShifts: Map<SRoutableElementImpl, Point>) {
        this.resolvedMoves.forEach(res => {
            res.element.position = res.toPosition;
        });
        // reset edges to state before
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
                    edge.routingPoints = edge.routingPoints.map(rp => Point.add(rp, delta));
                } else {
                    // add/remove RPs according to the new source/target positions
                    const updateHandles = isSelectable(edge) && edge.selected;
                    router.cleanupRoutingPoints(edge, edge.routingPoints, updateHandles, this.action.finished);
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

    undo(context: CommandExecutionContext): Promise<SModelRootImpl> {
        return new CompoundAnimation(context.root, context, [
            new MoveAnimation(context.root, this.resolvedMoves, context, true),
            new MorphEdgesAnimation(context.root, this.edgeMementi, context, true)
        ]).start();
    }

    redo(context: CommandExecutionContext): Promise<SModelRootImpl> {
        return new CompoundAnimation(context.root, context, [
            new MoveAnimation(context.root, this.resolvedMoves, context, false),
            new MorphEdgesAnimation(context.root, this.edgeMementi, context, false)
        ]).start();
    }

    override merge(other: ICommand, context: CommandExecutionContext) {
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

    constructor(protected model: SModelRootImpl,
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

interface ExpandedEdgeMorph {
    startExpandedRoute: Point[],
    endExpandedRoute: Point[],
    memento: EdgeMemento
}

export class MorphEdgesAnimation extends Animation {

    protected expanded: ExpandedEdgeMorph[] = [];

    constructor(protected model: SModelRootImpl,
                originalMementi: EdgeMemento[],
                context: CommandExecutionContext,
                protected reverse: boolean = false) {
        super(context);
        originalMementi.forEach(edgeMemento => {
            const start = this.reverse ? edgeMemento.after : edgeMemento.before;
            const end = this.reverse ? edgeMemento.before : edgeMemento.after;
            const startRoute = start.routedPoints;
            const endRoute = end.routedPoints;
            const maxRoutingPoints = Math.max(startRoute.length, endRoute.length);
            this.expanded.push({
                startExpandedRoute: this.growToSize(startRoute, maxRoutingPoints),
                endExpandedRoute: this.growToSize(endRoute, maxRoutingPoints),
                memento: edgeMemento
            });
        });
    }

    protected midPoint(edgeMemento: EdgeMemento): Point {
        const edge = edgeMemento.edge;
        const source = edgeMemento.edge.source!;
        const target = edgeMemento.edge.target!;
        return Point.linear(
            translatePoint(Bounds.center(source.bounds), source.parent, edge.parent),
            translatePoint(Bounds.center(target.bounds), target.parent, edge.parent),
            0.5);
    }

    override start() {
        this.expanded.forEach(morph => {
            morph.memento.edge.removeAll(e => e instanceof SRoutingHandleImpl);
        });
        return super.start();
    }

    tween(t: number) {
        if (t === 1) {
            this.expanded.forEach(morph => {
                const memento = morph.memento;
                if (this.reverse)
                    memento.before.router.applySnapshot(memento.edge, memento.before);
                else
                    memento.after.router.applySnapshot(memento.edge, memento.after);
            });
        } else {
            this.expanded.forEach(morph => {
                const newRoutingPoints: Point[] = [];
                // ignore source and target anchor
                for (let i = 1; i < morph.startExpandedRoute.length - 1; ++i)
                    newRoutingPoints.push(Point.linear(morph.startExpandedRoute[i], morph.endExpandedRoute[i], t));

                const closestSnapshot = t < 0.5 ? morph.memento.before : morph.memento.after;
                const newSnapshot: EdgeSnapshot = {
                    ...closestSnapshot,
                    routingPoints: newRoutingPoints,
                    routingHandles: []
                };
                closestSnapshot.router.applySnapshot(morph.memento.edge, newSnapshot);
            });
        }
        return this.model;
    }

    protected growToSize(route: RoutedPoint[], targetSize: number): Point[] {
        const diff = targetSize - route.length;
        if (diff <= 0)
            return route;
        const result: Point[] = [];
        result.push(route[0]);
        const deltaDiff = 1 / (diff + 1);
        const deltaSmaller = 1 / (route.length - 1);
        let nextInsertion = 1;
        for (let i = 1; i < route.length; ++i) {
            const pos = deltaSmaller * i;
            let insertions = 0;
            while (pos > (nextInsertion + insertions) * deltaDiff)
                ++insertions;
            nextInsertion += insertions;
            for (let j = 0; j < insertions; ++j) {
                const p = Point.linear(route[i - 1], route[i], (j + 1) / (insertions + 1));
                result.push(p);
            }
            result.push(route[i]);
        }
        return result;
    }

}

export class MoveMouseListener extends MouseListener {

    @inject(EdgeRouterRegistry) @optional() edgeRouterRegistry?: EdgeRouterRegistry;
    @inject(TYPES.ISnapper) @optional() snapper?: ISnapper;

    hasDragged = false;
    startDragPosition: Point | undefined;
    elementId2startPos = new Map<string, Point>();

    override mouseDown(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        if (event.button === 0) {
            const moveable = findParentByFeature(target, isMoveable);
            const isRoutingHandle = target instanceof SRoutingHandleImpl;
            if (moveable !== undefined || isRoutingHandle || isCreatingOnDrag(target)) {
                this.startDragPosition = { x: event.pageX, y: event.pageY };
            } else {
                this.startDragPosition = undefined;
            }
            this.hasDragged = false;
            if (isCreatingOnDrag(target)) {
                return this.startCreatingOnDrag(target, event);
            } else if (isRoutingHandle) {
                return this.activateRoutingHandle(target, event);
            }
        }
        return [];
    }

    protected startCreatingOnDrag(target: CreatingOnDrag, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(SelectAllAction.create({ select: false }));
        result.push(target.createAction(edgeInProgressID));
        result.push(SelectAction.create({ selectedElementsIDs: [edgeInProgressID] }));
        result.push(SwitchEditModeAction.create({ elementsToActivate: [edgeInProgressID] }));
        result.push(SelectAction.create({ selectedElementsIDs: [edgeInProgressTargetHandleID] }));
        result.push(SwitchEditModeAction.create({ elementsToActivate: [edgeInProgressTargetHandleID] }));
        return result;
    }

    protected activateRoutingHandle(target: SRoutingHandleImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [SwitchEditModeAction.create({ elementsToActivate: [target.id] })];
    }

    override mouseMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.buttons === 0)
            this.mouseUp(target, event);
        else if (this.startDragPosition) {
            if (this.elementId2startPos.size === 0) {
                this.collectStartPositions(target.root);
            }
            this.hasDragged = true;
            const moveAction = this.getElementMoves(target, event, false);
            if (moveAction)
                result.push(moveAction);
        }
        return result;
    }

    protected collectStartPositions(root: SModelRootImpl) {
        const selectedElements = new Set<SModelElementImpl>(root.index.all()
            .filter(element => isSelectable(element) && element.selected));

        selectedElements.forEach(element => {
            if (!this.isChildOfSelected(selectedElements, element)) {
                if (isMoveable(element))
                    this.elementId2startPos.set(element.id, element.position);
                else if (element instanceof SRoutingHandleImpl) {
                    const position = this.getHandlePosition(element);
                    if (position)
                        this.elementId2startPos.set(element.id, position);
                }
            }
        });
    }

    protected isChildOfSelected(selectedElements: Set<SModelElementImpl>, element: SModelElementImpl): boolean {
        while (element instanceof SChildElementImpl) {
            element = element.parent;
            if (isMoveable(element) && selectedElements.has(element)) {
                return true;
            }
        }
        return false;
    }

    protected getElementMoves(target: SModelElementImpl, event: MouseEvent, isFinished: boolean): MoveAction | undefined {
        if (!this.startDragPosition)
            return undefined;
        const elementMoves: ElementMove[] = [];
        const viewport = findParentByFeature(target, isViewport);
        const zoom = viewport ? viewport.zoom : 1;
        const delta = {
            x: (event.pageX - this.startDragPosition.x) / zoom,
            y: (event.pageY - this.startDragPosition.y) / zoom
        };
        this.elementId2startPos.forEach((startPosition, elementId) => {
            const element = target.root.index.getById(elementId);
            if (element) {
                const move = this.createElementMove(element, startPosition, delta, event);
                if (move) {
                    elementMoves.push(move);
                }
            }
        });
        if (elementMoves.length > 0)
            return MoveAction.create(elementMoves, { animate: false, finished: isFinished });
        else
            return undefined;
    }

    protected createElementMove(element: SModelElementImpl, startPosition: Point, delta: Point, event: MouseEvent): ElementMove | undefined {
        const toPosition = this.snap({
            x: startPosition.x + delta.x,
            y: startPosition.y + delta.y
        }, element, !event.shiftKey);
        if (isMoveable(element)) {
            return {
                elementId: element.id,
                elementType: element.type,
                fromPosition: {
                    x: element.position.x,
                    y: element.position.y
                },
                toPosition
            };
        } else if (element instanceof SRoutingHandleImpl) {
            const point = this.getHandlePosition(element);
            if (point !== undefined) {
                return {
                    elementId: element.id,
                    elementType: element.type,
                    fromPosition: point,
                    toPosition
                };
            }
        }
        return undefined;
    }

    protected snap(position: Point, element: SModelElementImpl, isSnap: boolean): Point {
        if (isSnap && this.snapper)
            return this.snapper.snap(position, element);
        else
            return position;
    }

    protected getHandlePosition(handle: SRoutingHandleImpl): Point | undefined {
        if (this.edgeRouterRegistry) {
            const parent = handle.parent;
            if (!(parent instanceof SRoutableElementImpl))
                return undefined;
            const router = this.edgeRouterRegistry.get(parent.routerKind);
            const route = router.route(parent);
            return router.getHandlePosition(parent, route, handle);
        }
        return undefined;
    }

    override mouseEnter(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (target instanceof SModelRootImpl && event.buttons === 0 && !this.startDragPosition)
            this.mouseUp(target, event);
        return [];
    }

    override mouseUp(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        if (this.startDragPosition) {
            const moveAction = this.getElementMoves(target, event, true);
            if (moveAction) {
                result.push(moveAction);
            }
            target.root.index.all().forEach(element => {
                if (element instanceof SRoutingHandleImpl) {
                    result.push(...this.deactivateRoutingHandle(element, target, event));
                }
            });
        }
        if (!result.some(a => a.kind === ReconnectAction.KIND)) {
            const edgeInProgress = target.root.index.getById(edgeInProgressID);
            if (edgeInProgress instanceof SChildElementImpl) {
                result.push(this.deleteEdgeInProgress(edgeInProgress));
            }
        }
        if (this.hasDragged) {
            result.push(CommitModelAction.create());
        }
        this.hasDragged = false;
        this.startDragPosition = undefined;
        this.elementId2startPos.clear();
        return result;
    }

    protected deactivateRoutingHandle(element: SRoutingHandleImpl, target: SModelElementImpl, event: MouseEvent): Action[] {
        const result: Action[] = [];
        const parent = element.parent;
        if (parent instanceof SRoutableElementImpl && element.danglingAnchor) {
            const handlePos = this.getHandlePosition(element);
            if (handlePos) {
                const handlePosAbs = translatePoint(handlePos, element.parent, element.root);
                const newEnd = findChildrenAtPosition(target.root, handlePosAbs)
                    .find(e => isConnectable(e) && e.canConnect(parent, element.kind as ('source' | 'target')));
                if (newEnd && this.hasDragged) {
                    result.push(ReconnectAction.create({
                        routableId: element.parent.id,
                        newSourceId: element.kind === 'source' ? newEnd.id : parent.sourceId,
                        newTargetId: element.kind === 'target' ? newEnd.id : parent.targetId
                    }));
                }
            }
        }
        if (element.editMode) {
            result.push(SwitchEditModeAction.create({ elementsToDeactivate: [element.id] }));
        }
        return result;
    }

    protected deleteEdgeInProgress(edgeInProgress: SChildElementImpl): Action {
        const deleteIds: string[] = [];
        deleteIds.push(edgeInProgressID);
        edgeInProgress.children.forEach(c => {
            if (c instanceof SRoutingHandleImpl && c.danglingAnchor)
                deleteIds.push(c.danglingAnchor.id);
        });
        return DeleteElementAction.create(deleteIds);
    }

    override decorate(vnode: VNode, element: SModelElementImpl): VNode {
        return vnode;
    }
}

@injectable()
export class LocationPostprocessor implements IVNodePostprocessor {

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (isEdgeLayoutable(element) && element.parent instanceof SEdgeImpl) {
            // The element is handled by EdgeLayoutDecorator
            return vnode;
        }
        let translate: string = '';
        if (isLocateable(element) && element instanceof SChildElementImpl && element.parent !== undefined) {
            const pos = element.position;
            if (pos.x !== 0 || pos.y !== 0) {
                translate = 'translate(' + pos.x + ', ' + pos.y + ')';
            }
        }
        if (isAlignable(element)) {
            const ali = element.alignment;
            if (ali.x !== 0 || ali.y !== 0) {
                if (translate.length > 0) {
                    translate += ' ';
                }
                translate += 'translate(' + ali.x + ', ' + ali.y + ')';
            }
        }
        if (translate.length > 0) {
            setAttr(vnode, 'transform', translate);
        }
        return vnode;
    }

    postUpdate(): void {
    }
}
