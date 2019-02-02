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
import { expect } from "chai";
import { Container } from 'inversify';
import { TYPES } from '../../base/types';
import { ConsoleLogger } from "../../utils/logging";
import { EMPTY_ROOT } from "../../base/model/smodel-factory";
import { SModelElement, SModelElementSchema, SModelRoot, SModelRootSchema } from "../../base/model/smodel";
import { CommandExecutionContext } from "../../base/commands/command";
import { AnimationFrameSyncer } from "../../base/animations/animation-frame-syncer";
import { CompoundAnimation } from "../../base/animations/animation";
import { SNodeSchema, SGraphSchema } from "../../graph/sgraph";
import { SGraphFactory } from "../../graph/sgraph-factory";
import { FadeAnimation } from "../../features/fade/fade";
import { MoveAnimation } from "../../features/move/move";
import { UpdateModelCommand } from "./update-model";
import { ModelMatcher } from "./model-matching";
import defaultModule from "../../base/di.config";

function compare(expected: SModelElementSchema, actual: SModelElement) {
    for (const p in expected) {
        if (expected.hasOwnProperty(p)) {
            const expectedProp = (expected as any)[p];
            const actualProp = (actual as any)[p];
            if (p === 'children') {
                for (const i in expectedProp) {
                    if (expectedProp.hasOwnProperty(i)) {
                        compare(expectedProp[i], actualProp[i]);
                    }
                }
            } else {
                expect(actualProp).to.deep.equal(expectedProp);
            }
        }
    }
}

