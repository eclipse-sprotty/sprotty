/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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
import { PolylineEdgeView, SEdgeImpl, SLabelImpl, isEdgeLayoutable, setAttr, svg } from 'sprotty';

import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { IViewArgs, RenderingContext, SShapeElementImpl, ShapeView } from "sprotty";
import { Hoverable, Point, Selectable, getSubType, toDegrees } from "sprotty-protocol";

@injectable()
export class TerminalNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <rect class-sprotty-node={true} class-terminal={true} class-mouseover={node.hoverFeedback} class-selected={node.selected}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
                rx="2%"></rect>
            {/* <text>{label.text}</text> */}
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class ProcessNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <rect class-sprotty-node={true} class-process={true} class-mouseover={node.hoverFeedback} class-selected={node.selected}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}></rect>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DecisionNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        const width = node.size.width;
        const height = node.size.height;

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <polygon class-sprotty-node={true} class-decision={true} class-mouseover={node.hoverFeedback} class-selected={node.selected}
                points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
            ></polygon>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class EdgeLabel extends ShapeView {
    override render(label: Readonly<SLabelImpl>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!isEdgeLayoutable(label) && !this.isVisible(label, context)) {
            return undefined;
        }
        const vnode = <text class-sprotty-label={true} text-anchor='middle'>{label.text}</text>;
        const subType = getSubType(label);
        if (subType) {
            setAttr(vnode, 'class', subType);
        }

        return <g>
            <rect x={-label.size.width / 2 - 2} y={-label.size.height + 5} width={label.size.width + 4} height={label.size.height} class-edge-label-background={true}></rect>
            {vnode}
        </g>;
    }
}

@injectable()
export class EdgeWithArrow extends PolylineEdgeView {

    protected override renderAdditionals(edge: SEdgeImpl, segments: Point[], context: RenderingContext): VNode[] {
        const p1 = segments[segments.length - 1];
        const p2 = segments[segments.length - 2];

        return [
            <path class-arrowhead={true}
                d="M 10, -5 L 0, 0 L 10, 5 z"
                transform={`rotate(${this.angle(p1,p2)} ${p1.x} ${p1.y}) translate(${p1.x} ${p1.y})`}
            ></path>
        ];
    }

    angle(x0: Point, x1: Point): number {
        return toDegrees(Math.atan2(x1.y - x0.y, x1.x - x0.x));
    }
}
