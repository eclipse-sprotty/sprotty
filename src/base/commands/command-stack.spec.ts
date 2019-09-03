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

import "reflect-metadata";
import "mocha";
import { expect } from "chai";
import { Container, injectable } from "inversify";
import { TYPES } from "../types";
import defaultModule from "../di.config";
import { IViewerProvider } from "../views/viewer";
import {
    Command, HiddenCommand, SystemCommand, CommandExecutionContext, CommandReturn, MergeableCommand, PopupCommand
} from './command';
import { ICommandStack } from "./command-stack";

let operations: string[] = [];

@injectable()
class TestCommand extends Command {
    constructor(public name: string) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        operations.push('exec ' + this.name);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        operations.push('undo ' + this.name);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        operations.push('redo ' + this.name);
        return context.root;
    }

}

class TestSystemCommand extends SystemCommand {
    constructor(public name: string) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        operations.push('exec ' + this.name);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        operations.push('undo ' + this.name);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        operations.push('redo ' + this.name);
        return context.root;
    }
}

class TestMergeableCommand extends MergeableCommand {
    constructor(public name: string) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        operations.push('exec ' + this.name);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        operations.push('undo ' + this.name);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        operations.push('redo ' + this.name);
        return context.root;
    }

    merge(other: TestCommand, context: CommandExecutionContext) {
        if (other instanceof TestMergeableCommand) {
            this.name = this.name + '/' + other.name;
            return true;
        }
        return false;
    }
}

class TestHiddenCommand extends HiddenCommand {
      constructor(public name: string) {
        super();
    }

    execute(context: CommandExecutionContext) {
        operations.push('exec ' + this.name);
        return context.root;
    }
}

class TestPopupCommand extends PopupCommand {
    constructor(public name: string ) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        operations.push('exec ' + this.name);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        operations.push('undo ' + this.name);
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        operations.push('redo ' + this.name);
        return context.root;
    }
}

