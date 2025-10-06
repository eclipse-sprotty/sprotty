/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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
import { svg } from 'sprotty/lib/lib/jsx';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { RenderingContext, ShapeView } from 'sprotty';
/**
 * Custom view for load monitoring node that demonstrates conditional styling.
 * CSS classes are applied based on the load percentage value.
 */
@injectable()
export class LoadMonitorNodeView extends ShapeView {
    render(node: any, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <rect
                class-sprotty-node={true}
                class-low-load={node.loadPercentage < 30}
                class-medium-load={node.loadPercentage >= 30 && node.loadPercentage < 70}
                class-high-load={node.loadPercentage >= 70}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
                rx="5"
            />
            <text
                class-sprotty-text={true}
                x={node.size.width / 2}
                y={node.size.height / 2 - 5}
                text-anchor="middle"
                dominant-baseline="middle"
            >
                Load Monitor
            </text>
            <text
                class-sprotty-text={true}
                class-load-value={true}
                x={node.size.width / 2}
                y={node.size.height / 2 + 10}
                text-anchor="middle"
                dominant-baseline="middle"
            >
                {node.loadPercentage}%
            </text>
        </g>;
    }
}
