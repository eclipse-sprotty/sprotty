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
import { SLabelImpl, svg } from 'sprotty';

import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { IViewArgs, RenderingContext, SShapeElementImpl, ShapeView } from "sprotty";

@injectable()
export class ExampleNodeView extends ShapeView {
    override render(node: Readonly<SShapeElementImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <SVGRectComponent
                name='I am a header created by a jsx function component' colour='#BBB'
                position={{ x: 0, y: 0 }} size={{ width: node.size.width, height: 20 }} />
            {SVGRectComponent({
                colour: '#999',
                position: { x: 0, y: node.size.height - 20 }, size: { width: node.size.width, height: 20 }
            })}
            <rect
                x="0"
                y="0"
                fill="none"
                stroke="#000"
                stroke-width="5"
                width={node.size.width}
                height={node.size.height}></rect>
            {context.renderChildren(node)}
        </g>;
    }
}

export class ExampleLabelView extends ShapeView {
    override render(node: Readonly<SLabelImpl>, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        return <text x={node.position.x - (node.size.width / 2)} y={node.position.y}>{node.text}</text>;
    }
}

interface TestProps {
    name?: string;
    colour: string;
    position: { x: number, y: number };
    size?: { width: number, height: number };
}

function SVGRectComponent(props: TestProps) {
    return <g>
        <rect fill={props.colour} x={props.position.x} y={props.position.y} width={props.size?.width ?? 30} height={props.size?.height ?? 30} />
        {props.name ? <text font-size="12" x={props.position.x + 5} y={props.position.y + 15}>{props.name}</text> : ''}
    </g>;
}
