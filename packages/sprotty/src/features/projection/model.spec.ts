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

import { Bounds, Projectable } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { SNodeImpl } from '../../graph/sgraph.js';
import { ViewportRootElementImpl } from '../viewport/viewport-root.js';
import { getModelBounds, getProjections } from './model.js';

class ProjectableNode extends SNodeImpl implements Projectable {
    projectionCssClasses: string[] = [];
    projectedBounds?: Bounds;
}

function createModel() {
    const root = new ViewportRootElementImpl();
    root.id = 'root';
    root.canvasBounds = { x: 0, y: 0, width: 100, height: 100 };
    const outer = new ProjectableNode();
    outer.id = 'outer';
    outer.bounds = { x: 10, y: 20, width: 100, height: 50 };
    outer.projectionCssClasses = ['outer'];
    root.add(outer);
    const inner = new ProjectableNode();
    inner.id = 'inner';
    inner.bounds = { x: 5, y: 5, width: 10, height: 10 };
    inner.projectionCssClasses = ['inner', 'nested'];
    outer.add(inner);
    const unclassed = new ProjectableNode();
    unclassed.id = 'unclassed';
    unclassed.bounds = { x: 0, y: 0, width: 10, height: 10 };
    root.add(unclassed);
    const plain = new SNodeImpl();
    plain.id = 'plain';
    plain.bounds = { x: 200, y: 200, width: 10, height: 10 };
    root.add(plain);
    return { root, inner };
}

describe('getProjections', () => {
    it('collects projectable elements with CSS classes, nested ones in root coordinates', () => {
        const { root } = createModel();
        expect(getProjections(root)).toEqual([
            { elementId: 'outer', projectedBounds: { x: 10, y: 20, width: 100, height: 50 }, cssClasses: ['outer'] },
            { elementId: 'inner', projectedBounds: { x: 15, y: 25, width: 10, height: 10 }, cssClasses: ['inner', 'nested'] }
        ]);
    });

    it('prefers explicitly projected bounds over the element bounds', () => {
        const { root, inner } = createModel();
        inner.projectedBounds = { x: 1, y: 1, width: 2, height: 2 };
        expect(getProjections(root)![1].projectedBounds).toEqual({ x: 11, y: 21, width: 2, height: 2 });
    });

    it('returns undefined when nothing is projectable', () => {
        const root = new ViewportRootElementImpl();
        const plain = new SNodeImpl();
        plain.id = 'plain';
        root.add(plain);
        expect(getProjections(root)).toBeUndefined();
    });
});

describe('getModelBounds', () => {
    it('uses the bounds of the root when they are valid', () => {
        const { root } = createModel();
        root.bounds = { x: 0, y: 0, width: 200, height: 150 };
        expect(getModelBounds(root)).toEqual({ x: 0, y: 0, width: 200, height: 150 });
    });

    it('enlarges the bounds so that the current viewport always fits', () => {
        const { root } = createModel();
        root.bounds = { x: 0, y: 0, width: 200, height: 150 };
        root.scroll = { x: -50, y: 0 };
        root.zoom = 0.5;
        expect(getModelBounds(root)).toEqual({ x: -50, y: 0, width: 250, height: 200 });
    });

    it('falls back to the union of the top-level children when the root has no valid size', () => {
        const { root } = createModel();
        expect(getModelBounds(root)).toEqual({ x: 0, y: 0, width: 210, height: 210 });
    });
});
