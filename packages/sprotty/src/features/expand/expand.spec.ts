/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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

import toHTML from 'snabbdom-to-html';
import { CollapseExpandAction, Expandable } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { RenderingContext } from '../../base/views/view.js';
import { SNodeImpl } from '../../graph/sgraph.js';
import { SButtonImpl } from '../button/model.js';
import { ExpandButtonHandler } from './expand.js';
import { expandFeature } from './model.js';
import { ExpandButtonView } from './views.js';

class ExpandableNode extends SNodeImpl implements Expandable {
    expanded = false;

    override hasFeature(feature: symbol): boolean {
        return feature === expandFeature;
    }
}

function createModel() {
    const root = new SModelRootImpl();
    const node = new ExpandableNode();
    node.id = 'node';
    root.add(node);
    const button = new SButtonImpl();
    button.id = 'button';
    node.add(button);
    const plainNode = new SNodeImpl();
    plainNode.id = 'plain';
    root.add(plainNode);
    const plainButton = new SButtonImpl();
    plainButton.id = 'plainButton';
    plainNode.add(plainButton);
    return { node, button, plainButton };
}

describe('ExpandButtonHandler', () => {
    const handler = new ExpandButtonHandler();

    it('expands the collapsed parent of the pressed button', () => {
        const { node, button } = createModel();
        node.expanded = false;
        expect(handler.buttonPressed(button)).toEqual([CollapseExpandAction.create({ expandIds: ['node'], collapseIds: [] })]);
    });

    it('collapses the expanded parent of the pressed button', () => {
        const { node, button } = createModel();
        node.expanded = true;
        expect(handler.buttonPressed(button)).toEqual([CollapseExpandAction.create({ expandIds: [], collapseIds: ['node'] })]);
    });

    it('does nothing for buttons without an expandable ancestor', () => {
        const { plainButton } = createModel();
        expect(handler.buttonPressed(plainButton)).toEqual([]);
    });
});

describe('ExpandButtonView', () => {
    const view = new ExpandButtonView();
    const context = {} as RenderingContext;
    const collapsedArrow = 'M 1,8 L 8,15 L 8,1 Z';
    const expandedArrow = 'M 1,5 L 8,12 L 15,5 Z';

    it('renders the arrow of the expansion state of the parent', () => {
        const { node, button } = createModel();
        node.expanded = false;
        expect(toHTML(view.render(button, context))).toContain(collapsedArrow);
        node.expanded = true;
        expect(toHTML(view.render(button, context))).toContain(expandedArrow);
    });

    it('reflects whether the button is enabled in its CSS classes', () => {
        const { button } = createModel();
        button.enabled = true;
        expect(toHTML(view.render(button, context))).toContain('class="sprotty-button enabled"');
        button.enabled = false;
        expect(toHTML(view.render(button, context))).toContain('class="sprotty-button"');
    });
});
