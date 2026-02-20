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
import { Action } from "sprotty-protocol";
import { InstanceRegistry } from "../../utils/registry.js";
import { CommandExecutionContext, CommandReturn, SystemCommand } from "../commands/command.js";
import { TYPES } from "../types.js";
import { IUIExtension } from "./ui-extension.js";

/**
 * The registry maintaining UI extensions registered via `TYPES.IUIExtension`.
 */
@injectable()
export class UIExtensionRegistry extends InstanceRegistry<IUIExtension>  {
    constructor(@multiInject(TYPES.IUIExtension) @optional() extensions: (IUIExtension)[] = []) {
        super();
        extensions.forEach((extension) => this.register(extension.id(), extension));
    }
}

/**
 * Action to set the visibility state of the UI extension with the specified `id`.
 */
export interface SetUIExtensionVisibilityAction extends Action {
    kind: typeof SetUIExtensionVisibilityAction.KIND;
    extensionId: string
    visible: boolean
    contextElementsId: string[]
}
export namespace SetUIExtensionVisibilityAction {
    export const KIND = "setUIExtensionVisibility";

    export function create(options: { extensionId: string, visible: boolean, contextElementsId?: string[] }): SetUIExtensionVisibilityAction {
        return {
            kind: KIND,
            extensionId: options.extensionId,
            visible: options.visible,
            contextElementsId: options.contextElementsId ?? []
        };
    }
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
