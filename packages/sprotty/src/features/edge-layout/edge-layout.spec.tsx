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
import { svg } from '../../lib/jsx';

import 'reflect-metadata';
import { expect, describe, it } from 'vitest';
import { VNode } from 'snabbdom';
import { Bounds, Point, toDegrees } from 'sprotty-protocol/lib/utils/geometry';
import { createFeatureSet } from '../../base/model/smodel-factory';
import { SEdgeImpl, SGraphImpl, SLabelImpl } from '../../graph/sgraph';
import { moveFeature } from '../move/model';
import { EdgeLayoutPostprocessor } from './edge-layout';

/**
 * A minimal stand-in for an edge router. The real routers are covered by their own specs;
 * here we stub the geometry so the tests exercise only the postprocessor's decision logic
 * (branch selection + transform assembly), with fully predictable numbers.
 */
interface FakeRouterOverrides {
    pointAt?: () => Point;
    derivativeAt?: () => Point;
    findOrthogonalIntersection?: (edge: unknown, point: Point) => { point: Point, derivative: Point } | undefined;
}

function fakeRouter(overrides: FakeRouterOverrides = {}) {
    return {
        kind: 'polyline',
        // default: the edge midpoint is (100, 50) and the edge runs horizontally
        pointAt: overrides.pointAt ?? (() => ({ x: 100, y: 50 })),
        derivativeAt: overrides.derivativeAt ?? (() => ({ x: 1, y: 0 })),
        // default projection keeps the x of the queried point and snaps y to the edge line (50)
        findOrthogonalIntersection: overrides.findOrthogonalIntersection
            ?? ((_edge: unknown, p: Point) => ({ point: { x: p.x, y: 50 }, derivative: { x: 1, y: 0 } }))
    };
}

function createPostprocessor(router: ReturnType<typeof fakeRouter>): EdgeLayoutPostprocessor {
    const pp = new EdgeLayoutPostprocessor();
    (pp as any).edgeRouterRegistry = { get: () => router };
    (pp as any).logger = { error: () => { /* silence */ } };
    return pp;
}

interface LabelOptions {
    edgePlacement?: any;
    moveable?: boolean;
}

function createLabel(bounds: Bounds, opts: LabelOptions = {}): SLabelImpl {
    // A root is needed so add() can register elements in the model index.
    const graph = new SGraphImpl();
    graph.id = 'graph';
    const edge = new SEdgeImpl();
    edge.id = 'edge0';
    graph.add(edge);

    const label = new SLabelImpl();
    label.id = 'edge0_label';
    label.features = createFeatureSet(
        SLabelImpl.DEFAULT_FEATURES,
        opts.moveable ? { enable: [moveFeature] } : undefined
    );
    label.bounds = bounds;
    if (opts.edgePlacement) {
        label.edgePlacement = opts.edgePlacement;
    } else {
        // Guarantee `'edgePlacement' in label` is false regardless of class-field emit,
        // so checkEdgePlacement() is deterministic across tsc/esbuild.
        delete (label as any).edgePlacement;
    }
    edge.add(label);
    return label;
}

function decorateTransform(label: SLabelImpl, router: ReturnType<typeof fakeRouter>): string {
    const vnode = <g /> as any as VNode;
    createPostprocessor(router).decorate(vnode, label);
    return (vnode.data?.attrs?.transform as string ?? '').trim();
}

