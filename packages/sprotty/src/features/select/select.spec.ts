/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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
import 'mocha';
import { expect } from 'chai';
import { Container } from 'inversify';
import { TYPES } from '../../base/types';
import { ConsoleLogger } from '../../utils/logging';
import { SModelRootImpl } from '../../base/model/smodel';
import { EMPTY_ROOT, IModelFactory } from '../../base/model/smodel-factory';
import { CommandExecutionContext } from '../../base/commands/command';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer';
import { SGraphImpl, SNodeImpl } from '../../graph/sgraph';
import { SelectCommand, SelectAllCommand } from './select';
import defaultModule from '../../base/di.config';
import { SelectAction, SelectAllAction } from 'sprotty-protocol';
import { registerModelElement } from '../../base/model/smodel-utils';

function getNode(nodeId: string, model: SModelRootImpl) {
    return <SNodeImpl>model.index.getById(nodeId);
}

function isNodeSelected(nodeId: string, model: SModelRootImpl) {
    return getNode(nodeId, model).selected;
}

describe('SelectCommand', () => {
    const container = new Container();
    container.load(defaultModule);

    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node:circle', SNodeImpl);

    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);

    const myNode0 = { id: 'node0', type: 'node:circle', x: 100, y: 100, selected: true };
    const myNode1 = { id: 'node1', type: 'node:circle', x: 200, y: 200, selected: false };
    const initialModel = graphFactory.createRoot({
        id: 'graph',
        type: 'graph',
        children: [myNode1, myNode0]  // myNode0 is selected, so put at the end
    });

    // Create the select action
    const mySelectAction = SelectAction.create({
        selectedElementsIDs:
            ['node1'], // selected list
        deselectedElementsIDs:
            ['node0']  // deselected list
    });

    // Create the select command
    const cmd = new SelectCommand(mySelectAction);

    // Global so we can carry-over the model, as it's updated,
    // from test case to test case (i,e, select, undo, redo)
    let newModel: SModelRootImpl;

    const context: CommandExecutionContext = {
        root: graphFactory.createRoot(EMPTY_ROOT),
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: new AnimationFrameSyncer()
    };

    it('execute() works as expected', () => {
        // Execute command
        context.root = initialModel;
        newModel = cmd.execute(context);

        // Confirm selection is as expected
        expect(isNodeSelected('node1', newModel)).to.equal(true);
        expect(isNodeSelected('node0', newModel)).to.equal(false);
    });

    it('undo() works as expected', () => {
        // Test 'undo'
        context.root = newModel;
        newModel = cmd.undo(context);

        // Confirm selection is as expected
        expect(isNodeSelected('node0', newModel)).to.equal(true);
        expect(isNodeSelected('node1', newModel)).to.equal(false);
    });

    it('redo() works as expected', () => {
        // Test 'redo'
        context.root = newModel;
        newModel = cmd.redo(context);

        // Confirm selection is as expected
        expect(isNodeSelected('node1', newModel)).to.equal(true);
        expect(isNodeSelected('node0', newModel)).to.equal(false);
    });
});

describe('SelectAllCommand', () => {
    const container = new Container();
    container.load(defaultModule);

    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node:circle', SNodeImpl);

    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);

    const myNode0 = { id: 'node0', type: 'node:circle', x: 100, y: 100, selected: true };
    const myNode1 = { id: 'node1', type: 'node:circle', x: 200, y: 200, selected: false };
    const initialModel = graphFactory.createRoot({
        id: 'graph',
        type: 'graph',
        children: [myNode1, myNode0]
    });

    // Create the select commands
    const selectCmd = new SelectAllCommand(SelectAllAction.create({ select: true }));
    const deselectCmd = new SelectAllCommand(SelectAllAction.create({ select: false }));

    // Global so we can carry-over the model, as it's updated,
    // from test case to test case (i,e, select, undo, redo)
    let newModel: SModelRootImpl;

    const context: CommandExecutionContext = {
        root: graphFactory.createRoot(EMPTY_ROOT),
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: new AnimationFrameSyncer()
    };

    it('execute() works as expected', () => {
        // Execute command
        context.root = initialModel;
        newModel = selectCmd.execute(context);

        // Confirm selection is as expected
        expect(isNodeSelected('node0', newModel)).to.equal(true);
        expect(isNodeSelected('node1', newModel)).to.equal(true);
    });

    it('undo() works as expected', () => {
        // Test 'undo'
        context.root = newModel;
        newModel = selectCmd.undo(context);

        // confirm selection is as expected
        expect(isNodeSelected('node0', newModel)).to.equal(true);
        expect(isNodeSelected('node1', newModel)).to.equal(false);
    });

    it('redo() works as expected', () => {
        // Test 'redo'
        context.root = newModel;
        newModel = selectCmd.redo(context);

        // Confirm selection is as expected
        expect(isNodeSelected('node0', newModel)).to.equal(true);
        expect(isNodeSelected('node1', newModel)).to.equal(true);
    });

    it('execute() works as expected with deselect', () => {
        // Execute command with deselect: true
        context.root = newModel;
        newModel = deselectCmd.execute(context);

        // Confirm selection is as expected
        expect(isNodeSelected('node0', newModel)).to.equal(false);
        expect(isNodeSelected('node1', newModel)).to.equal(false);
    });

    it('undo() works as expected with deselect', () => {
        // Test 'undo' with deselect: true
        context.root = newModel;
        newModel = deselectCmd.undo(context);

        // confirm selection is as expected
        expect(isNodeSelected('node0', newModel)).to.equal(true);
        expect(isNodeSelected('node1', newModel)).to.equal(true);
    });

    it('redo() works as expected with deselect', () => {
        // Test 'redo' with deselect: true
        context.root = newModel;
        newModel = deselectCmd.redo(context);

        // Confirm selection is as expected
        expect(isNodeSelected('node0', newModel)).to.equal(false);
        expect(isNodeSelected('node1', newModel)).to.equal(false);
    });
});
