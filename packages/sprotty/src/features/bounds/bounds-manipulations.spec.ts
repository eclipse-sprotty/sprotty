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

import { Container } from 'inversify';
import 'reflect-metadata';

import { expect, describe, it } from 'vitest';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer';
import { CommandExecutionContext } from '../../base/commands/command';
import defaultModule from '../../base/di.config';
import { TYPES } from '../../base/types';
import { SGraphImpl, SNodeImpl } from '../../graph/sgraph';
import { ConsoleLogger } from '../../utils/logging';
import { SetBoundsCommand } from '../bounds/bounds-manipulation';
import { SNode, SetBoundsAction } from 'sprotty-protocol';
import { IModelFactory } from '../../base/model/smodel-factory';

describe('SetBoundsCommand', () => {
    const container = new Container();
    container.load(defaultModule);

    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);

    const boundsInitial = { x: 0, y: 0, width: 0, height: 0 };
    const bounds1 = { x: 10, y: 10, width: 10, height: 10 };
    const boundsNoPos = { x: 0, y: 0, width: 20, height: 20 };

    const model = graphFactory.createRoot({ id: 'graph', type: 'graph', children: [] }) as SGraphImpl;
    const nodeSchema0: SNode = { id: 'node0', type: 'node:circle', position: { x: 0, y: 0 }, size: { width: 0, height: 0 } };

    const nodeBoundsAware: SNodeImpl = graphFactory.createElement(nodeSchema0) as SNodeImpl;

    model.add(nodeBoundsAware);

    nodeBoundsAware.bounds = boundsInitial;

    const mySetBoundsAction = SetBoundsAction.create(
        [
            { elementId: 'node0', newPosition: bounds1, newSize: bounds1 }
        ]
    );

    // create the set bounds command
    const setBoundsCommand = new SetBoundsCommand(mySetBoundsAction);

    const mySetBoundsActionNoPos = SetBoundsAction.create(
        [
            { elementId: 'node0', newSize: boundsNoPos }
        ]
    );

    // create the set bounds command
    const setBoundsCommandNoPos = new SetBoundsCommand(mySetBoundsActionNoPos);

    const context: CommandExecutionContext = {
        root: model,
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: new AnimationFrameSyncer()
    };

    it('execute() works as expected', () => {
        // sanity check for initial bounds values
        expect(boundsInitial).deep.equals(nodeBoundsAware.bounds);
        setBoundsCommandNoPos.execute(context);
        expect(boundsNoPos).deep.equals(nodeBoundsAware.bounds);
        setBoundsCommand.execute(context);
        expect(bounds1).deep.equals(nodeBoundsAware.bounds);
    });

    it('undo() works as expected', () => {
        setBoundsCommand.undo(context);
        expect(boundsNoPos).deep.equals(nodeBoundsAware.bounds);
        setBoundsCommandNoPos.undo(context);
        expect(boundsInitial).deep.equals(nodeBoundsAware.bounds);
    });

    it('redo() works as expected', () => {
        setBoundsCommandNoPos.redo(context);
        expect(boundsNoPos).deep.equals(nodeBoundsAware.bounds);
        setBoundsCommand.redo(context);
        expect(bounds1).deep.equals(nodeBoundsAware.bounds);
    });
});



