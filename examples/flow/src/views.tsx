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
import { svg } from 'snabbdom-jsx';

import { VNode } from "snabbdom/vnode";
import {
    RenderingContext, SEdge, PolylineEdgeView, CircularNodeView, RectangularNodeView, angleOfPoint, Point, toDegrees,
    RGBColor, toSVG, rgb
} from "../../../src";
import { BarrierNode, TaskNode } from "./flowmodel";

export class TaskNodeView extends CircularNodeView {
    render(node: TaskNode, context: RenderingContext): VNode {
        const radius = this.getRadius(node);
        const fillColor = KernelColor.getSVG(node.kernelNr);
        return <g>
                <circle class-sprotty-node={true}
                fill={fillColor}
                class-task={true} class-mouseover={node.hoverFeedback} class-selected={node.selected}
                        class-running={node.status === 'running'}
                        class-finished={node.status === 'finished'}
                        r={radius} cx={radius} cy={radius}></circle>
                <text x={radius} y={radius + 5} class-text={true}>{node.name}</text>
            </g>;
    }
}

export class BarrierNodeView extends RectangularNodeView {
    render(node: BarrierNode, context: RenderingContext): VNode {
        return <g>
                <rect class-sprotty-node={true} class-barrier={true} class-mouseover={node.hoverFeedback} class-selected={node.selected}
                      x="0" y="0" width={node.bounds.width} height={node.bounds.height}></rect>
                <text x={node.bounds.width / 2} y={node.bounds.height / 2 + 5} class-text={true}>{node.name}</text>
            </g>;

    }
}

export class FlowEdgeView extends PolylineEdgeView {
    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        return [
            <path class-sprotty-edge={true} class-arrow={true} d="M 0,0 L 10,-4 L 10,4 Z"
                  transform={`rotate(${toDegrees(angleOfPoint({ x: p1.x - p2.x, y: p1.y - p2.y }))} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}/>
        ];
    }
}

class KernelColor {
    static colorMap: RGBColor[] = [
        rgb(141, 211, 199), rgb(255, 255, 179), rgb(190, 186, 218), rgb(251, 128, 114),
        rgb(128, 177, 211), rgb(253, 180, 98), rgb(179, 222, 105), rgb(252, 205, 229),
        rgb(217, 217, 217), rgb(188, 128, 189), rgb(204, 235, 197), rgb(255, 237, 111)
    ];

    static getSVG(index: number): string {
        if (index < 0)
            return toSVG({red: 150, green: 150, blue: 150});
        else
            return toSVG(KernelColor.colorMap[index % KernelColor.colorMap.length]);
    }
}
