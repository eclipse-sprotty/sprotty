/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { inject, injectable, multiInject, optional } from "inversify";
import { InstanceRegistry } from "../../utils/registry";
import { Action } from "../actions/action";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer } from "../actions/action-handler";
import { CommandExecutionContext, CommandResult, ICommand, SystemCommand } from "../commands/command";
import { TYPES } from "../types";
import { IUIExtension } from "./ui-extension";

/**
 * Action requesting to show the UI extension with the specified `id`.
 */
export class ShowUIExtensionAction implements Action {
    static KIND = "showUIExtension";
    readonly kind = ShowUIExtensionAction.KIND;
    constructor(public readonly extensionId: string) { }
}

/**
 * Action requesting to hide the UI extension with the specified `id`.
 */
export class HideUIExtensionAction implements Action {
    static KIND = "hideUIExtension";
    readonly kind = HideUIExtensionAction.KIND;
    constructor(public readonly extensionId: string) { }
}

/**
 * The registry maintaining UI extensions registered via `TYPES.IUIExtension`.
 */
@injectable()
export class UIExtensionRegistry extends InstanceRegistry<IUIExtension>  {
    constructor(@multiInject(TYPES.IUIExtension) @optional() extensions: (IUIExtension)[] = []) {
        super();
        extensions.forEach((extension) => this.register(extension.id, extension));
    }
}

/**
 * Initalizer and handler for actions related to UI extensions.
 */
@injectable()
export class UIExtensionActionHandlerInitializer implements IActionHandlerInitializer, IActionHandler {

    @inject(TYPES.UIExtensionRegistry) protected readonly registry: UIExtensionRegistry;

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(ShowUIExtensionAction.KIND, this);
        registry.register(HideUIExtensionAction.KIND, this);
    }

    handle(action: Action): void | ICommand | Action {
        if (action instanceof ShowUIExtensionAction) {
            return new UIExtensionActionCommand((context) => {
                this.withExtension(action.extensionId, (extension) => {
                    extension.show(context);
                });
            });
        } else if (action instanceof HideUIExtensionAction) {
            return new UIExtensionActionCommand((context) => {
                this.withExtension(action.extensionId, (extension) => {
                    extension.hide();
                });
            });
        }
    }

    protected withExtension(extensionId: string, func: (extension: IUIExtension) => void) {
        const extension = this.registry.get(extensionId);
        if (extension) {
            func(extension);
        }
    }
}

/**
 * A system command that doesn't change the model but just performs a specified `effect`.
 */
@injectable()
export class UIExtensionActionCommand extends SystemCommand {

    constructor(readonly effect: (context: CommandExecutionContext) => void) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        this.effect(context);
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandResult {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        return context.root;
    }
}
