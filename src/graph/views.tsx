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

 /** @jsx svg */
import { svg } from 'snabbdom-jsx';

import { VNode } from "snabbdom/vnode";
import { Point, centerOfLine, maxDistance } from '../utils/geometry';
import { setAttr } from '../base/views/vnode-utils';
import { RenderingContext, IView } from "../base/views/view";
import { getSubType } from "../base/model/smodel-utils";
import { SRoutingHandle, isRoutable } from '../features/edit/model';
import { SCompartment, SEdge, SGraph, SLabel } from "./sgraph";
import { RoutedPoint } from './routing';

/**
 * IView component that turns an SGraph element and its children into a tree of virtual DOM elements.
 */
export class SGraphView implements IView {

    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;
        return <svg class-sprotty-graph={true}>
            <g transform={transform}>
                {context.renderChildren(model)}
            </g>
        </svg>;
    }
}

export class PolylineEdgeView implements IView {

    render(edge: Readonly<SEdge>, context: RenderingContext): VNode {
        const route = edge.route();
        if (route.length === 0)
            return this.renderDanglingEdge("Cannot compute route", edge, context);

        return <g class-sprotty-edge={true} class-mouseover={edge.hoverFeedback}>
            {this.renderLine(edge, route, context)}
            {this.renderAdditionals(edge, route, context)}
            {context.renderChildren(edge, { route })}
        </g>;
    }

    protected renderLine(edge: SEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }
        return <path d={path}/>;
    }

    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        return [];
    }

    protected renderDanglingEdge(message: string, edge: SEdge, context: RenderingContext): VNode {
        return <text class-sprotty-edge-dangling={true} title={message}>?</text>;
    }
}

export class SRoutingHandleView implements IView {
    minimalPointDistance: number = 10;

    render(handle: Readonly<SRoutingHandle>, context: RenderingContext, args?: { route?: RoutedPoint[] }): VNode {
        if (args && args.route) {
            const position = this.getPosition(handle, args.route);
            if (position !== undefined) {
                const node = <circle class-sprotty-routing-handle={true}
                        class-selected={handle.selected} class-mouseover={handle.hoverFeedback}
                        cx={position.x} cy={position.y}/>;   // Radius must be specified via CSS
                setAttr(node, 'data-kind', handle.kind);
                return node;
            }
        }
        // Fallback: Create an empty group
        return <g/>;
    }

    protected getPosition(handle: SRoutingHandle, route: RoutedPoint[]): Point | undefined {
        if (handle.kind === 'line') {
            return this.getLinePosition(handle, route);
        } else {
            return this.getJunctionPosition(handle, route);
        }
    }

    protected getJunctionPosition(handle: SRoutingHandle, route: RoutedPoint[]): Point | undefined {
        return route.find(rp => rp.pointIndex === handle.pointIndex);
    }

    protected getLinePosition(handle: SRoutingHandle, route: RoutedPoint[]): Point | undefined {
        const parent = handle.parent;
        if (isRoutable(parent)) {
            const getIndex = (rp: RoutedPoint) => {
                if (rp.pointIndex !== undefined)
                    return rp.pointIndex;
                else if (rp.kind === 'target')
                    return parent.routingPoints.length;
                else
                    return -1;
            };
            let rp1, rp2: RoutedPoint | undefined;
            for (const rp of route) {
                const i = getIndex(rp);
                if (i <= handle.pointIndex && (rp1 === undefined || i > getIndex(rp1)))
                    rp1 = rp;
                if (i > handle.pointIndex && (rp2 === undefined || i < getIndex(rp2)))
                    rp2 = rp;
            }
            if (rp1 !== undefined && rp2 !== undefined) {
                // Skip this handle if its related line segment is not included in the route
                if (getIndex(rp1) !== handle.pointIndex && handle.pointIndex >= 0) {
                    const point = parent.routingPoints[handle.pointIndex];
                    if (maxDistance(point, rp1) >= maxDistance(point, rp2))
                        return undefined;
                }
                if (getIndex(rp2) !== handle.pointIndex + 1 && handle.pointIndex + 1 < parent.routingPoints.length) {
                    const point = parent.routingPoints[handle.pointIndex + 1];
                    if (maxDistance(point, rp1) < maxDistance(point, rp2))
                        return undefined;
                }
                // Skip this handle if its related line segment is too short
                if (maxDistance(rp1, rp2) >= this.minimalPointDistance)
                    return centerOfLine(rp1, rp2);
            }
        }
        return undefined;
    }
}

export class SLabelView implements IView {
    render(label: Readonly<SLabel>, context: RenderingContext): VNode {
        const vnode = <text class-sprotty-label={true}>{label.text}</text>;
        const subType = getSubType(label);
        if (subType)
            setAttr(vnode, 'class', subType);
        return vnode;
    }
}

export class SCompartmentView implements IView {
    render(model: Readonly<SCompartment>, context: RenderingContext): VNode {
        const translate = `translate(${model.bounds.x}, ${model.bounds.y})`;
        const vnode = <g transform={translate} class-sprotty-comp="{true}">
            {context.renderChildren(model)}
        </g>;
        const subType = getSubType(model);
        if (subType)
            setAttr(vnode, 'class', subType);
        return vnode;
    }
}
