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
import { Container, injectable } from "inversify";
import { TYPES } from "../types";
import { EMPTY_BOUNDS } from '../../utils/geometry';
import { InitializeCanvasBoundsAction } from '../features/initialize-canvas';
import { RedoAction, UndoAction } from "../../features/undo-redo/undo-redo";
import { Command, CommandExecutionContext, CommandReturn, ICommand } from '../commands/command';
import { ICommandStack } from "../commands/command-stack";
import { ActionDispatcher } from "./action-dispatcher";
import { Action } from "./action";
import defaultModule from "../di.config";
import { SetModelAction } from '../features/set-model';
import { EMPTY_ROOT } from '../model/smodel-factory';

describe('ActionDispatcher', () => {
    @injectable()
    class MockCommand extends Command {
        static KIND = 'mock';

        execute(context: CommandExecutionContext): CommandReturn {
            return context.root;
        }

        undo(context: CommandExecutionContext): CommandReturn {
            return context.root;
        }

        redo(context: CommandExecutionContext): CommandReturn {
            return context.root;
        }
    }

    class MockAction implements Action {
        kind = MockCommand.KIND;
    }

    function setup() {
        const state = {
            execCount: 0,
            undoCount: 0,
            redoCount: 0
        };

        const mockCommandStack: ICommandStack = {
            execute(command: ICommand): Promise<any> {
                ++state.execCount;
                return Promise.resolve();
            },
            executeAll(commands: ICommand[]): Promise<any> {
                ++state.execCount;
                return Promise.resolve();
            },
            undo(): Promise<any> {
                ++state.undoCount;
                return Promise.resolve();
            },
            redo(): Promise<any> {
                ++state.redoCount;
                return Promise.resolve();
            }
        };

        const container = new Container();
        container.load(defaultModule);
        container.rebind(TYPES.ICommandStack).toConstantValue(mockCommandStack);

        const actionDispatcher = container.get<ActionDispatcher>(TYPES.IActionDispatcher);
        return { actionDispatcher, state };
    }

    it('should execute/undo/redo', async () => {
        const { actionDispatcher, state } = setup();
        await actionDispatcher.initialize();

        // an initial SetModelAction is fired automatically
        expect(state.execCount).to.be.equal(1);
        expect(state.undoCount).to.be.equal(0);
        expect(state.redoCount).to.be.equal(0);

        // actions are postponed until InitializeCanvasBoundsAction comes in
        // no await here, as it is blocking
        actionDispatcher.dispatch(new UndoAction);
        expect(state.execCount).to.be.equal(1);
        expect(state.undoCount).to.be.equal(0);
        expect(state.redoCount).to.be.equal(0);

        await actionDispatcher.dispatch(new InitializeCanvasBoundsAction(EMPTY_BOUNDS));
        // postponed actions are fired as well
        expect(state.execCount).to.be.equal(2);
        expect(state.undoCount).to.be.equal(1);
        expect(state.redoCount).to.be.equal(0);

        await actionDispatcher.dispatch(new RedoAction);
        expect(state.execCount).to.be.equal(2);
        expect(state.undoCount).to.be.equal(1);
        expect(state.redoCount).to.be.equal(1);

        await actionDispatcher.dispatch({ kind: 'unknown' }).catch(() => {});
        expect(state.execCount).to.be.equal(2);
        expect(state.undoCount).to.be.equal(1);
        expect(state.redoCount).to.be.equal(1);

        // MockAction is not registered by default
        await actionDispatcher.dispatch(new MockAction()).catch(() => {});
        expect(state.execCount).to.be.equal(2);
        expect(state.undoCount).to.be.equal(1);
        expect(state.redoCount).to.be.equal(1);
    });

    it('should resolve/reject promises', async () => {
        const { actionDispatcher } = setup();
        await actionDispatcher.dispatch(new InitializeCanvasBoundsAction(EMPTY_BOUNDS));

        await actionDispatcher.dispatch(new SetModelAction(EMPTY_ROOT));
        // We expect this promis to be resolved
        await actionDispatcher.dispatch(new InitializeCanvasBoundsAction(EMPTY_BOUNDS));
        // remove the blocking

        try {
            await actionDispatcher.dispatch({ kind: 'unknown' });
            expect.fail();
        } catch {
            // We expect this promise to be rejected
        }
    });
});
