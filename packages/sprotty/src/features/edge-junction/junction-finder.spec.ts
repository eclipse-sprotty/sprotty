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

import 'reflect-metadata';

import { Point } from 'sprotty-protocol';
import { assert, describe, expect, it } from 'vitest';
import { SEdgeImpl, SGraphImpl } from '../../graph/sgraph';
import { EdgeRouting, RoutedPoint } from '../routing/routing';
import { JunctionFinder } from './junction-finder';


describe('JunctionFinder', () => {
    it('should find no junction points on two identical paths', () => {
        const model = new SGraphImpl();
        const edge1 = createEdge('edge1', 'A', 'B');
        const edge2 = createEdge('edge2', 'A', 'B');
        model.add(edge1);
        model.add(edge2);

        const routing = new EdgeRouting();
        const route1 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 0}, {x: 100, y: 100}]);
        const route2 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 0}, {x: 100, y: 100}]);

        routing.routes.set(edge1.id, route1);
        routing.routes.set(edge2.id, route2);

        const finder = new JunctionFinder();
        finder.apply(routing, model);

        const allJunctionPoints = getAllJunctionPoints(routing);

        checkAllJunctionPoints([], allJunctionPoints);
    });

    it('should find single junction point on diverging edge with same source', () => {
        const model = new SGraphImpl();
        const edge1 = createEdge('edge1', 'A', 'B');
        const edge2 = createEdge('edge2', 'A', 'C');
        model.add(edge1);
        model.add(edge2);

        const routing = new EdgeRouting();
        const route1 = createRouting([{x: 0, y: 0}, {x: 100, y: 0}]);
        const route2 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 100}, {x: 100, y: 100}]);

        routing.routes.set(edge1.id, route1);
        routing.routes.set(edge2.id, route2);

        const finder = new JunctionFinder();
        finder.apply(routing, model);

        const allJunctionPoints = getAllJunctionPoints(routing);

        const expectedJunctionPoint: RoutedPoint = {kind: 'linear', x: 50, y: 0, isJunction: true};

        checkAllJunctionPoints([expectedJunctionPoint], allJunctionPoints);
    });

    it('should find two junction points on splitting edges with same source', () => {
        const model = new SGraphImpl();
        const edge1 = createEdge('edge1', 'A', 'B');
        const edge2 = createEdge('edge2', 'A', 'C');
        model.add(edge1);
        model.add(edge2);

        const routing = new EdgeRouting();
        const route1 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 100}, {x: 100, y: 100}]);
        const route2 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: -100}, {x: 100, y: -100}]);

        routing.routes.set(edge1.id, route1);
        routing.routes.set(edge2.id, route2);

        const finder = new JunctionFinder();
        finder.apply(routing, model);

        const allJunctionPoints = getAllJunctionPoints(routing);

        const expectedJunctionPoint: RoutedPoint[] = [
            {kind: 'linear', x: 50, y: 0, isJunction: true},
            {kind: 'linear', x: 50, y: 0, isJunction: true}
        ];

        checkAllJunctionPoints(expectedJunctionPoint, allJunctionPoints);
    });

    it('should find single junction point on diverging edge with same target', () => {
        const model = new SGraphImpl();
        const edge1 = createEdge('edge1', 'A', 'C');
        const edge2 = createEdge('edge2', 'B', 'C');
        model.add(edge1);
        model.add(edge2);

        const routing = new EdgeRouting();
        const route1 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 100}, {x: 100, y: 100}]);
        const route2 = createRouting([{x: 0, y: 100}, {x: 100, y: 100}]);

        routing.routes.set(edge1.id, route1);
        routing.routes.set(edge2.id, route2);

        const finder = new JunctionFinder();
        finder.apply(routing, model);

        const allJunctionPoints = getAllJunctionPoints(routing);

        const expectedJunctionPoint: RoutedPoint[] = [{kind: 'linear', x: 50, y: 100, isJunction: true}];

        checkAllJunctionPoints(expectedJunctionPoint, allJunctionPoints);
    });

    it('should find two junction points on splitting edges with same target', () => {
        const model = new SGraphImpl();
        const edge1 = createEdge('edge1', 'A', 'C');
        const edge2 = createEdge('edge2', 'B', 'C');
        model.add(edge1);
        model.add(edge2);

        const routing = new EdgeRouting();
        const route1 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 100}, {x: 100, y: 100}]);
        const route2 = createRouting([{x: 0, y: 200}, {x: 50, y: 200}, {x: 50, y: 100}, {x: 100, y: 100}]);

        routing.routes.set(edge1.id, route1);
        routing.routes.set(edge2.id, route2);

        const finder = new JunctionFinder();
        finder.apply(routing, model);

        const allJunctionPoints = getAllJunctionPoints(routing);

        const expectedJunctionPoint: RoutedPoint[] = [
            {kind: 'linear', x: 50, y: 100, isJunction: true},
            {kind: 'linear', x: 50, y: 100, isJunction: true}
        ];

        checkAllJunctionPoints(expectedJunctionPoint, allJunctionPoints);
    });

    it('should find three junction points on three diverging edges with same source', () => {
        const model = new SGraphImpl();
        const edge1 = createEdge('edge1', 'A', 'B');
        const edge2 = createEdge('edge2', 'A', 'C');
        const edge3 = createEdge('edge3', 'A', 'D');
        model.add(edge1);
        model.add(edge2);
        model.add(edge3);

        const routing = new EdgeRouting();
        const route1 = createRouting([{x: 0, y: 0}, {x: 100, y: 0}]);
        const route2 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 100}, {x: 100, y: 100}]);
        const route3 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 200}, {x: 100, y: 200}]);

        routing.routes.set(edge1.id, route1);
        routing.routes.set(edge2.id, route2);
        routing.routes.set(edge3.id, route3);

        const finder = new JunctionFinder();
        finder.apply(routing, model);

        const allJunctionPoints = getAllJunctionPoints(routing);

        const expectedJunctionPoint: RoutedPoint[] = [
            {kind: 'linear', x: 50, y: 0, isJunction: true},
            {kind: 'linear', x: 50, y: 100, isJunction: true},
            {kind: 'linear', x: 50, y: 0, isJunction: true},
        ];

        checkAllJunctionPoints(expectedJunctionPoint, allJunctionPoints);
    });

    it('should find four junction points on three diverging and splitting edges with same source', () => {
        const model = new SGraphImpl();
        const edge1 = createEdge('edge1', 'A', 'B');
        const edge2 = createEdge('edge2', 'A', 'C');
        const edge3 = createEdge('edge3', 'A', 'D');
        model.add(edge1);
        model.add(edge2);
        model.add(edge3);

        const routing = new EdgeRouting();
        const route1 = createRouting([{x: 0, y: 0}, {x: 150, y: 0}]);
        const route2 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 100}, {x: 100, y: 100}, {x: 100, y: 50}, {x: 150, y: 50}]);
        const route3 = createRouting([{x: 0, y: 0}, {x: 50, y: 0}, {x: 50, y: 100}, {x: 100, y: 100}, {x: 100, y: 150}, {x: 150, y: 150}]);

        routing.routes.set(edge1.id, route1);
        routing.routes.set(edge2.id, route2);
        routing.routes.set(edge3.id, route3);

        const finder = new JunctionFinder();
        finder.apply(routing, model);

        const allJunctionPoints = getAllJunctionPoints(routing);

        const expectedJunctionPoint: RoutedPoint[] = [
            {kind: 'linear', x: 50, y: 0, isJunction: true},
            {kind: 'linear', x: 50, y: 0, isJunction: true},
            {kind: 'linear', x: 100, y: 100, isJunction: true},
            {kind: 'linear', x: 100, y: 100, isJunction: true},
        ];

        checkAllJunctionPoints(expectedJunctionPoint, allJunctionPoints);
    });

});

