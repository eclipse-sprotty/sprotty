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
import { DeleteElementAction, SEdge, SLabel } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer.js';
import { CommandExecutionContext } from '../../base/commands/command.js';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { TYPES } from '../../base/types.js';
import { SEdgeImpl, SGraphImpl, SLabelImpl, SNodeImpl } from '../../graph/sgraph.js';
import { ConsoleLogger } from '../../utils/logging.js';
import { DeleteElementCommand } from './delete.js';

describe('DeleteElementCommand', () => {
    const container = new Container();
    container.load(defaultModule);
    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node', SNodeImpl);
    registerModelElement(container, 'edge', SEdgeImpl);
    registerModelElement(container, 'label', SLabelImpl);
    const factory = container.get<IModelFactory>(TYPES.IModelFactory);
    const model = factory.createRoot({
        id: 'graph', type: 'graph',
        children: [
            { id: 'node0', type: 'node' },
            { id: 'node1', type: 'node', children: [<SLabel>{ id: 'label1', type: 'label', text: 'one' }] },
            <SEdge>{ id: 'edge0', type: 'edge', sourceId: 'node0', targetId: 'node1' }
        ]
    });
    const context: CommandExecutionContext = {
        root: model, modelFactory: factory, duration: 0, modelChanged: undefined!, logger: new ConsoleLogger(), syncer: new AnimationFrameSyncer()
    };

    function childIds(root: SModelRootImpl): string[] {
        return root.children.map(child => child.id);
    }

    it('execute() removes the deletable elements and skips labels and unknown ids', () => {
        const command = new DeleteElementCommand(DeleteElementAction.create(['node0', 'edge0', 'label1', 'missing']));
        command.execute(context);
        expect(childIds(model)).toEqual(['node1']);
        expect(model.index.getById('label1')).toBeDefined();
        expect(model.index.getById('node0')).toBeUndefined();

        command.undo(context);
        expect(childIds(model).sort()).toEqual(['edge0', 'node0', 'node1']);
        expect(model.index.getById('edge0')).toBeInstanceOf(SEdgeImpl);

        command.redo(context);
        expect(childIds(model)).toEqual(['node1']);
    });
});
