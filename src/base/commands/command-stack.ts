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

import { inject, injectable, postConstruct } from "inversify";
import { TYPES } from "../types";
import { ILogger } from "../../utils/logging";
import { EMPTY_ROOT, IModelFactory } from "../model/smodel-factory";
import { SModelRoot } from "../model/smodel";
import { AnimationFrameSyncer } from "../animations/animation-frame-syncer";
import { IViewer, IViewerProvider } from "../views/viewer";
import { CommandStackOptions } from './command-stack-options';
import {
    HiddenCommand, ICommand, CommandExecutionContext, CommandResult, SystemCommand, MergeableCommand, PopupCommand
} from './command';

/**
 * The component that holds the current model and applies the commands
 * to change it.
 *
 * The command stack is called by the ActionDispatcher and forwards the
 * changed model to the Viewer that renders it.
 */
export interface ICommandStack {
    /**
     * Executes the given command on the current model and returns a
     * Promise for the new result.
     *
     * Unless it is a special command, it is pushed to the undo stack
     * such that it can be rolled back later and the redo stack is
     * cleared.
     */
    execute(command: ICommand): Promise<SModelRoot>

    /**
     * Executes all of the given commands. As opposed to calling
     * execute() multiple times, the Viewer is only updated once after
     * the last command has been executed.
     */
    executeAll(commands: ICommand[]): Promise<SModelRoot>

    /**
     * Takes the topmost command from the undo stack, undoes its
     * changes and pushes it ot the redo stack. Returns a Promise for
     * the changed model.
     */
    undo(): Promise<SModelRoot>

    /**
     * Takes the topmost command from the redo stack, redoes its
     * changes and pushes it ot the undo stack. Returns a Promise for
     * the changed model.
     */
    redo(): Promise<SModelRoot>
}

/**
 * As part of the event cylce, the ICommandStack should be injected
 * using a provider to avoid cyclic injection dependencies.
 */
export type CommandStackProvider = () => Promise<ICommandStack>;

/**
 * The implementation of the ICommandStack. Clients should not use this
 * class directly.
 *
 * The command stack holds the current model as the result of the current
 * promise. When a new command is executed/undone/redone, its execution is
 * chained using <code>Promise#then()</code> to the current Promise. This
 * way we can handle long running commands without blocking the current
 * thread.
 *
 * The command stack also does the special handling for special commands:
 *
 * System commands should be transparent to the user and as such be
 * automatically undone/redone with the next plain command. Additional care
 * must be taken that system commands that are executed after undo don't
 * break the correspondence between the topmost commands on the undo and
 * redo stacks.
 *
 * Hidden commands only tell the viewer to render a hidden model such that
 * its bounds can be extracted from the DOM and forwarded as separate actions.
 * Hidden commands should not leave any trace on the undo/redo/off stacks.
 *
 * Mergeable commands should be merged with their predecessor if possible,
 * such that e.g. multiple subsequent moves of the smae element can be undone
 * in one single step.
 */
@injectable()
export class CommandStack implements ICommandStack {

    @inject(TYPES.IModelFactory) protected modelFactory: IModelFactory;
    @inject(TYPES.IViewerProvider) protected viewerProvider: IViewerProvider;
    @inject(TYPES.ILogger) protected logger: ILogger;
    @inject(TYPES.AnimationFrameSyncer) protected syncer: AnimationFrameSyncer;
    @inject(TYPES.CommandStackOptions) protected options: CommandStackOptions;

    protected currentPromise: Promise<CommandStackState>;

    protected viewer?: IViewer;

    protected undoStack: ICommand[] = [];
    protected redoStack: ICommand[] = [];

    /**
     * System commands should be transparent to the user in undo/redo
     * operations. When a system command is executed when the redo
     * stack is not empty, it is pushed to offStack instead.
     *
     * On redo, all commands form this stack are undone such that the
     * redo operation gets the exact same model as when it was executed
     * first.
     *
     * On undo, all commands form this stack are undone as well as
     * system ommands should be transparent to the user.
     */
    protected offStack: SystemCommand[] = [];

    @postConstruct()
    protected initialize() {
        this.currentPromise = Promise.resolve({
            root: this.modelFactory.createRoot(EMPTY_ROOT),
            hiddenRoot: undefined,
            popupRoot: undefined,
            rootChanged: false,
            hiddenRootChanged: false,
            popupChanged: false
        });
    }

