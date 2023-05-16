/********************************************************************************
 * Copyright (c) 2021 TypeFox and others.
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
import { Action } from 'sprotty-protocol/lib/actions';
import { centerOfLine, Point } from 'sprotty-protocol/lib/utils/geometry';
import { ResolvedHandleMove } from '../move/move';
import { SDanglingAnchorImpl, SRoutableElementImpl, SRoutingHandleImpl } from './model';
import { SModelElementImpl } from '../../base/model/smodel';
import { EdgeRouterRegistry, RoutedPoint } from './routing';
import { AbstractEdgeRouter, LinearRouteOptions } from './abstract-edge-router';
import { MouseListener } from '../../base/views/mouse-tool';
import { Command, CommandExecutionContext, CommandReturn } from '../../base/commands/command';
import { TYPES } from "../../base/types";
import { SEdgeImpl } from '../../graph/sgraph';

@injectable()
export class BezierEdgeRouter extends AbstractEdgeRouter {

    static readonly KIND = 'bezier';
    static readonly DEFAULT_BEZIER_HANDLE_OFFSET = 25;

    get kind() {
        return BezierEdgeRouter.KIND;
    }

    route(edge: SRoutableElementImpl): RoutedPoint[] {
        if (!edge.source || !edge.target)
            return [];
        const rpCount = edge.routingPoints.length;
        const source = edge.source;
        const target = edge.target;

        const result: RoutedPoint[] = [];
        result.push({ kind: 'source', x: 0, y: 0 });
        if (rpCount === 0) {
            // initial values
            const [h1, h2] = this.createDefaultBezierHandles(source.position, target.position);
            result.push( { kind: 'bezier-control-after', x: h1.x, y: h1.y, pointIndex: 0 } );
            result.push( { kind: 'bezier-control-before', x: h2.x, y: h2.y, pointIndex: 1 } );
            edge.routingPoints.push(h1);
            edge.routingPoints.push(h2);
        } else if (rpCount >= 2) {
            for (let i = 0; i < rpCount; i++) {
                const p = edge.routingPoints[i];
                if (i % 3 === 0) {
                    result.push({ kind: 'bezier-control-after', x: p.x, y: p.y, pointIndex: i });
                }
                if ((i + 1) % 3 === 0) {
                    result.push({ kind: 'bezier-junction', x: p.x, y: p.y, pointIndex: i });
                } else if ((i + 2) % 3 === 0) {
                    result.push({ kind: 'bezier-control-before', x: p.x, y: p.y, pointIndex: i });
                }
            }
        }
        result.push({ kind: 'target', x: 0, y: 0 });

        // use "ends" of edge as reference or next bezier-junction
        const p0 = rpCount > 2 ? edge.routingPoints[2] : target.position;
        const pn = rpCount > 2 ? edge.routingPoints[edge.routingPoints.length - 3] : source.position;

        const sourceAnchor = this.getTranslatedAnchor(source, p0, target.parent, edge, edge.sourceAnchorCorrection);
        const targetAnchor = this.getTranslatedAnchor(target, pn, source.parent, edge, edge.targetAnchorCorrection);

        result[0] = { kind: 'source', x: sourceAnchor.x, y: sourceAnchor.y };
        result[result.length - 1] = { kind: 'target', x: targetAnchor.x, y: targetAnchor.y };

        return result;
    }

    private createDefaultBezierHandles(relH1: Point, relH2: Point): [Point, Point] {
        const h1 = {
            x: relH1.x - BezierEdgeRouter.DEFAULT_BEZIER_HANDLE_OFFSET,
            y: relH1.y
        };
        const h2 = {
            x: relH2.x + BezierEdgeRouter.DEFAULT_BEZIER_HANDLE_OFFSET,
            y: relH2.y
        };
        return [ h1, h2 ];
    }

    createRoutingHandles(edge: SRoutableElementImpl): void {
        // route ensure there are at least 2 routed points
        this.route(edge);

        this.rebuildHandles(edge);
    }

    private rebuildHandles(edge: SRoutableElementImpl) {
        this.addHandle(edge, 'source', 'routing-point', -2);
        this.addHandle(edge, 'bezier-control-after', 'bezier-routing-point', 0);
        this.addHandle(edge, 'bezier-add', 'bezier-create-routing-point', 0);
        const rpCount = edge.routingPoints.length;

        if (rpCount > 2) {
            for (let i = 1; i < rpCount - 1; i += 3) {
                this.addHandle(edge, 'bezier-control-before', 'bezier-routing-point', i);
                // Add two circle for add/remove segments
                this.addHandle(edge, 'bezier-add', 'bezier-create-routing-point', i + 1);
                this.addHandle(edge, 'bezier-junction', 'routing-point', i + 1);
                this.addHandle(edge, 'bezier-remove', 'bezier-remove-routing-point', i + 1);
                this.addHandle(edge, 'bezier-control-after', 'bezier-routing-point', i + 2);

                // re-position control-pairs
                this.moveBezierControlPair(edge.routingPoints[i], i, edge);
            }
        }
        this.addHandle(edge, 'bezier-control-before', 'bezier-routing-point', rpCount - 1);
        this.addHandle(edge, 'target', 'routing-point', -1);
    }

    getInnerHandlePosition(edge: SRoutableElementImpl, route: RoutedPoint[], handle: SRoutingHandleImpl) {
       if (handle.kind === 'bezier-control-before' || handle.kind === 'bezier-junction' || handle.kind === 'bezier-control-after') {
            for (let i = 0; i < route.length; i++) {
                const p = route[i];
                if (p.pointIndex === handle.pointIndex && p.kind === handle.kind)
                    return p;
            }
        } else if (handle.kind === 'bezier-add') {
            const ctrlPoint = this.findBezierControl(edge, route, handle.pointIndex);
            return { x: ctrlPoint.x, y: ctrlPoint.y + 12.5};
        } else if (handle.kind === 'bezier-remove') {
            const ctrlPoint = this.findBezierControl(edge, route, handle.pointIndex);
            return { x: ctrlPoint.x, y: ctrlPoint.y - 12.5};
        }
        return undefined;
    }

    protected findBezierControl(edge: SRoutableElementImpl, route: RoutedPoint[], handleIndex: number): Point {
        let result: Point = { x: route[0].x, y: route[0].y };
        if (handleIndex > 0) {
            for (const rp of route) {
                if (rp.pointIndex !== undefined && rp.pointIndex === handleIndex && rp.kind === 'bezier-junction') {
                    result = { x: rp.x, y: rp.y };
                    break;
                }
            }
        }
        return result;
    }

    override applyHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void {
        moves.forEach(move => {
            const handle = move.handle;
            let orgPosition = { x: 0, y: 0 };
            let relativePos, newControlPos, ctrlPointIndex;
            const moveToPos = move.toPosition;

            switch (handle.kind) {
                case 'bezier-control-before':
                case 'bezier-control-after':
                    // find potential other handle/rp and move
                    this.moveBezierControlPair(moveToPos, move.handle.pointIndex, edge);
                    break;
                case 'bezier-junction':
                    const index = handle.pointIndex;
                    if (index >= 0 && index < edge.routingPoints.length) {
                        ctrlPointIndex = index - 1;
                        orgPosition = edge.routingPoints[index];
                        relativePos = edge.routingPoints[ctrlPointIndex];
                        newControlPos = this.calcRelativeMove(orgPosition, moveToPos, relativePos);
                        edge.routingPoints[index] = moveToPos;
                        this.moveBezierControlPair(newControlPos, ctrlPointIndex, edge);
                    }
                    break;
                case 'source':
                    ctrlPointIndex = 0;
                    relativePos = edge.routingPoints[ctrlPointIndex];

                    if (!(edge.source instanceof SDanglingAnchorImpl)) {
                        // detach source
                        const anchor = new SDanglingAnchorImpl();
                        anchor.id = edge.id + '_dangling-source';
                        anchor.original = edge.source;
                        anchor.position = move.toPosition;
                        handle.root.add(anchor);
                        handle.danglingAnchor = anchor;
                        edge.sourceId = anchor.id;
                        if (edge.source) orgPosition = edge.source.position;
                    } else if (handle.danglingAnchor) {
                        orgPosition = handle.danglingAnchor.position;
                        handle.danglingAnchor.position = moveToPos;
                    }
                    newControlPos = this.calcRelativeMove(orgPosition, moveToPos, relativePos);
                    this.moveBezierControlPair(newControlPos, ctrlPointIndex, edge);
                    break;
                case 'target':
                    ctrlPointIndex = edge.routingPoints.length - 1;
                    relativePos = edge.routingPoints[ctrlPointIndex];

                    if (!(edge.target instanceof SDanglingAnchorImpl)) {
                        // detach target
                        const anchor = new SDanglingAnchorImpl();
                        anchor.id = edge.id + '_dangling-target';
                        anchor.original = edge.target;
                        anchor.position = moveToPos;
                        handle.root.add(anchor);
                        handle.danglingAnchor = anchor;
                        edge.targetId = anchor.id;
                        if (edge.target) orgPosition = edge.target.position;
                    } else if (handle.danglingAnchor) {
                        orgPosition = handle.danglingAnchor.position;
                        handle.danglingAnchor.position = moveToPos;
                    }
                    newControlPos = this.calcRelativeMove(orgPosition, moveToPos, relativePos);
                    this.moveBezierControlPair(newControlPos, ctrlPointIndex, edge);
                    break;
                default:
                    break;
            }
        });
    }

    protected applyInnerHandleMoves(edge: SRoutableElementImpl, moves: ResolvedHandleMove[]): void {
        // not required
    }

    protected getOptions(edge: SRoutableElementImpl): LinearRouteOptions {
        return  {
            minimalPointDistance: 2,
            standardDistance: 0.1,
            selfEdgeOffset: 20
        };
    }

    private calcRelativeMove(oldPos: Point, newPos: Point, relativePoint: Point): Point {
        return {
            x: relativePoint.x - (oldPos.x - newPos.x),
            y: relativePoint.y - (oldPos.y - newPos.y)
        };
    }

    public createNewBezierSegment(index: number, edge: SRoutableElementImpl): void {
        const routingPoints = edge.routingPoints;

        let bezierJunctionPos, start, end: Point;
        if (routingPoints.length === 2) {
            start = routingPoints[index < 0 ? 0 : index];
            end = routingPoints[routingPoints.length - 1];
            bezierJunctionPos = centerOfLine(start, end);
        } else {
            start = routingPoints[index];
            end = routingPoints[index + 2];
            bezierJunctionPos = centerOfLine(start, end);
        }
        const [h1, h2] = this.createDefaultBezierHandles(bezierJunctionPos, bezierJunctionPos);

        routingPoints.splice(index + 1, 0, h1);
        routingPoints.splice(index + 2, 0, bezierJunctionPos);
        routingPoints.splice(index + 3, 0, h2);
        // ensure handles are correctly positioned
        this.moveBezierControlPair(h1, index + 1, edge);

        // simple solution for now: just rebuildHandles
        edge.removeAll(c => c instanceof SRoutingHandleImpl);
        this.rebuildHandles(edge);
    }

    public removeBezierSegment(index: number, edge: SRoutableElementImpl): void {
        const routingPoints = edge.routingPoints;

        routingPoints.splice(index - 1, 3);

        // simple solution for now: just rebuildHandles
        edge.removeAll(c => c instanceof SRoutingHandleImpl);
        this.rebuildHandles(edge);
    }

    private moveBezierControlPair(newPos: Point, ctrlPointIndex: number, edge: SRoutableElementImpl) {
        if (ctrlPointIndex >= 0 && ctrlPointIndex < edge.routingPoints.length) {
            // find neighbors
            const before = ctrlPointIndex - 1;
            const after = ctrlPointIndex + 1;

            // this is the first control or the last control => nothing to do further
            if (before < 0 || after === edge.routingPoints.length) {
                edge.routingPoints[ctrlPointIndex] = newPos;
            } else  {
                // behind bezier-junction
                if (ctrlPointIndex % 3 === 0) {
                    this.setBezierMirror(edge, newPos, ctrlPointIndex, false);
                // before bezier-junction
                } else if ((ctrlPointIndex + 2) % 3 === 0) {
                    this.setBezierMirror(edge, newPos, ctrlPointIndex, true);
                }
            }
        }
    }

    private setBezierMirror(edge: SRoutableElementImpl, newPos: Point, pointIndex: number, before: boolean) {
        edge.routingPoints[pointIndex] = newPos;
        const jct = edge.routingPoints[before ? (pointIndex + 1) : (pointIndex - 1)];
        edge.routingPoints[before ? (pointIndex + 2) : (pointIndex - 2)] = {
            x: jct.x - (newPos.x - jct.x),
            y: jct.y - (newPos.y - jct.y)
        };
    }

}

/**
 * Reacts on mouseDown events if the target kind is bezier-add or bezier-remove
 */
