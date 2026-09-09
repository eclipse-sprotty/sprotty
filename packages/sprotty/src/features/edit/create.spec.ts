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
import { CreateElementAction } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer.js';
import { CommandExecutionContext } from '../../base/commands/command.js';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { TYPES } from '../../base/types.js';
import { SGraphImpl, SNodeImpl } from '../../graph/sgraph.js';
import { ConsoleLogger } from '../../utils/logging.js';
import { CreateElementCommand } from './create.js';

describe('CreateElementCommand', () => {
    const container = new Container();
    container.load(defaultModule);
    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node', SNodeImpl);
    const factory = container.get<IModelFactory>(TYPES.IModelFactory);
    const model = factory.createRoot({ id: 'graph', type: 'graph', children: [{ id: 'node0', type: 'node' }] });
    const context: CommandExecutionContext = {
        root: model, modelFactory: factory, duration: 0, modelChanged: undefined!, logger: new ConsoleLogger(), syncer: new AnimationFrameSyncer()
    };

    it('execute() creates the element from its schema inside the container, undo() removes it, redo() adds it again', () => {
        const command = new CreateElementCommand(CreateElementAction.create({ id: 'node1', type: 'node' }, { containerId: 'graph' }));
        command.execute(context);
        const created = model.index.getById('node1');
        expect(created).toBeInstanceOf(SNodeImpl);
        expect((created as SNodeImpl).parent).toBe(model);

        command.undo(context);
        expect(model.index.getById('node1')).toBeUndefined();
        expect(model.children.map(child => child.id)).toEqual(['node0']);

        command.redo(context);
        expect(model.index.getById('node1')).toBe(created);
    });

    it('does nothing when the container does not exist', () => {
        const command = new CreateElementCommand(CreateElementAction.create({ id: 'node2', type: 'node' }, { containerId: 'missing' }));
        command.execute(context);
        expect(model.index.getById('node2')).toBeUndefined();
    });
});
