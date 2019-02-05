/********************************************************************************
 * Copyright (c) 2019 TypeFox and others.
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

import "reflect-metadata";
import "mocha";
import { expect } from "chai";
import { Container, injectable, inject } from "inversify";
import { TYPES } from "../types";
import { configureCommand, CommandActionHandlerInitializer } from "./command-registration";
import { SetModelCommand, SetModelAction } from "../features/set-model";
import { ActionHandlerRegistry } from "../actions/action-handler";
import { EMPTY_ROOT } from "../model/smodel-factory";
import { Command, CommandResult } from "./command";

const MySymbol = Symbol('MySymbol');

@injectable()
class MyCommand extends Command {
    static KIND = 'MyCommand';

    @inject(MySymbol) fieldInjected: string;

    constructor(@inject(TYPES.Action) readonly action: MyAction, @inject(MySymbol) readonly constructorInjected: string) {
        super();
    }

    execute(): CommandResult { return null!; }
    undo(): CommandResult { return null!; }
    redo(): CommandResult { return null!; }
}

class MyAction {
    kind = MyCommand.KIND;

    constructor(readonly value: string) {}
}

describe('CommandRegistration', () => {
    it ('creates new instances', () => {
        const container = new Container();
        container.bind(TYPES.IActionHandlerInitializer).to(CommandActionHandlerInitializer).inSingletonScope();
        container.bind(ActionHandlerRegistry).toSelf().inSingletonScope();
        configureCommand(container, SetModelCommand);
        const actionHandlerRegistry = container.get<ActionHandlerRegistry>(ActionHandlerRegistry);
        const action = new SetModelAction(EMPTY_ROOT);
        const handlers = actionHandlerRegistry.get(action.kind);
        expect(handlers.length).to.be.equal(1);
        const handler = handlers.pop()!;
        const command0 = handler.handle(action);
        expect(command0).to.be.an.instanceOf(SetModelCommand);
        const command1 = handler.handle(action);
        expect(command1).to.be.an.instanceOf(SetModelCommand);
        expect(command0).to.not.be.equal(command1);
        const command2 = handler.handle(new SetModelAction({ type: 'other',  id: '0' }));
        expect(command2).to.be.an.instanceOf(SetModelCommand);
        expect(command2).to.not.be.equal(command1);
        expect(command2).to.not.be.equal(command0);
    });

    it ('injects members', () => {
        const container = new Container();
        container.bind(TYPES.IActionHandlerInitializer).to(CommandActionHandlerInitializer).inSingletonScope();
        container.bind(ActionHandlerRegistry).toSelf().inSingletonScope();
        container.bind(MySymbol).toConstantValue('injected');
        configureCommand(container, MyCommand);
        const actionHandlerRegistry = container.get<ActionHandlerRegistry>(ActionHandlerRegistry);
        const action0 = new MyAction('foo');
        const handlers = actionHandlerRegistry.get(action0.kind);
        expect(handlers.length).to.be.equal(1);
        const handler = handlers.pop()!;
        const command0 = handler.handle(action0) as MyCommand;
        expect(command0).to.be.an.instanceOf(MyCommand);
        expect(command0.constructorInjected).to.be.equal('injected');
        expect(command0.fieldInjected).to.be.equal('injected');
        expect(command0.action.value).to.be.equal('foo');

        const action1 = new MyAction('bar');
        const command1 = handler.handle(action1) as MyCommand;
        expect(command1.action.value).to.be.equal('bar');
    });
});



