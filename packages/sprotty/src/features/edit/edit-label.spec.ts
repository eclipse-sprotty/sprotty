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

/**
 * @vitest-environment happy-dom
 */

import { Container } from 'inversify';
import { ApplyLabelEditAction, SLabel } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer.js';
import { CommandExecutionContext } from '../../base/commands/command.js';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { TYPES } from '../../base/types.js';
import { SGraphImpl, SLabelImpl, SNodeImpl } from '../../graph/sgraph.js';
import { ConsoleLogger } from '../../utils/logging.js';
import { ApplyLabelEditCommand, EditLabelAction, EditLabelKeyListener, EditLabelMouseListener } from './edit-label.js';
import { EditableLabel, editLabelFeature, isEditableLabel, withEditLabelFeature } from './model.js';

/** A node that exposes its first editable label child through the `WithEditableLabel` extension. */
class NodeWithEditableLabel extends SNodeImpl {
    get editableLabel(): (EditableLabel & SLabelImpl) | undefined {
        return this.children.find((child): child is SLabelImpl => child instanceof SLabelImpl && isEditableLabel(child));
    }
}

function createModel(): SModelRootImpl {
    const container = new Container();
    container.load(defaultModule);
    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node', SNodeImpl);
    registerModelElement(container, 'node:labeled', NodeWithEditableLabel, { enable: [withEditLabelFeature] });
    registerModelElement(container, 'label', SLabelImpl, { enable: [editLabelFeature] });
    return container.get<IModelFactory>(TYPES.IModelFactory).createRoot({
        id: 'graph', type: 'graph',
        children: [
            { id: 'node0', type: 'node:labeled', children: [<SLabel>{ id: 'label0', type: 'label', text: 'zero' }] },
            { id: 'node1', type: 'node:labeled', children: [<SLabel>{ id: 'label1', type: 'label', text: 'one' }] },
            { id: 'node2', type: 'node' }
        ]
    });
}

function keyEvent(code: string): KeyboardEvent {
    return { code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false } as KeyboardEvent;
}

describe('ApplyLabelEditCommand', () => {
    const model = createModel();
    const context: CommandExecutionContext = {
        root: model, modelFactory: undefined!, duration: 0, modelChanged: undefined!, logger: new ConsoleLogger(), syncer: new AnimationFrameSyncer()
    };

    it('execute() applies the new text, undo() restores the old one, redo() applies it again', () => {
        const label = model.index.getById('label0') as SLabelImpl;
        const command = new ApplyLabelEditCommand(ApplyLabelEditAction.create('label0', 'changed'));
        command.execute(context);
        expect(label.text).toBe('changed');
        command.undo(context);
        expect(label.text).toBe('zero');
        command.redo(context);
        expect(label.text).toBe('changed');
    });

    it('ignores elements that are not editable labels', () => {
        const command = new ApplyLabelEditCommand(ApplyLabelEditAction.create('node2', 'changed'));
        command.execute(context);
        expect((model.index.getById('node2') as any).text).toBeUndefined();
        expect(() => command.undo(context)).not.toThrow();
    });
});

describe('EditLabelMouseListener', () => {
    const model = createModel();
    const listener = new EditLabelMouseListener();
    const event = {} as MouseEvent;

    it('requests editing of a double-clicked label', () => {
        expect(listener.doubleClick(model.index.getById('label0')!, event)).toEqual([EditLabelAction.create('label0')]);
    });

    it('requests editing of the editable label of a double-clicked element', () => {
        expect(listener.doubleClick(model.index.getById('node1')!, event)).toEqual([EditLabelAction.create('label1')]);
    });

    it('does nothing for elements without an editable label', () => {
        expect(listener.doubleClick(model.index.getById('node2')!, event)).toEqual([]);
    });
});

describe('EditLabelKeyListener', () => {
    const model = createModel();
    const listener = new EditLabelKeyListener();

    function select(...ids: string[]) {
        for (const element of model.index.all()) {
            if (element instanceof SNodeImpl) {
                element.selected = ids.includes(element.id);
            }
        }
    }

    it('edits the label of the single selected element on F2', () => {
        select('node1');
        expect(listener.keyDown(model, keyEvent('F2'))).toEqual([EditLabelAction.create('label1')]);
    });

    it('does nothing when no or several editable labels are selected', () => {
        select();
        expect(listener.keyDown(model, keyEvent('F2'))).toEqual([]);
        select('node0', 'node1');
        expect(listener.keyDown(model, keyEvent('F2'))).toEqual([]);
    });

    it('does nothing for other keys', () => {
        select('node1');
        expect(listener.keyDown(model, keyEvent('Enter'))).toEqual([]);
    });
});