describe('EdgeLayoutPostprocessor', () => {

    describe('no explicit edgePlacement, not moveable', () => {

        it('places a label whose position is the origin at the point on the edge (default midpoint)', () => {
            // position (0,0) => "unpositioned" => fall back to the previous behaviour.
            const label = createLabel({ x: 0, y: 0, width: 80, height: 16 });
            const transform = decorateTransform(label, fakeRouter());
            expect(transform).to.equal('translate(100, 50)');
        });

        it('honors an engine-assigned absolute position by projecting the label center onto the edge (#514)', () => {
            // center = (90 + 40, 40 + 8) = (130, 48); projected onto the edge => (130, 50).
            const label = createLabel({ x: 90, y: 40, width: 80, height: 16 });
            const transform = decorateTransform(label, fakeRouter());
            expect(transform).to.equal('translate(130, 50) rotate(0) translate(-40, 7)');
        });

        it('rotates the label according to the edge direction at the projected point', () => {
            // A diagonal edge derivative (1,1) => a 45° tangent.
            const router = fakeRouter({
                findOrthogonalIntersection: () => ({ point: { x: 130, y: 50 }, derivative: { x: 1, y: 1 } })
            });
            const label = createLabel({ x: 90, y: 40, width: 80, height: 16 });
            const angle = toDegrees(Math.atan2(1, 1));
            const transform = decorateTransform(label, router);
            expect(transform).to.equal(`translate(130, 50) rotate(${angle}) translate(-40, 7)`);
        });

        it('anchors the label at the projected position in the free space, not the geometric edge midpoint (nested nodes, #514)', () => {
            // Mirrors the nested-nodes case: the geometric midpoint (pointAt) is pulled left,
            // "over" the outer node, while the engine placed the label center further along, in
            // the free space between the outer nodes. The fix must anchor at the projection of
            // the label center, NOT at the midpoint.
            const router = fakeRouter({
                pointAt: () => ({ x: 170, y: 100 }), // geometric midpoint, "over Outer A"
                findOrthogonalIntersection: (_edge: unknown, p: Point) => ({ point: { x: p.x, y: 103 }, derivative: { x: 1, y: 0 } })
            });
            // center = (211 + 20, 90 + 8) = (231, 98); projected onto the edge => (231, 103).
            const label = createLabel({ x: 211, y: 90, width: 40, height: 16 });
            const transform = decorateTransform(label, router);
            expect(transform).to.equal('translate(231, 103) rotate(0) translate(-20, 7)');
            // Explicitly: anchored in the free space (231), not at the geometric midpoint (170).
            expect(transform).to.contain('translate(231, 103)');
            expect(transform).to.not.contain('170');
        });

        it('does NOT project when only the size is set but the position is the origin', () => {
            // Guards the sentinel: the trigger tests the corner (position), not the center.
            // If the projection path were taken, this fake would throw.
            const router = fakeRouter({
                findOrthogonalIntersection: () => { throw new Error('should not project an unpositioned label'); }
            });
            const label = createLabel({ x: 0, y: 0, width: 80, height: 16 });
            const transform = decorateTransform(label, router);
            expect(transform).to.equal('translate(100, 50)');
        });
    });

    describe('no explicit edgePlacement, moveable', () => {

        it('keeps the freely-movable behavior (point on edge + bounds offset), without projection', () => {
            const router = fakeRouter({
                findOrthogonalIntersection: () => { throw new Error('moveable labels must not be projected'); }
            });
            const label = createLabel({ x: 90, y: 40, width: 80, height: 16 }, { moveable: true });
            const transform = decorateTransform(label, router);
            // (100 + 90, 50 + 40)
            expect(transform).to.equal('translate(190, 90)');
        });
    });

    describe('explicit edgePlacement (behavior must be unchanged by the refactor)', () => {

        const placement = (moveMode: 'none' | 'free' | 'edge') =>
            ({ position: 0.5, side: 'top', offset: 7, rotate: true, moveMode });

        it('moveMode "none": positions at the point on the edge and applies rotation/alignment', () => {
            const label = createLabel({ x: 90, y: 40, width: 80, height: 16 }, { edgePlacement: placement('none') });
            const transform = decorateTransform(label, fakeRouter());
            expect(transform).to.equal('translate(100, 50) rotate(0) translate(-40, 7)');
        });

        it('moveMode "free": adds the bounds offset to the point on the edge, then rotation/alignment', () => {
            const label = createLabel({ x: 90, y: 40, width: 80, height: 16 }, { edgePlacement: placement('free') });
            const transform = decorateTransform(label, fakeRouter());
            // (100 + 90, 50 + 40)
            expect(transform).to.equal('translate(190, 90) rotate(0) translate(-40, 7)');
        });

        it('moveMode "edge": snaps to the orthogonal intersection on the edge, then rotation/alignment', () => {
            const label = createLabel({ x: 90, y: 40, width: 80, height: 16 }, { edgePlacement: placement('edge') });
            // findOrthogonalIntersection is called with (pointOnEdge + bounds) = (190, 90) => x kept, y snapped to 50.
            const transform = decorateTransform(label, fakeRouter());
            expect(transform).to.equal('translate(190, 50) rotate(0) translate(-40, 7)');
        });
    });
});
