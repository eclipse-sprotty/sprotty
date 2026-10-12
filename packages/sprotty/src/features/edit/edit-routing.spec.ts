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

import { Container } from 'inversify';
import { Point, SEdge, SNode } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer.js';
import { CommandExecutionContext } from '../../base/commands/command.js';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { TYPES } from '../../base/types.js';
import { SEdgeImpl, SGraphImpl, SNodeImpl } from '../../graph/sgraph.js';
import { ConsoleLogger } from '../../utils/logging.js';
import routingModule from '../routing/di.config.js';
import { SRoutableElementImpl, SRoutingHandleImpl } from '../routing/model.js';
import { EdgeRouterRegistry } from '../routing/routing.js';
import { SwitchEditModeAction, SwitchEditModeCommand } from './edit-routing.js';
import { canEditRouting, editFeature } from './model.js';

describe('SwitchEditModeCommand', () => {
    const container = new Container();
    container.load(defaultModule, routingModule);
    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node', SNodeImpl);
    registerModelElement(container, 'edge', SEdgeImpl);
    registerModelElement(container, 'edge:fixed', SEdgeImpl, { disable: [editFeature] });
    const factory = container.get<IModelFactory>(TYPES.IModelFactory);

    /** Two nodes on a diagonal, connected by an edge with one routing point. */
    function createModel(routingPoint: Point) {
        const model = factory.createRoot({
            id: 'graph', type: 'graph',
            children: [
                <SNode>{ id: 'node0', type: 'node', position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
                <SNode>{ id: 'node1', type: 'node', position: { x: 100, y: 100 }, size: { width: 10, height: 10 } },
                <SEdge>{ id: 'edge0', type: 'edge', sourceId: 'node0', targetId: 'node1', routingPoints: [routingPoint] },
                <SEdge>{ id: 'edge1', type: 'edge:fixed', sourceId: 'node0', targetId: 'node1' }
            ]
        });
        const context: CommandExecutionContext = {
            root: model, modelFactory: factory, duration: 0, modelChanged: undefined!, logger: new ConsoleLogger(), syncer: new AnimationFrameSyncer()
        };
        return { model, edge: model.index.getById('edge0') as SEdgeImpl, context };
    }

    function execute(context: CommandExecutionContext, options: { elementsToActivate?: string[], elementsToDeactivate?: string[] }): SwitchEditModeCommand {
        const command = new SwitchEditModeCommand(SwitchEditModeAction.create(options));
        command.edgeRouterRegistry = container.get(EdgeRouterRegistry);
        command.execute(context);
        return command;
    }

    function handles(edge: SRoutableElementImpl): SRoutingHandleImpl[] {
        return edge.children.filter((child): child is SRoutingHandleImpl => child instanceof SRoutingHandleImpl);
    }

    it('only edges with the edit feature are editable', () => {
        const { model } = createModel({ x: 50, y: 20 });
        expect(canEditRouting(model.index.getById('edge0')!)).toBe(true);
        expect(canEditRouting(model.index.getById('edge1')!)).toBe(false);
        expect(canEditRouting(model.index.getById('node0')!)).toBe(false);
    });

    it('activating an edge creates its routing handles, undo() removes them, redo() creates them again', () => {
        const { edge, context } = createModel({ x: 50, y: 20 });
        const command = execute(context, { elementsToActivate: ['edge0'] });
        expect(handles(edge).map(handle => handle.kind)).toEqual(['source', 'line', 'junction', 'line', 'target']);

        command.undo(context);
        expect(handles(edge)).toHaveLength(0);

        command.redo(context);
        expect(handles(edge)).toHaveLength(5);
    });

    it('deactivating an edge removes its handles and undo() restores them', () => {
        const { edge, context } = createModel({ x: 50, y: 20 });
        execute(context, { elementsToActivate: ['edge0'] });
        const command = execute(context, { elementsToDeactivate: ['edge0'] });
        expect(handles(edge)).toHaveLength(0);

        command.undo(context);
        expect(handles(edge)).toHaveLength(5);
    });

    it('activating a handle puts it into edit mode and deactivating it ends the edit mode', () => {
        const { edge, context } = createModel({ x: 50, y: 20 });
        execute(context, { elementsToActivate: ['edge0'] });
        const junction = handles(edge).find(handle => handle.kind === 'junction')!;

        const activate = execute(context, { elementsToActivate: [junction.id] });
        expect(junction.editMode).toBe(true);
        execute(context, { elementsToDeactivate: [junction.id] });
        expect(junction.editMode).toBe(false);
        expect(edge.routingPoints).toEqual([{ x: 50, y: 20 }]);

        activate.undo(context);
        expect(junction.editMode).toBe(false);
    });

    it('dropping a junction handle onto a straight line removes its routing point, undo() brings it back', () => {
        const { edge, context } = createModel({ x: 55, y: 55 });
        execute(context, { elementsToActivate: ['edge0'] });
        const junction = handles(edge).find(handle => handle.kind === 'junction')!;
        execute(context, { elementsToActivate: [junction.id] });

        const command = execute(context, { elementsToDeactivate: [junction.id] });
        expect(edge.routingPoints).toEqual([]);
        expect(handles(edge).map(handle => handle.kind)).toEqual(['source', 'line', 'target']);

        command.undo(context);
        expect(edge.routingPoints).toEqual([{ x: 55, y: 55 }]);
        expect(handles(edge)).toHaveLength(5);
    });
});
