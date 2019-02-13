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
import { Action } from "../../base/actions/action";
import { CommandExecutionContext } from "../../base/commands/command";
import { SModelRoot } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { toArray } from "../../utils/iterable";
import { ILogger } from "../../utils/logging";
import { isNameable, name } from "../nameable/model";
import { CenterAction } from "../viewport/center-fit";
import { SelectAction } from "../select/select";

export interface ICommandPaletteActionProvider {
    getActions(context: CommandExecutionContext): Promise<LabeledAction[]>;
}

export type ICommandPaletteActionProviderRegistry = () => Promise<ICommandPaletteActionProvider>;

@injectable()
export class CommandPaletteActionProviderRegistry implements ICommandPaletteActionProvider {
    public actionProvider: ICommandPaletteActionProvider[] = [];

    constructor(@multiInject(TYPES.ICommandPaletteActionProvider) @optional() protected registeredActionProviders: ICommandPaletteActionProvider[] = []) {
        for (const registeredProvider of registeredActionProviders) {
            this.actionProvider.push(registeredProvider);
        }
    }

    getActions(context: CommandExecutionContext): Promise<LabeledAction[]> {
        const actionLists = this.actionProvider.map(provider => provider.getActions(context));
        return Promise.all(actionLists).then(p => p.reduce((acc, promise) => acc.concat(promise)));
    }
}

export class LabeledAction {
    constructor(readonly label: string, readonly actions: Action[]) { }
}

@injectable()
export class RevealNamedElementActionProvider implements ICommandPaletteActionProvider {

    constructor(@inject(TYPES.ILogger) protected logger: ILogger) { }

    getActions(context: CommandExecutionContext): Promise<LabeledAction[]> {
        return Promise.resolve(this.createSelectActions(context.root));
    }

    createSelectActions(modelRoot: SModelRoot): LabeledAction[] {
        const nameables = toArray(modelRoot.index.all().filter(element => isNameable(element)));
        return nameables.map(nameable => new LabeledAction(`Reveal ${name(nameable)}`,
            [new SelectAction([nameable.id]), new CenterAction([nameable.id])]));
    }
}
