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
import { expect, describe, it } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../types';
import { SModelElementImpl } from '../model/smodel';
import { EMPTY_ROOT, IModelFactory } from '../model/smodel-factory';
import { CommandExecutionContext } from '../commands/command';
import { ConsoleLogger } from '../../utils/logging';
import { AnimationFrameSyncer } from '../animations/animation-frame-syncer';
import {  SetModelCommand } from './set-model';
import defaultModule from '../di.config';
import { SModelElement, SModelRoot, SetModelAction } from 'sprotty-protocol';

function compare(expected: SModelElement, actual: SModelElementImpl) {
    for (const p in expected) {
        if (Object.prototype.hasOwnProperty.call(expected, p)) {
            const expectedProp = (expected as any)[p];
            const actualProp = (actual as any)[p];
            if (p === 'children') {
                for (const i in expectedProp) {
                    if (Object.prototype.hasOwnProperty.call(expectedProp, i)) {
                        compare(expectedProp[i], actualProp[i]);
                    }
                }
            } else {
                expect(actualProp).to.deep.equal(expectedProp);
            }
        }
    }
}

describe('SetModelCommand', () => {
    const container = new Container();
    container.load(defaultModule);

    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);

    const emptyRoot = graphFactory.createRoot(EMPTY_ROOT);

    const context: CommandExecutionContext = {
        root: emptyRoot,
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: new AnimationFrameSyncer()
    };

    // setup the GModel
    const model1 = graphFactory.createRoot({
        id: 'model1',
        type: 'graph',
        children: []
    });

    const model2: SModelRoot = {
        id: 'model2',
        type: 'graph',
        children: []
    };

    // create the action
    const mySetModelAction =  SetModelAction.create(model2 /* the new model */);

    // create the command
    const cmd = new SetModelCommand(mySetModelAction);


    it('execute() returns the new model', () => {
        // execute command
        context.root = model1;  /* the old model */
        const newModel = cmd.execute(context);
        compare(model2, newModel);
        expect(model1.id).to.equal(cmd.oldRoot.id);
        expect(newModel.id).to.equal(cmd.newRoot.id);
    });

    it('undo() returns the previous model', () => {
        // test 'undo': returns old model
        expect(model1.id).to.equal(cmd.undo(context).id);
    });

    it('redo() returns the new model', () => {
        // test 'redo': returns new model
        const newModel = cmd.redo(context);
        compare(model2, newModel);
    });
});