    protected get currentModel(): Promise<SModelRoot> {
        return this.currentPromise.then(
            state => state.root
        );
    }

    executeAll(commands: ICommand[]): Promise<SModelRoot> {
        commands.forEach(
            command => {
                this.logger.log(this, 'Executing', command);
                this.handleCommand(command, command.execute, this.mergeOrPush);
            }
        );
        return this.thenUpdate();
    }

    execute(command: ICommand): Promise<SModelRoot> {
        this.logger.log(this, 'Executing', command);
        this.handleCommand(command, command.execute, this.mergeOrPush);
        return this.thenUpdate();
    }

    undo(): Promise<SModelRoot> {
        this.undoOffStackSystemCommands();
        this.undoPreceedingSystemCommands();
        const command = this.undoStack.pop();
        if (command !== undefined) {
            this.logger.log(this, 'Undoing', command);
            this.handleCommand(command, command.undo, (c: ICommand, context: CommandExecutionContext) => {
                this.redoStack.push(c);
            });
        }
        return this.thenUpdate();
    }

    redo(): Promise<SModelRoot> {
        this.undoOffStackSystemCommands();
        const command = this.redoStack.pop();
        if (command !== undefined) {
            this.logger.log(this, 'Redoing', command);
            this.handleCommand(command, command.redo, (c: ICommand, context: CommandExecutionContext) => {
                this.pushToUndoStack(c);
            });
        }
        this.redoFollowingSystemCommands();
        return this.thenUpdate();
    }

    /**
     * Chains the current promise with another Promise that performs the
     * given operation on the given command.
     *
     * @param beforeResolve a function that is called directly before
     * resolving the Promise to return the new model. Usually puts the
     * command on the appropriate stack.
     */
    protected handleCommand(command: ICommand,
                            operation: (context: CommandExecutionContext) => CommandResult,
                            beforeResolve: (command: ICommand, context: CommandExecutionContext) => void) {
        this.currentPromise = this.currentPromise.then(state =>
            new Promise((resolve: (result: CommandStackState) => void, reject: (reason?: any) => void) => {
                const context = this.createContext(state.root);

                let newResult: CommandResult;
                try {
                    newResult = operation.call(command, context);
                } catch (error) {
                    this.logger.error(this, "Failed to execute command:", error);
                    newResult = state.root;
                }

                if (command instanceof HiddenCommand) {
                    resolve({
                        ...state, ...{
                            hiddenRoot: newResult as SModelRoot,
                            hiddenRootChanged: true
                        }
                    });
                } else if (command instanceof PopupCommand) {
                    resolve({
                        ...state, ...{
                            popupRoot: newResult as SModelRoot,
                            popupChanged: true
                        }
                    });
                } else if (newResult instanceof Promise) {
                    newResult.then(
                        (newModel: SModelRoot) => {
                            beforeResolve.call(this, command, context);
                            resolve({
                                ...state, ...{
                                    root: newModel,
                                    rootChanged: true
                                }
                            });
                        }
                    );
                } else {
                    beforeResolve.call(this, command, context);
                    resolve({
                        ...state, ...{
                            root: newResult,
                            rootChanged: true
                        }
                    });
                }
            })
        );
    }

    protected pushToUndoStack(command: ICommand) {
        this.undoStack.push(command);
        if (this.options.undoHistoryLimit >= 0 && this.undoStack.length > this.options.undoHistoryLimit)
            this.undoStack.splice(0, this.undoStack.length - this.options.undoHistoryLimit);
    }

    /**
     * Notifies the Viewer to render the new model and/or the new hidden model
     * and returns a Promise for the new model.
     */
    protected thenUpdate(): Promise<SModelRoot> {
        this.currentPromise = this.currentPromise.then(async state => {
            if (state.hiddenRootChanged && state.hiddenRoot !== undefined)
                await this.updateHidden(state.hiddenRoot);
            if (state.rootChanged)
                await this.update(state.root);
            if (state.popupChanged && state.popupRoot !== undefined)
                await this.updatePopup(state.popupRoot);
            return {
                root: state.root,
                hiddenRoot: undefined,
                popupRoot: undefined,
                rootChanged: false,
                hiddenRootChanged: false,
                popupChanged: false
            };
        });
        return this.currentModel;
    }

