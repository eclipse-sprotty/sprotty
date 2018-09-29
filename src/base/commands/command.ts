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

import { ILogger } from "../../utils/logging";
import { SModelRoot } from "../model/smodel";
import { IModelFactory } from "../model/smodel-factory";
import { IViewer } from "../views/viewer";
import { AnimationFrameSyncer } from "../animations/animation-frame-syncer";
import { Action } from "../actions/action";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer } from "../actions/action-handler";
import { injectable, multiInject, optional } from "inversify";
import { TYPES } from "../types";

/**
 * A command holds the behaviour of an action.
 * It is executed on a command stack and can be undone / redone.
 *
 * A command should store all information it needs to undo itself at a
 * later stage. It typically resolves the model elements it is going
 * to manipulate as a first step in the execute method.
 *
 * Each command should define a static string property KIND that
 * matches the associated action. This is used as a key in the
 * ActionHandlerRegistry.
 *
 * Clients should not implement the ICommand interface directly but
 * rather inherit from one of its abstract implementators.
 */
export interface ICommand {
    /**
     * If this property is present, all following actions are blocked
     * until the function returns `true`.
     */
    readonly blockUntil?: (action: Action) => boolean;

    execute(context: CommandExecutionContext): CommandResult

    undo(context: CommandExecutionContext): CommandResult

    redo(context: CommandExecutionContext): CommandResult
}

/**
 * Commands return the changed model or a Promise for it. The latter
 * serves animating commands to render some intermediate states before
 * finishing. The CommandStack is in charge of chaining these promises,
 * such that they run sequentially only one at a time. Due to that
 * chaining, it is essential that a command does not make any assumption
 * on the state of the model before execute() is called.
 */
export type CommandResult = SModelRoot | Promise<SModelRoot>;

export interface ICommandFactory {
    KIND: string
    new (a: Action): ICommand
}

/**
 * Base class for all commands.
 */
export abstract class Command implements ICommand {

    abstract execute(context: CommandExecutionContext): CommandResult;

    abstract undo(context: CommandExecutionContext): CommandResult;

    abstract redo(context: CommandExecutionContext): CommandResult;
}

/**
 * A mergeable command can accumulate subsequent commands of the same kind.
 *
 * For example, multiple subsequent move commands can be merged to yield a
 * single command, such that undo will roll them back altogether. Otherwise
 * the user would have to push CTRL-Z for each mouse move element that
 * resuted in a command.
 */
export abstract class MergeableCommand extends Command {
    /**
     * Tries to merge the given command with this.
     *
     * @param command
     * @param context
     */
    merge(command: ICommand, context: CommandExecutionContext): boolean {
        return false;
    }
}


/**
 * A hidden command is used to trigger the rendering of a model on a
 * hidden canvas.
 *
 * Some graphical elements are styled using CSS, others have bounds that
 * require to layout their children before being computed. In such cases
 * we cannot tell about the size of elements without acutally rendering
 * the DOM. We render them to an invisible canvas. This can be achieved
 * using hidden commands.
 *
 * Hidden commands do not change the model directly, and are as such
 * neither undoable nor redoable. The command stack does not push them on
 * any stack and forwards the resulting model to the invisible viewer.
 */
export abstract class HiddenCommand extends Command {
    abstract execute(context: CommandExecutionContext): SModelRoot;

    undo(context: CommandExecutionContext): CommandResult {
        context.logger.error(this, 'Cannot undo a hidden command');
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        context.logger.error(this, 'Cannot redo a hidden command');
        return context.root;
    }
}

export abstract class PopupCommand extends Command {
}

/**
 * A system command is triggered by the system, e.g. in order to update bounds
 * in the model with data fetched from the DOM.
 *
 * As it is automatically triggered it should not count as a single command in
 * undo/redo operations. Into the bargain, such an automatic command could occur
 * after an undo and as such make the next redo command invalid because it is
 * based on a model state that has changed. The command stack handles system
 * commands in a special way to overcome these issues.
 */
export abstract class SystemCommand extends Command {
}

/**
 * The data that is passed into the execution methods of a command to give it
 * access to the context.
 */
export interface CommandExecutionContext {
    /** the current sprotty model */
    root: SModelRoot

    /**
     * used ot turn sprotty schema elements (e.g. from the action)
     * into model elements*/
    modelFactory: IModelFactory

    /** allows to give some feedback to the console */
    logger: ILogger

    /** Used for anmiations to trigger the rendering of a new frame */
    modelChanged: IViewer

    /** duration of an anmiation */
    duration: number

    /** provides the ticks for animations */
    syncer: AnimationFrameSyncer
}

export class CommandActionHandler implements IActionHandler {
    constructor(private commandType: ICommandFactory) {
    }

    handle(action: Action): ICommand {
        return new this.commandType(action);
    }
}

@injectable()
export class CommandActionHandlerInitializer implements IActionHandlerInitializer {

    constructor(@multiInject(TYPES.ICommand) @optional() protected commandCtrs: (ICommandFactory)[]) {

    }

    initialize(registry: ActionHandlerRegistry): void {
        this.commandCtrs.forEach(
            commandCtr => registry.registerCommand(commandCtr)
        );
    }
}
