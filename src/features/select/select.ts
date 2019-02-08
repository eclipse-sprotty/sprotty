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

import { inject, injectable, optional } from 'inversify';
import { VNode } from "snabbdom/vnode";
import { Action } from "../../base/actions/action";
import { Command, CommandExecutionContext } from "../../base/commands/command";
import { SChildElement, SModelElement, SModelRoot, SParentElement } from '../../base/model/smodel';
import { findParentByFeature } from "../../base/model/smodel-utils";
import { TYPES } from '../../base/types';
import { KeyListener } from "../../base/views/key-tool";
import { MouseListener } from "../../base/views/mouse-tool";
import { setClass } from "../../base/views/vnode-utils";
import { isCtrlOrCmd } from "../../utils/browser";
import { toArray } from '../../utils/iterable';
import { matchesKeystroke } from "../../utils/keyboard";
import { ButtonHandlerRegistry } from '../button/button-handler';
import { SButton } from '../button/model';
import { SwitchEditModeAction } from '../edit/edit-routing';
import { SRoutingHandle } from '../routing/model';
import { SRoutableElement } from '../routing/model';
import { isSelectable } from "./model";

/**
 * Triggered when the user changes the selection, e.g. by clicking on a selectable element. The resulting
 * SelectCommand changes the `selected` state accordingly, so the elements can be rendered differently.
 * This action is also forwarded to the diagram server, if present, so it may react on the selection change.
 * Furthermore, the server can send such an action to the client in order to change the selection programmatically.
 */
export class SelectAction implements Action {
    kind = SelectCommand.KIND;

    constructor(public readonly selectedElementsIDs: string[] = [],
                public readonly deselectedElementsIDs: string[] = []) {
    }
}

/**
 * Programmatic action for selecting or deselecting all elements.
 */
export class SelectAllAction implements Action {
    kind = SelectAllCommand.KIND;

    /**
     * If `select` is true, all elements are selected, othewise they are deselected.
     */
    constructor(public readonly select: boolean = true) {
    }
}

export type ElementSelection = {
    element: SChildElement
    parent: SParentElement
    index: number
};

@injectable()
export class SelectCommand extends Command {
    static readonly KIND = 'elementSelected';

    protected selected: ElementSelection[] = [];
    protected deselected: ElementSelection[] = [];

    constructor(@inject(TYPES.Action) public action: SelectAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const model = context.root;
        this.action.selectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElement && isSelectable(element)) {
                this.selected.push({
                    element,
                    parent: element.parent,
                    index: element.parent.children.indexOf(element)
                });
            }
        });
        this.action.deselectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElement && isSelectable(element)) {
                this.deselected.push({
                    element,
                    parent: element.parent,
                    index: element.parent.children.indexOf(element)
                });
            }
        });
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): SModelRoot {
        for (let i = this.selected.length - 1; i >= 0; --i) {
            const selection = this.selected[i];
            const element = selection.element;
            if (isSelectable(element))
                element.selected = false;
            selection.parent.move(element, selection.index);
        }
        this.deselected.reverse().forEach(selection => {
            if (isSelectable(selection.element))
                selection.element.selected = true;
        });
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        for (let i = 0; i < this.selected.length; ++i) {
            const selection = this.selected[i];
            const element = selection.element;
            const childrenLength = selection.parent.children.length;
            selection.parent.move(element, childrenLength - 1);
        }
        this.deselected.forEach(selection => {
            if (isSelectable(selection.element))
                selection.element.selected = false;
        });
        this.selected.forEach(selection => {
            if (isSelectable(selection.element))
                selection.element.selected = true;
        });
        return context.root;
    }
}

@injectable()
export class SelectAllCommand extends Command {
    static readonly KIND = 'allSelected';

    protected previousSelection: Record<string, boolean> = {};

    constructor(@inject(TYPES.Action) public action: SelectAllAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        this.selectAll(context.root, this.action.select);
        return context.root;
    }