describe('UpdateModelCommand', () => {
    const container = new Container();
    container.load(defaultModule);
    container.rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope();

    const graphFactory = container.get<SGraphFactory>(TYPES.IModelFactory);

    const emptyRoot = graphFactory.createRoot(EMPTY_ROOT);

    const context: CommandExecutionContext = {
        root: emptyRoot,
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: new AnimationFrameSyncer()
    };

    const model1 = graphFactory.createRoot({
        id: 'model',
        type: 'graph',
        children: []
    });

    const model2: SModelRootSchema = {
        id: 'model',
        type: 'graph2',
        children: []
    };

    const command1 = new UpdateModelCommand({
        kind: UpdateModelCommand.KIND,
        newRoot: model2,
        animate: false
    });

    it('replaces the model if animation is suppressed', () => {
        context.root = model1; /* the old model */
        const newModel = command1.execute(context);
        compare(model2, newModel as SModelRoot);
        expect(model1).to.equal(command1.oldRoot);
        expect(newModel).to.equal(command1.newRoot);
    });

    it('undo() returns the previous model', () => {
        context.root = graphFactory.createRoot(model2);
        expect(model1).to.equal(command1.undo(context));
    });

    it('redo() returns the new model', () => {
        context.root = model1; /* the old model */
        const newModel = command1.redo(context);
        compare(model2, newModel as SModelRoot);
    });

    class TestUpdateModelCommand extends UpdateModelCommand {
        testAnimation(root: SModelRoot, execContext: CommandExecutionContext) {
            this.oldRoot = root;
            this.newRoot = execContext.modelFactory.createRoot(this.action.newRoot!);
            const matcher = new ModelMatcher();
            const matchResult = matcher.match(root, this.newRoot);
            return this.computeAnimation(this.newRoot, matchResult, execContext);
        }
    }

    it('fades in new elements', () => {
        const command2 = new TestUpdateModelCommand({
            kind: UpdateModelCommand.KIND,
            animate: true,
            newRoot: {
                type: 'graph',
                id: 'model',
                children: [
                    {
                        type: 'node',
                        id: 'child1'
                    },
                    {
                        type: 'node',
                        id: 'child2'
                    }
                ]
            }
        });
        const animation = command2.testAnimation(model1, context);
        expect(animation).to.be.an.instanceOf(FadeAnimation);
        const fades = (animation as FadeAnimation).elementFades;
        expect(fades).to.have.lengthOf(2);
        for (const fade of fades) {
            expect(fade.type).to.equal('in');
            expect(fade.element.type).to.equal('node');
            expect(fade.element.id).to.be.oneOf(['child1', 'child2']);
        }
    });

    it('fades out deleted elements', () => {
        const model3 = graphFactory.createRoot({
            type: 'graph',
            id: 'model',
            children: [
                {
                    type: 'node',
                    id: 'child1'
                },
                {
                    type: 'node',
                    id: 'child2'
                }
            ]
        });
        const command2 = new TestUpdateModelCommand({
            kind: UpdateModelCommand.KIND,
            animate: true,
            newRoot: {
                type: 'graph',
                id: 'model',
                children: []
            }
        });
        const animation = command2.testAnimation(model3, context);
        expect(animation).to.be.an.instanceOf(FadeAnimation);
        const fades = (animation as FadeAnimation).elementFades;
        expect(fades).to.have.lengthOf(2);
        for (const fade of fades) {
            expect(fade.type).to.equal('out');
            expect(fade.element.type).to.equal('node');
            expect(fade.element.id).to.be.oneOf(['child1', 'child2']);
        }
    });

    it('moves relocated elements', () => {
        const model3 = graphFactory.createRoot({
            type: 'graph',
            id: 'model',
            children: [
                {
                    type: 'node',
                    id: 'child1',
                    position: { x: 100, y: 100 }
                } as SNodeSchema
            ]
        });
        const command2 = new TestUpdateModelCommand({
            kind: UpdateModelCommand.KIND,
            animate: true,
            newRoot: {
                type: 'graph',
                id: 'model',
                children: [
                    {
                        type: 'node',
                        id: 'child1',
                        position: { x: 150, y: 200 }
                    } as SNodeSchema
                ]
            }
        });
        const animation = command2.testAnimation(model3, context);
        expect(animation).to.be.an.instanceOf(MoveAnimation);
        const moves = (animation as MoveAnimation).elementMoves;
        const child1Move = moves.get('child1')!;
        expect(child1Move.element.id).to.equal('child1');
        expect(child1Move.fromPosition).to.deep.equal({ x: 100, y: 100 });
        expect(child1Move.toPosition).to.deep.equal({ x: 150, y: 200 });
    });

    it('combines fade and move animations', () => {
        const model3 = graphFactory.createRoot({
            type: 'graph',
            id: 'model',
            children: [
                {
                    type: 'node',
                    id: 'child1',
                    position: { x: 100, y: 100 }
                } as SNodeSchema,
                {
                    type: 'node',
                    id: 'child2'
                }
            ]
        });
        const command2 = new TestUpdateModelCommand({
            kind: UpdateModelCommand.KIND,
            animate: true,
            newRoot: {
                type: 'graph',
                id: 'model',
                children: [
                    {
                        type: 'node',
                        id: 'child1',
                        position: { x: 150, y: 200 }
                    } as SNodeSchema,
                    {
                        type: 'node',
                        id: 'child3'
                    }
                ]
            }
        });
        const animation = command2.testAnimation(model3, context);
        expect(animation).to.be.an.instanceOf(CompoundAnimation);
        const components = (animation as CompoundAnimation).components;
        expect(components).to.have.lengthOf(2);
        const fadeAnimation = components[0] as FadeAnimation;
        expect(fadeAnimation).to.be.an.instanceOf(FadeAnimation);
        expect(fadeAnimation.elementFades).to.have.lengthOf(2);
        for (const fade of fadeAnimation.elementFades) {
            if (fade.type === 'in')
                expect(fade.element.id).to.equal('child3');
            else if (fade.type === 'out')
                expect(fade.element.id).to.equal('child2');
        }
        const moveAnimation = components[1] as MoveAnimation;
        expect(moveAnimation).to.be.an.instanceOf(MoveAnimation);
        const child1Move = moveAnimation.elementMoves.get('child1')!;
        expect(child1Move.element.id).to.equal('child1');
        expect(child1Move.fromPosition).to.deep.equal({ x: 100, y: 100 });
        expect(child1Move.toPosition).to.deep.equal({ x: 150, y: 200 });
    });

    it('applies a given model diff', () => {
        context.root = graphFactory.createRoot({
            type: 'graph',
            id: 'model',
            children: [
                {
                    type: 'node',
                    id: 'child1',
                    position: { x: 100, y: 100 }
                } as SNodeSchema,
                {
                    type: 'node',
                    id: 'child2'
                }
            ]
        });
        const command2 = new TestUpdateModelCommand({
            kind: UpdateModelCommand.KIND,
            animate: false,
            matches: [
                {
                    right: {
                        type: 'node',
                        id: 'child3'
                    },
                    rightParentId: 'model'
                },
                {
                    left: {
                        type: 'node',
                        id: 'child2'
                    },
                    leftParentId: 'model'
                },
                {
                    left: {
                        type: 'node',
                        id: 'child1',
                        position: { x: 100, y: 100 }
                    } as SNodeSchema,
                    leftParentId: 'model',
                    right: {
                        type: 'node',
                        id: 'child1',
                        position: { x: 150, y: 200 }
                    } as SNodeSchema,
                    rightParentId: 'model',
                }
            ]
        });
        const newModel = command2.execute(context) as SModelRoot;
        expect(newModel.children).to.have.lengthOf(2);
        const expected: SGraphSchema = {
            type: 'graph',
            id: 'model',
            children: [
                {
                    type: 'node',
                    id: 'child3'
                },
                {
                    type: 'node',
                    id: 'child1',
                    position: { x: 150, y: 200 }
                } as SNodeSchema
            ]
        };
        compare(expected, newModel);
    });
});
