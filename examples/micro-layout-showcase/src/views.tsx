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
import { InteractiveCardNode } from './model';

/**
 * Custom view for the interactive card that shows layout effects.
 * Renders a card-like structure with rounded corners and shadow.
 */
@injectable()
export class InteractiveCardView extends ShapeView {
    render(node: InteractiveCardNode, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <rect
                class-sprotty-node={true}
                class-interactive-card={true}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
                rx="8"
                ry="8"
            />
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * View for demonstration cards that show different layout types.
 */
@injectable()
export class DemoCardView extends ShapeView {
    render(node: any, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        return <g>
            <rect
                class-sprotty-node={true}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
                rx="6"
                ry="6"
            />
            {context.renderChildren(node)}
        </g>;
    }
}

/**
 * View for small component elements (icons, buttons, etc.)
 */
@injectable()
export class ComponentView extends ShapeView {
    render(node: any, context: RenderingContext): VNode | undefined {
        if (!this.isVisible(node, context)) {
            return undefined;
        }

        const componentType = node.componentType || 'default';

        return <g>
            <rect
                class-sprotty-node={true}
                class-component={true}
                class-component-type={componentType === 'icon'}
                class-component-button={componentType === 'button'}
                class-component-metric={componentType === 'metric'}
                x="0"
                y="0"
                width={node.size.width}
                height={node.size.height}
                rx="3"
                ry="3"
            />
            {context.renderChildren(node)}
        </g>;
    }
}