export class BezierMouseListener extends MouseListener {

    override mouseDown(target: SModelElementImpl, event: MouseEvent): Action[] {
        const result = [];
        if (target instanceof SRoutingHandleImpl && (target.kind === 'bezier-add' || target.kind === 'bezier-remove')) {
            if (target.type === 'bezier-create-routing-point') {
                result.push(AddRemoveBezierSegmentAction.create('add', target.id));
            } else if (target.type === 'bezier-remove-routing-point') {
                result.push(AddRemoveBezierSegmentAction.create('remove', target.id));
            }
        }
        return result;
    }
};

export interface AddRemoveBezierSegmentAction extends Action {
    kind: typeof AddRemoveBezierSegmentAction.KIND
    targetId: string
    actionTask: 'add' | 'remove'
}

export namespace AddRemoveBezierSegmentAction {
    export const KIND = 'addRemoveBezierSegment';
    export function create(actionTask: 'add' | 'remove', targetId: string): AddRemoveBezierSegmentAction {
        return {
            kind: KIND,
            actionTask,
            targetId
        };
    }
}

@injectable()
export class AddRemoveBezierSegmentCommand extends Command {
    static readonly KIND = AddRemoveBezierSegmentAction.KIND;

    constructor(@inject(TYPES.Action) protected readonly action: AddRemoveBezierSegmentAction,
        @inject(EdgeRouterRegistry) protected readonly edgeRouterRegistry?: EdgeRouterRegistry) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        const target = index.getById(this.action.targetId);

        if (this.edgeRouterRegistry && target instanceof SRoutingHandleImpl) {
            const raw = this.edgeRouterRegistry.get((target.parent as SRoutableElementImpl).routerKind);
            if (raw instanceof BezierEdgeRouter) {
                const router = raw;

                for (const child of context.root.children) {
                    if (child.id === target.parent.id) {
                        if (this.action.actionTask === 'add') {
                            router.createNewBezierSegment(target.pointIndex, child as SEdgeImpl);
                        } else if (this.action.actionTask === 'remove') {
                            router.removeBezierSegment(target.pointIndex, child as SEdgeImpl);
                        }
                        break;
                    }
                }
            }
        }

        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        throw new Error('Method not implemented.');
    }

    redo(context: CommandExecutionContext): CommandReturn {
        throw new Error('Method not implemented.');
    }
}
