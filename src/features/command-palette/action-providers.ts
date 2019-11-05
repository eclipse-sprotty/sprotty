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
import { LabeledAction } from "../../base/actions/action";
import { SModelRoot } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { toArray } from "../../utils/iterable";
import { ILogger } from "../../utils/logging";
import { isNameable, name } from "../nameable/model";
import { SelectAction, SelectAllAction } from "../select/select";
import { CenterAction } from "../viewport/center-fit";
import { Point } from "../../utils/geometry";

export interface ICommandPaletteActionProvider {
    getActions(root: Readonly<SModelRoot>, text: string, lastMousePosition?: Point, index?: number): Promise<LabeledAction[]>;
}

@injectable()
export class CommandPaletteActionProviderRegistry implements ICommandPaletteActionProvider {

    constructor(@multiInject(TYPES.ICommandPaletteActionProvider) @optional() protected actionProviders: ICommandPaletteActionProvider[] = []) {
    }

    getActions(root: Readonly<SModelRoot>, text: string, lastMousePosition?: Point, index?: number) {
        const actionLists = this.actionProviders.map(provider => provider.getActions(root, text, lastMousePosition, index));
        return Promise.all(actionLists).then(p => p.reduce((acc, promise) => promise !== undefined ? acc.concat(promise) : acc));
    }
}

@injectable()
export class RevealNamedElementActionProvider implements ICommandPaletteActionProvider {

    constructor(@inject(TYPES.ILogger) protected logger: ILogger) { }

    getActions(root: Readonly<SModelRoot>, text: string, lastMousePosition?: Point, index?: number) {
        if (index !== undefined && index % 2 === 0)
            return Promise.resolve(this.createSelectActions(root));
        else
            return Promise.resolve([new LabeledAction("Select all", [new SelectAllAction()])]);
    }

    createSelectActions(modelRoot: SModelRoot): LabeledAction[] {
        const nameables = toArray(modelRoot.index.all().filter(element => isNameable(element)));
        return nameables.map(nameable => new LabeledAction(`Reveal ${name(nameable)}`,
            [new SelectAction([nameable.id]), new CenterAction([nameable.id])], 'fa-eye'));
    }
}