describe('CommandStack', () => {

    let viewerUpdates: number = 0;
    let hiddenViewerUpdates: number = 0;
    let popupUpdates: number = 0;

    const mockViewerProvider: IViewerProvider = {
        modelViewer: {
            update() {
                ++viewerUpdates;
            }
        },
        hiddenModelViewer: {
            update() {
                ++hiddenViewerUpdates;
            }
        },
        popupModelViewer: {
            update() {
                ++popupUpdates;
            }
        }
    };

    const container = new Container();
    container.load(defaultModule);
    container.rebind(TYPES.IViewerProvider).toConstantValue(mockViewerProvider);

    const commandStack = container.get<ICommandStack>(TYPES.ICommandStack);

    const foo = new TestCommand('Foo');
    const bar = new TestCommand('Bar');
    const system = new TestSystemCommand('System');
    const mergable = new TestMergeableCommand('Mergable');
    const hidden = new TestHiddenCommand('Hidden');
    const popup = new TestPopupCommand('Popup');

    it('calls viewer correctly', async () => {
        await commandStack.executeAll([foo, bar, system]);
        expect(viewerUpdates).to.be.equal(1);
        await commandStack.execute(foo);
        expect(viewerUpdates).to.be.equal(2);
        await commandStack.execute(bar);
        expect(viewerUpdates).to.be.equal(3);
        await commandStack.execute(system);
        expect(viewerUpdates).to.be.equal(4);
        await commandStack.execute(popup);
        expect(popupUpdates).to.be.equal(1);
        expect(0).to.be.equal(hiddenViewerUpdates);
    });

    it('handles plain undo/redo', async () => {
        operations = [];
        viewerUpdates = 0;
        popupUpdates = 0;
        await commandStack.executeAll([foo, bar, popup]);
        await commandStack.undo();
        await commandStack.redo();
        await commandStack.undo();
        await commandStack.undo();
        await commandStack.redo();

        expect(operations).to.be.eql(
            ['exec Foo', 'exec Bar', 'exec Popup', 'undo Bar', 'redo Bar', 'undo Bar',
             'undo Foo', 'redo Foo']);
        expect(6).to.be.equal(viewerUpdates);
        expect(0).to.be.equal(hiddenViewerUpdates);
    });

    it('handles system command at the end', async () => {
        operations = [];
        viewerUpdates = 0;
        await commandStack.executeAll([foo, bar, system]);
        expect(1).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec System']).to.be.eql(operations);
        await commandStack.undo();
        expect(2).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec System', 'undo System', 'undo Bar']).to.be.eql(operations);
        await commandStack.execute(system);
        expect(3).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec System', 'undo System', 'undo Bar', 'exec System']).to.be.eql(operations);
        await commandStack.redo();
        expect(4).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec System', 'undo System', 'undo Bar', 'exec System',
                'undo System', 'redo Bar', 'redo System']).to.be.eql(operations);
        expect(0).to.be.equal(hiddenViewerUpdates);
    });

    it('handles system command in the middle', async () => {
        operations = [];
        viewerUpdates = 0;
        await commandStack.executeAll([foo, bar]);
        expect(1).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar']).to.be.eql(operations);
        await commandStack.undo();
        expect(2).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'undo Bar']).to.be.eql(operations);
        await commandStack.execute(system);
        expect(3).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'undo Bar', 'exec System']).to.be.eql(operations);
        await commandStack.undo();
        expect(4).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'undo Bar', 'exec System', 'undo System',
                'undo Foo']).to.be.eql(operations);
        await commandStack.executeAll([system, system]);
        expect(5).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'undo Bar', 'exec System', 'undo System',
                'undo Foo', 'exec System', 'exec System']).to.be.eql(operations);
        await commandStack.redo();
        expect(6).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'undo Bar', 'exec System', 'undo System',
                'undo Foo', 'exec System', 'exec System', 'undo System', 'undo System',
                'redo Foo']).to.be.eql(operations);
        await commandStack.redo();
        expect(7).to.be.equal(viewerUpdates);
        expect(['exec Foo', 'exec Bar', 'undo Bar', 'exec System', 'undo System',
                'undo Foo', 'exec System', 'exec System', 'undo System', 'undo System',
                'redo Foo', 'redo Bar']).to.be.eql(operations);
        expect(0).to.be.equal(hiddenViewerUpdates);
    });

    it('handles merge command', async () => {
        operations = [];
        viewerUpdates = 0;
        await commandStack.executeAll([mergable, mergable]);
        expect(1).to.be.equal(viewerUpdates);
        expect(['exec Mergable', 'exec Mergable']).to.be.eql(operations);
        await commandStack.undo();
        expect(2).to.be.equal(viewerUpdates);
        expect(['exec Mergable', 'exec Mergable', 'undo Mergable/Mergable']).to.be.eql(operations);
        await commandStack.redo();
        expect(3).to.be.equal(viewerUpdates);
        expect(['exec Mergable', 'exec Mergable', 'undo Mergable/Mergable',
                'redo Mergable/Mergable']).to.be.eql(operations);
        await commandStack.execute(foo);
        expect(4).to.be.equal(viewerUpdates);
        expect(['exec Mergable', 'exec Mergable', 'undo Mergable/Mergable',
                'redo Mergable/Mergable', 'exec Foo']).to.be.eql(operations);
        expect(0).to.be.equal(hiddenViewerUpdates);
    });

    it('handles hidden command', async () => {
        operations = [];
        viewerUpdates = 0;
        hiddenViewerUpdates = 0;
        await commandStack.executeAll([foo, bar]);
        expect(1).to.be.equal(viewerUpdates);
        expect(0).to.be.equal(hiddenViewerUpdates);
        expect(['exec Foo', 'exec Bar']).to.be.eql(operations);
        await commandStack.execute(hidden);
        expect(1).to.be.equal(viewerUpdates);
        expect(1).to.be.equal(hiddenViewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec Hidden']).to.be.eql(operations);
        await commandStack.undo();
        expect(2).to.be.equal(viewerUpdates);
        expect(1).to.be.equal(hiddenViewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec Hidden', 'undo Bar']).to.be.eql(operations);
        await commandStack.execute(hidden);
        expect(2).to.be.equal(viewerUpdates);
        expect(2).to.be.equal(hiddenViewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec Hidden', 'undo Bar', 'exec Hidden']).to.be.eql(operations);
        await commandStack.redo();
        expect(3).to.be.equal(viewerUpdates);
        expect(2).to.be.equal(hiddenViewerUpdates);
        expect(['exec Foo', 'exec Bar', 'exec Hidden', 'undo Bar', 'exec Hidden', 'redo Bar']).to.be.eql(operations);
    });
});
