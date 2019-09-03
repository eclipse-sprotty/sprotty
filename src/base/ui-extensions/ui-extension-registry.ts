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
import { CommandExecutionContext, SystemCommand, CommandReturn } from "../commands/command";
import { TYPES } from "../types";
import { IUIExtension } from "./ui-extension";

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
 * Action to set the visibility state of the UI extension with the specified `id`.
 */
export class SetUIExtensionVisibilityAction implements Action {
    static readonly KIND = "setUIExtensionVisibility";
    readonly kind = SetUIExtensionVisibilityAction.KIND;

    constructor(public readonly extensionId: string,
                public readonly visible: boolean,
                public readonly contextElementsId: string[] = []) {}
}

@injectable()
export class SetUIExtensionVisibilityCommand extends SystemCommand {
    static readonly KIND = SetUIExtensionVisibilityAction.KIND;

    @inject(TYPES.UIExtensionRegistry) protected readonly registry: UIExtensionRegistry;

    constructor(@inject(TYPES.Action) protected readonly action: SetUIExtensionVisibilityAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const extension = this.registry.get(this.action.extensionId);
        if (extension) {
            this.action.visible ? extension.show(context.root, ...this.action.contextElementsId) : extension.hide();
        }
        return { model: context.root, modelChanged: false };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root, modelChanged: false };
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root, modelChanged: false };
    }
}
