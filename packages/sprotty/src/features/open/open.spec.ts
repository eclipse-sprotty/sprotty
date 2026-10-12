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

import { OpenAction } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { SLabelImpl, SNodeImpl } from '../../graph/sgraph.js';
import { openFeature } from './model.js';
import { OpenMouseListener } from './open.js';

class OpenableNode extends SNodeImpl {
    override hasFeature(feature: symbol): boolean {
        return feature === openFeature;
    }
}

describe('OpenMouseListener', () => {
    const root = new SModelRootImpl();
    const node = new OpenableNode();
    node.id = 'node';
    root.add(node);
    const label = new SLabelImpl();
    label.id = 'label';
    node.add(label);
    const plainNode = new SNodeImpl();
    plainNode.id = 'plain';
    root.add(plainNode);
    const listener = new OpenMouseListener();
    const event = {} as MouseEvent;

    it('opens a double-clicked openable element', () => {
        expect(listener.doubleClick(node, event)).toEqual([OpenAction.create('node')]);
    });

    it('opens the closest openable ancestor of a double-clicked child', () => {
        expect(listener.doubleClick(label, event)).toEqual([OpenAction.create('node')]);
    });

    it('does nothing without an openable ancestor', () => {
        expect(listener.doubleClick(plainNode, event)).toEqual([]);
    });
});
