/********************************************************************************
 * Copyright (c) 2023 TypeFox and others.
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

import { inject, injectable } from 'inversify';
import {
    Anchor, EMPTY_ROOT, IActionDispatcher, IContextMenuItemProvider, IContextMenuService, LabeledAction, MenuItem,
    RequestExportSvgAction, SModelRootImpl, TYPES, ViewerOptions
} from 'sprotty';
import {
    CenterAction, DeleteElementAction, FitToScreenAction, GetSelectionAction, Point, SelectionResult, SetPopupModelAction
} from 'sprotty-protocol';

@injectable()
export class ClassContextMenuService implements IContextMenuService {

    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: IActionDispatcher;
    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;

    show(items: MenuItem[], anchor: Anchor, onHide?: (() => void) | undefined): void {
        this.actionDispatcher.dispatch(SetPopupModelAction.create(EMPTY_ROOT))
        const container = document.getElementById(this.viewerOptions.baseDiv);
        let menuNode: HTMLDivElement;
        const hideMenu = () => {
            container?.removeChild(menuNode);
            if (onHide) {
                onHide()
            }
        }
        menuNode = this.createMenu(items, hideMenu);
        menuNode.style.top = (anchor.y - 5) + 'px'
        menuNode.style.left = (anchor.x - 5) + 'px'


        container?.appendChild(menuNode);
        menuNode.onmouseleave = (e: MouseEvent) => hideMenu();
    }

    protected createMenu(items: MenuItem[], closeCallback: () => void): HTMLDivElement {
        const menuNode = document.createElement('div');
        menuNode.id = 'class-context-menu';
        menuNode.classList.add('class-context-menu');
        items.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.id = 'class-context-menu-item-' + index;
            menuItem.classList.add('class-context-menu-item');
            const itemEnabled = item.isEnabled ? item.isEnabled() : true;
            if (!itemEnabled)
                menuItem.classList.add('disabled-action');
            menuItem.textContent = item.label;
            menuItem.onclick = (e: MouseEvent) => {
                closeCallback();
                if (itemEnabled && item.actions.length > 0) {
                    this.actionDispatcher.dispatchAll(item.actions);
                }
            }
            menuNode.appendChild(menuItem);
        });
        return menuNode;
    }
}

@injectable()
export class ClassContextMenuItemProvider implements IContextMenuItemProvider {

    @inject(TYPES.IActionDispatcher) readonly actionDispatcher: IActionDispatcher;

    async getItems(root: Readonly<SModelRootImpl>, lastMousePosition?: Point | undefined): Promise<LabeledAction[]> {
        const selectionResult = await this.actionDispatcher.request<SelectionResult>(GetSelectionAction.create())
        return [
            new LabeledAction('Fit Diagram to Screen', [FitToScreenAction.create(root.children.map(child => child.id))]),
            new LabeledAction('Center Selection', [CenterAction.create(selectionResult.selectedElementsIDs)]),
            new LabeledAction('', []),
            new LabeledAction('Export SVG', [RequestExportSvgAction.create()]),
            new LabeledAction('', []),
            {
                ...new LabeledAction('Delete Selected', [DeleteElementAction.create(selectionResult.selectedElementsIDs)]),
                isEnabled: () => {
                    return selectionResult.selectedElementsIDs.length > 0
                }
            } as MenuItem
        ];
    }

}