    /**
     * Notify the <code>Viewer</code> that the model has changed.
     */
    async update(model: SModelRoot): Promise<void> {
        if (this.viewer === undefined)
            this.viewer = await this.viewerProvider();
        this.viewer.update(model);
    }

    /**
     * Notify the <code>Viewer</code> that the hidden model has changed.
     */
    async updateHidden(model: SModelRoot): Promise<void> {
        if (this.viewer === undefined)
            this.viewer = await this.viewerProvider();
        this.viewer.updateHidden(model);
    }

    /**
     * Notify the <code>Viewer</code> that the model has changed.
     */
    async updatePopup(model: SModelRoot): Promise<void> {
        if (this.viewer === undefined)
            this.viewer = await this.viewerProvider();
        this.viewer.updatePopup(model);
    }

    /**
     * Handling of commands after their execution.
     *
     * Hidden commands are not pushed to any stack.
     *
     * System commands are pushed to the <code>offStack</code> when the redo
     * stack is not empty, allowing to undo the before a redo to keep the chain
     * of commands consistent.
     *
     * Mergable commands are merged if possible.
     */
    protected mergeOrPush(command: ICommand, context: CommandExecutionContext): void {
        if (command instanceof HiddenCommand)
            return;
        if (command instanceof SystemCommand && this.redoStack.length > 0) {
            this.offStack.push(command);
        } else {
            this.offStack.forEach(c => this.undoStack.push(c));
            this.offStack = [];
            this.redoStack = [];
            if (this.undoStack.length > 0) {
                const lastCommand = this.undoStack[this.undoStack.length - 1];
                if (lastCommand instanceof MergeableCommand && lastCommand.merge(command, context))
                    return;
            }
            this.pushToUndoStack(command);
        }
    }

    /**
     * Reverts all system commands on the offStack.
     */
    protected undoOffStackSystemCommands(): void {
        let command = this.offStack.pop();
        while (command !== undefined) {
            this.logger.log(this, 'Undoing off-stack', command);
            this.handleCommand(command, command.undo, () => {});
            command = this.offStack.pop();
        }
    }

    /**
     * System commands should be transparent to the user, so this method
     * is called from <code>undo()</code> to revert all system commands
     * at the top of the undoStack.
     */
    protected undoPreceedingSystemCommands(): void {
        let command = this.undoStack[this.undoStack.length - 1];
        while (command !== undefined && command instanceof SystemCommand) {
            this.undoStack.pop();
            this.logger.log(this, 'Undoing', command);
            this.handleCommand(command, command.undo, (c: ICommand, context: CommandExecutionContext) => {
                this.redoStack.push(c);
            });
            command = this.undoStack[this.undoStack.length - 1];
        }
    }

    /**
     * System commands should be transparent to the user, so this method
     * is called from <code>redo()</code> to re-execute all system commands
     * at the top of the redoStack.
     */
    protected redoFollowingSystemCommands(): void {
        let command = this.redoStack[this.redoStack.length - 1];
        while (command !== undefined && command instanceof SystemCommand) {
            this.redoStack.pop();
            this.logger.log(this, 'Redoing ', command);
            this.handleCommand(command, command.redo, (c: ICommand, context: CommandExecutionContext) => {
                this.pushToUndoStack(c);
            });
            command = this.redoStack[this.redoStack.length - 1];
        }
    }

    /**
     * Assembles the context object that is passed to the commands execution method.
     */
    protected createContext(currentModel: SModelRoot): CommandExecutionContext {
        return {
            root: currentModel,
            modelChanged: this,
            modelFactory: this.modelFactory,
            duration: this.options.defaultDuration,
            logger: this.logger,
            syncer: this.syncer
        };
    }
}

/**
 * Internal type to pass the results between the <code>Promises</code> in the
 * <code>ICommandStack</code>.
 */
export interface CommandStackState {
    root: SModelRoot
    hiddenRoot: SModelRoot | undefined
    popupRoot: SModelRoot | undefined
    rootChanged: boolean
    hiddenRootChanged: boolean
    popupChanged: boolean
}

