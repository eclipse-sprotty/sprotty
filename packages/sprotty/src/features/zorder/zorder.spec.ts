/********************************************************************************
 * Copyright (c) 2017-2019 TypeFox and others.
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
import { expect } from "chai";
import { Container } from 'inversify';
import { TYPES } from '../../base/types';
import { ConsoleLogger } from "../../utils/logging";
import { SModelRoot } from "../../base/model/smodel";
import { EMPTY_ROOT } from "../../base/model/smodel-factory";
import { CommandExecutionContext } from "../../base/commands/command";
import { AnimationFrameSyncer } from "../../base/animations/animation-frame-syncer";
import { SGraphFactory } from "../../graph/sgraph-factory";
import { SNode } from "../../graph/sgraph";
import { BringToFrontAction, BringToFrontCommand } from './zorder';
import defaultModule from "../../base/di.config";

function getNode(nodeId: string, model: SModelRoot) {
    return <SNode>model.index.getById(nodeId);
}

function getNodeIndex(nodeId: string, model: SModelRoot) {
    return model.children.indexOf(getNode(nodeId, model));
}

describe('BringToFrontCommand', () => {
    const container = new Container();
    container.load(defaultModule);
    container.rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope();

    const graphFactory = container.get<SGraphFactory>(TYPES.IModelFactory);

    const myNode0 = {id: 'node0', type: 'node:circle', x: 100, y: 100, selected: true};
    const myNode1 = {id: 'node1', type: 'node:circle', x: 200, y: 200, selected: false};
    const initialModel = graphFactory.createRoot({
        id: 'graph',
        type: 'graph',
        children: [myNode1, myNode0]  // myNode0 is selected, so put at the end
    });
    const lastIndex = initialModel.children.length - 1;

    // Create the z-order action
    const myZOrderAction = new BringToFrontAction(['node1']);

    // Create the z-order command
    const cmd = new BringToFrontCommand(myZOrderAction);

    // Global so we can carry-over the model, as it's updated,
    // from test case to test case (i,e, select, undo, redo)
    let newModel: SModelRoot;

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

        // The selected node is moved at the end of the array
        expect(lastIndex).to.equal(getNodeIndex('node1', newModel));
        expect(0).to.equal(getNodeIndex('node0', newModel));
    });

    it('undo() works as expected', () => {
        // Test "undo"
        context.root = newModel;
        newModel = cmd.undo(context);

        // The selected node is moved at the end of the array
        expect(lastIndex).to.equal(getNodeIndex('node0', newModel));
        expect(0).to.equal(getNodeIndex('node1', newModel));
    });

    it('redo() works as expected', () => {
        // Test "redo"
        context.root = newModel;
        newModel = cmd.redo(context);

        // The selected node is moved at the end of the array
        expect(lastIndex).to.equal(getNodeIndex('node1', newModel));
        expect(0).to.equal(getNodeIndex('node0', newModel));
    });
});
