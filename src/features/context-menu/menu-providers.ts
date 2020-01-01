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
import { injectable, multiInject, optional } from "inversify";

import { MenuItem } from "./context-menu-service";
import { SModelRoot } from "../../base/model/smodel";
import { Point } from "../../utils/geometry";
import { LabeledAction } from "../../base/actions/action";
import { TYPES } from "../../base/types";
import { isDeletable, DeleteElementAction } from "../edit/delete";
import { isSelected } from "../select/model";

export interface IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<LabeledAction[]>;
}

@injectable()
export class ContextMenuProviderRegistry implements IContextMenuItemProvider {

    constructor(@multiInject(TYPES.IContextMenuItemProvider) @optional() protected menuProviders: IContextMenuItemProvider[] = []) { }

    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point) {
        const menues = this.menuProviders.map(provider => provider.getItems(root, lastMousePosition));
        return Promise.all(menues).then(this.flattenAndRestructure);
    }

    private flattenAndRestructure(p: MenuItem[][]): MenuItem[] {
        let menuItems = p.reduce((acc, promise) => promise !== undefined ? acc.concat(promise) : acc, []);
        const menuItemsWithParentId = menuItems.filter(menuItem => menuItem.parentId);
        for (const menuItem of menuItemsWithParentId) {
            if (menuItem.parentId) {
                const fragments = menuItem.parentId.split(".");
                let matchingParent: MenuItem | undefined = undefined;
                let nextParents = menuItems;
                for (const fragment of fragments) {
                    matchingParent = nextParents.find(item => fragment === item.id);
                    if (matchingParent && matchingParent.children)
                        nextParents = matchingParent.children;
                }
                if (matchingParent) {
                    if (matchingParent.children) {
                        matchingParent.children.push(menuItem);
                    } else {
                        matchingParent.children = [menuItem];
                    }
                    menuItems = menuItems.filter(item => item !== menuItem);
                }
            }
        }
        return menuItems;
    }
}

@injectable()
export class DeleteContextMenuItemProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point): Promise<MenuItem[]> {
        const selectedElements = Array.from(root.index.all().filter(isSelected).filter(isDeletable));
        return Promise.resolve([
            {
                id: "delete",
                label: "Delete",
                sortString: "d",
                group: "edit",
                actions: [new DeleteElementAction(selectedElements.map(e => e.id))],
                isEnabled: () => selectedElements.length > 0
            }
        ]);
    }
}