function createEdge(id: string, source: string, target: string): SEdgeImpl {
    const edge = new SEdgeImpl();
    edge.id = id;
    edge.type = 'edge';
    edge.sourceId = source;
    edge.targetId = target;
    return edge;
}

function createRouting(points: Point[]): RoutedPoint[] {

    return points.map((p, idx) => {
        if (idx === 0) {
            return {kind: 'source', x: p.x, y: p.y};
        } else if (idx === points.length - 1) {
            return {kind: 'target', x: p.x, y: p.y};
        } else {
            return {kind: 'linear', x: p.x, y: p.y};
        }
    });
}

function getAllJunctionPoints(routing: EdgeRouting): RoutedPoint[] {
    const junctionPoints: RoutedPoint[] = [];

    routing.routes.forEach(route => {
        route.forEach(point => {
            if (point.isJunction) {
                junctionPoints.push(point);
            }
        });
    });

    return junctionPoints;
}

function checkAllJunctionPoints(expected: RoutedPoint[], actual: RoutedPoint[]): void {
    expect(actual.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
        const idx = actual.findIndex(p => p.x === expected[i].x && p.y === expected[i].y);
        if (idx === -1) {
            assert.fail('Could not find expected junction point');
        }
        actual.splice(idx, 1);
    }
    expect(actual.length).toBe(0);
}