    protected selectAll(element: SParentElement, newState: boolean): void {
        if (isSelectable(element)) {
            this.previousSelection[element.id] = element.selected;
            element.selected = newState;
        }
        for (const child of element.children) {
            this.selectAll(child, newState);
        }
    }

    undo(context: CommandExecutionContext): SModelRoot {
        const index = context.root.index;
        for (const id in this.previousSelection) {
            if (this.previousSelection.hasOwnProperty(id)) {
                const element = index.getById(id);
                if (element !== undefined && isSelectable(element))
                    element.selected = this.previousSelection[id];
            }
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        this.selectAll(context.root, this.action.select);
        return context.root;
    }
}

export class SelectMouseListener extends MouseListener {

    constructor(@inject(ButtonHandlerRegistry)@optional() protected buttonHandlerRegistry: ButtonHandlerRegistry) {
        super();
    }

    wasSelected = false;
    hasDragged = false;

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const result: Action[] = [];
        if (event.button === 0) {
            if (this.buttonHandlerRegistry !== undefined && target instanceof SButton && target.enabled) {
                const buttonHandler = this.buttonHandlerRegistry.get(target.type);
                if (buttonHandler !== undefined)
                    return buttonHandler.buttonPressed(target);
            }
            const selectableTarget = findParentByFeature(target, isSelectable);
            if (selectableTarget !== undefined || target instanceof SModelRoot) {
                this.hasDragged = false;
                let deselect: SModelElement[] = [];
                // multi-selection?
                if (!isCtrlOrCmd(event)) {
                    deselect = toArray(target.root.index.all()
                        .filter(element => isSelectable(element) && element.selected
                            && !(selectableTarget instanceof SRoutingHandle && element === selectableTarget.parent as SModelElement)));
                }
                if (selectableTarget !== undefined) {
                    if (!selectableTarget.selected) {
                        this.wasSelected = false;
                        result.push(new SelectAction([selectableTarget.id], deselect.map(e => e.id)));
                        const routableDeselect = deselect.filter(e => e instanceof SRoutableElement).map(e => e.id);
                        if (selectableTarget instanceof SRoutableElement)
                            result.push(new SwitchEditModeAction([selectableTarget.id], routableDeselect));
                        else if (routableDeselect.length > 0)
                            result.push(new SwitchEditModeAction([], routableDeselect));
                    } else if (isCtrlOrCmd(event)) {
                        this.wasSelected = false;
                        result.push(new SelectAction([], [selectableTarget.id]));
                        if (selectableTarget instanceof SRoutableElement)
                            result.push(new SwitchEditModeAction([], [selectableTarget.id]));
                    } else {
                        this.wasSelected = true;
                    }
                } else {
                    result.push(new SelectAction([], deselect.map(e => e.id)));
                    const routableDeselect = deselect.filter(e => e instanceof SRoutableElement).map(e => e.id);
                    if (routableDeselect.length > 0)
                        result.push(new SwitchEditModeAction([], routableDeselect));
                }
            }
        }
        return result;
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        this.hasDragged = true;
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        if (event.button === 0) {
            if (!this.hasDragged) {
                const selectableTarget = findParentByFeature(target, isSelectable);
                if (selectableTarget !== undefined && this.wasSelected) {
                    return [new SelectAction([selectableTarget.id], [])];
                }
            }
        }
        this.hasDragged = false;
        return [];
    }

    decorate(vnode: VNode, element: SModelElement): VNode {
        const selectableTarget = findParentByFeature(element, isSelectable);
        if (selectableTarget !== undefined)
            setClass(vnode, 'selected', selectableTarget.selected);
        return vnode;
    }
}

export class SelectKeyboardListener extends KeyListener {
    keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyA', 'ctrlCmd')) {
            const selected = toArray(element.root.index.all().filter(e => isSelectable(e)).map(e => e.id));
            return [new SelectAction(selected, [])];
        }
        return [];
    }
}
