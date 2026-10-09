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
import { ReconnectAction, SEdge, SNode } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer.js';
import { CommandExecutionContext } from '../../base/commands/command.js';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { TYPES } from '../../base/types.js';
import { SEdgeImpl, SGraphImpl, SNodeImpl } from '../../graph/sgraph.js';
import routingModule from '../routing/di.config.js';
import { EdgeRouterRegistry } from '../routing/routing.js';
import { ConsoleLogger } from '../../utils/logging.js';
import { ReconnectCommand } from './reconnect.js';

describe('ReconnectCommand', () => {
    const container = new Container();
    container.load(defaultModule, routingModule);
    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node', SNodeImpl);
    registerModelElement(container, 'edge', SEdgeImpl);
    const factory = container.get<IModelFactory>(TYPES.IModelFactory);
    const model = factory.createRoot({
        id: 'graph', type: 'graph',
        children: [
            <SNode>{ id: 'node0', type: 'node', position: { x: 0, y: 0 }, size: { width: 10, height: 10 } },
            <SNode>{ id: 'node1', type: 'node', position: { x: 100, y: 0 }, size: { width: 10, height: 10 } },
            <SNode>{ id: 'node2', type: 'node', position: { x: 0, y: 100 }, size: { width: 10, height: 10 } },
            <SEdge>{ id: 'edge0', type: 'edge', sourceId: 'node0', targetId: 'node1' }
        ]
    });
    const edge = model.index.getById('edge0') as SEdgeImpl;
    const context: CommandExecutionContext = {
        root: model, modelFactory: factory, duration: 0, modelChanged: undefined!, logger: new ConsoleLogger(), syncer: new AnimationFrameSyncer()
    };

    function createCommand(action: ReconnectAction): ReconnectCommand {
        const command = new ReconnectCommand(action);
        command.edgeRouterRegistry = container.get(EdgeRouterRegistry);
        return command;
    }

    it('execute() connects the edge to the new target, undo() restores the old one, redo() reconnects again', () => {
        const command = createCommand(ReconnectAction.create({ routableId: 'edge0', newTargetId: 'node2' }));
        command.execute(context);
        expect(edge.targetId).toBe('node2');
        expect(edge.target?.id).toBe('node2');
        expect(edge.sourceId).toBe('node0');

        command.undo(context);
        expect(edge.targetId).toBe('node1');
        expect(edge.target?.id).toBe('node1');

        command.redo(context);
        expect(edge.targetId).toBe('node2');
    });

    it('ignores unknown routable elements', () => {
        const command = createCommand(ReconnectAction.create({ routableId: 'missing', newSourceId: 'node2' }));
        expect(() => command.execute(context)).not.toThrow();
        expect(() => command.undo(context)).not.toThrow();
    });
});
