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
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { IViewArgs, PolylineEdgeView, RenderingContext, SEdgeImpl, SLabelImpl, SShapeElementImpl, ShapeView, isEdgeLayoutable, setAttr, svg } from "sprotty";
import { Hoverable, Point, Selectable, getSubType, toDegrees } from "sprotty-protocol";

@injectable()
export class TerminalNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M${node.size.height / 2} 0
        A${node.size.height / 2} ${node.size.height / 2} 0 0 0 ${node.size.height / 2} ${node.size.height}
        H${node.size.width - node.size.height / 2}
        A${node.size.height / 2} ${node.size.height / 2} 0 0 0 ${node.size.width - node.size.height / 2} 0
        Z`;

        return <g>
            <path
                class-sprotty-node={true}
                class-terminal={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class ProcessNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <rect
                class-sprotty-node={true}
                class-process={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
            ></rect>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DecisionNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M${node.size.width / 2} 0
        L${node.size.width} ${node.size.height / 2}
        L${node.size.width / 2} ${node.size.height}
        L0 ${node.size.height / 2}
        Z`;

        return <g>
            <path
                class-sprotty-node={true}
                class-decision={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class InputOutputNodeView extends ShapeView {
    protected offset = 10;
    protected skew = -10;
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const transform = `skewX(${this.skew})`;

        return <g>
            <rect
                class-sprotty-node={true}
                class-input={node.type === 'node:input'}
                class-output={node.type === 'node:output'}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                x={0}
                y={0}
                width={node.size.width}
                height={node.size.height}
                transform={transform}
            ></rect>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class CommentNodeView extends ShapeView {
    protected offset = 10;
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M0 ${node.size.height / 2}
        H${this.offset}
        M${this.offset * 2} 0
        H${this.offset}
        V${node.size.height}
        H${this.offset * 2}
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-comment={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class PredefinedProcessNodeView extends ShapeView {
    protected sideWidth = 20;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M0 0
        H${node.size.width}
        V${node.size.height}
        H0
        V0
        M${this.sideWidth} 0
        V${node.size.height}
        M${node.size.width - this.sideWidth} 0
        V${node.size.height}
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-predefined-process={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class OnPageConnectorNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <circle
                class-sprotty-node={true}
                class-on-page-connector={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                cx={node.size.width / 2}
                cy={node.size.height / 2}
                r={node.size.width / 2}
            ></circle>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class OffPageConnectorNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M0 0
        H${node.size.width}
        V${node.size.height / 2}
        L${node.size.width / 2} ${node.size.height}
        L0 ${node.size.height / 2}
        Z`;

        return <g>
            <path
                class-sprotty-node={true}
                class-off-page-connector={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DelayNodeView extends ShapeView {
    protected radius = 10;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M${this.radius} 0
        H${node.size.width - node.size.height / 2}
        A${node.size.height / 2} ${node.size.height / 2} 0 0 1 ${node.size.width - node.size.height / 2} ${node.size.height}
        H${this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${0} ${node.size.height - this.radius}
        V${this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${this.radius} 0
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-delay={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class AlternateProcessNodeView extends ShapeView {
    protected radius = 10;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }
        const path = `
        M${this.radius} 0
        H${node.size.width - this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${node.size.width} ${this.radius}
        V${node.size.height - this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${node.size.width - this.radius} ${node.size.height}
        H${this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${0} ${node.size.height - this.radius}
        V${this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${this.radius} 0
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-alternate-process={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DataNodeView extends ShapeView {
    protected radius = 10;
    protected skew = -10;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M${this.radius} 0
        H${node.size.width - this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${node.size.width} ${this.radius}
        V${node.size.height - this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${node.size.width - this.radius} ${node.size.height}
        H${this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${0} ${node.size.height - this.radius}
        V${this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${this.radius} 0
        `;

        const transform = `skewX(${this.skew})`;

        return <g>
            <path
                class-sprotty-node={true}
                class-data={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
                transform={transform}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DocumentNodeView extends ShapeView {
    protected curvature = 30;
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M0 0
        H${node.size.width}
        V${node.size.height}
        C ${node.size.width / 2} ${node.size.height - this.curvature}, ${node.size.width / 2} ${node.size.height + this.curvature}, 0 ${node.size.height}
        Z
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-document={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class MultiDocumentNodeView extends ShapeView {
    protected curvature = 30;
    protected radius = 10;
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M ${this.radius} 0
        H${node.size.width - this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${node.size.width} ${this.radius}
        V${node.size.height}
        C ${node.size.width / 2} ${node.size.height - this.curvature}, ${node.size.width / 2} ${node.size.height + this.curvature}, 0 ${node.size.height}
        V${this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${this.radius} 0
        M${this.radius} 0
        A${this.radius} ${this.radius} 0 0 1 ${this.radius * 2} ${-this.radius}
        H${node.size.width}
        A${this.radius} ${this.radius} 0 0 1 ${node.size.width + this.radius} ${0}
        V${node.size.height - this.radius}
        L${node.size.width} ${node.size.height - this.radius * 1.3}
        M${this.radius * 2} ${-this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${this.radius * 3} ${-this.radius * 2}
        H${node.size.width + this.radius}
        A${this.radius} ${this.radius} 0 0 1 ${node.size.width + this.radius * 2} ${-this.radius}
        V${node.size.height - this.radius * 2}
        L${node.size.width + this.radius} ${node.size.height - this.radius * 2.3}
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-multi-document={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class PreparationNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M0 ${node.size.height / 2}
        L${node.size.height / 2} 0
        H${node.size.width - node.size.height / 2}
        L${node.size.width} ${node.size.height / 2}
        L${node.size.width - node.size.height / 2} ${node.size.height}
        H${node.size.height / 2}
        L0 ${node.size.height / 2}
        Z
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-preparation={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DisplayNodeView extends ShapeView {
    protected offset = 50;
    protected radius = 25;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M0 ${node.size.height / 2}
        C ${this.offset * 0.4} ${node.size.height / 2 * 0.3}, ${this.offset * 0.4} ${node.size.height / 2 * 0.2}, ${this.offset} 0
        H${node.size.width - this.radius}
        A${this.radius} ${node.size.height / 2} 0 0 1 ${node.size.width - this.radius} ${node.size.height}
        H${this.offset}
        C ${this.offset * 0.4} ${node.size.height / 2 + node.size.height / 2 * 0.8},
        ${this.offset * 0.4} ${node.size.height / 2 + node.size.height / 2 * 0.6}, 0 ${node.size.height / 2}
        Z
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-display={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class ManualInputNodeView extends ShapeView {
    protected offset = 30;
    protected radius = 10;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M ${this.radius} 0
        L ${node.size.width - this.radius} ${-this.offset}
        A ${this.radius} ${this.radius} 0 0 1 ${node.size.width} ${-this.offset + this.radius}
        V ${node.size.height - this.radius}
        A ${this.radius} ${this.radius} 0 0 1 ${node.size.width - this.radius} ${node.size.height}
        H ${this.radius}
        A ${this.radius} ${this.radius} 0 0 1 0 ${node.size.height - this.radius}
        V ${this.radius}
        A ${this.radius} ${this.radius} 0 0 1 ${this.radius} 0
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-manual-input={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class ManualOperationNodeView extends ShapeView {
    protected offset = 15;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M 0 0
        H ${node.size.width}
        L ${node.size.width - this.offset} ${node.size.height}
        H ${this.offset}
        Z
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-manual-operation={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DatabaseNodeView extends ShapeView {
    protected radius = 10;

    override render(node: Readonly<SShapeElementImpl & Hoverable & Selectable>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {

        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const path = `
        M 0 0
        A${node.size.width / 2} ${this.radius} 0 0 0 ${node.size.width} 0
        A${node.size.width / 2} ${this.radius} 0 0 0 0 0
        V${node.size.height}
        A${node.size.width / 2} ${this.radius} 0 0 0 ${node.size.width} ${node.size.height}
        V0
        `;

        return <g>
            <path
                class-sprotty-node={true}
                class-database={true}
                class-mouseover={node.hoverFeedback}
                class-selected={node.selected}
                d={path}
            ></path>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class EdgeLabelView extends ShapeView {
    override render(label: Readonly<SLabelImpl>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        if (!isEdgeLayoutable(label) && !this.isVisible(label, context)) {
            return undefined;
        }
        const vnode = <text class-sprotty-label={true}>{label.text}</text>;
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
                d="M 10, -5 L 0, 0 L 10, 5 Z"
                transform={`rotate(${this.angle(p1, p2)} ${p1.x} ${p1.y}) translate(${p1.x} ${p1.y})`}
            ></path>
        ];
    }

    angle(x0: Point, x1: Point): number {
        return toDegrees(Math.atan2(x1.y - x0.y, x1.x - x0.x));
    }
}
