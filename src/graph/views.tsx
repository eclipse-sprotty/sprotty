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
import { inject, injectable } from 'inversify';
import { svg } from 'snabbdom-jsx';
import { VNode } from "snabbdom/vnode";
import { getSubType } from "../base/model/smodel-utils";
import { IView, RenderingContext } from "../base/views/view";
import { setAttr } from '../base/views/vnode-utils';
import { SRoutingHandle } from '../features/routing/model';
import { SRoutableElement } from '../features/routing/model';
import { EdgeRouterRegistry, RoutedPoint } from '../features/routing/routing';
import { Point } from '../utils/geometry';
import { SCompartment, SEdge, SGraph, SLabel } from "./sgraph";


/**
 * IView component that turns an SGraph element and its children into a tree of virtual DOM elements.
 */
@injectable()
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

@injectable()
export class PolylineEdgeView implements IView {

    @inject(EdgeRouterRegistry) edgeRouterRegistry: EdgeRouterRegistry;

    render(edge: Readonly<SEdge>, context: RenderingContext): VNode {
        const router = this.edgeRouterRegistry.get(edge.routerKind);
        const route = router.route(edge);
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

@injectable()
export class SRoutingHandleView implements IView {

    @inject(EdgeRouterRegistry) edgeRouterRegistry: EdgeRouterRegistry;

    minimalPointDistance: number = 10;

    render(handle: Readonly<SRoutingHandle>, context: RenderingContext, args?: { route?: RoutedPoint[] }): VNode {
        if (args && args.route) {
            if (handle.parent instanceof SRoutableElement) {
                const router = this.edgeRouterRegistry.get(handle.parent.routerKind);
                const theRoute = args.route === undefined ? router.route(handle.parent) : args.route;
                const position = router.getHandlePosition(handle.parent, theRoute, handle);
                if (position !== undefined) {
                    const node = <circle class-sprotty-routing-handle={true}
                            class-selected={handle.selected} class-mouseover={handle.hoverFeedback}
                            cx={position.x} cy={position.y} r={this.getRadius()}/>;
                    setAttr(node, 'data-kind', handle.kind);
                    return node;
                }
            }
        }
        // Fallback: Create an empty group
        return <g/>;
    }

    getRadius(): number {
        return 7;
    }
}

@injectable()
export class SLabelView implements IView {
    render(label: Readonly<SLabel>, context: RenderingContext): VNode {
        const vnode = <text class-sprotty-label={true}>{label.text}</text>;
        const subType = getSubType(label);
        if (subType)
            setAttr(vnode, 'class', subType);
        return vnode;
    }
}

@injectable()
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
