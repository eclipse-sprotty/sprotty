/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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
import { VNode } from 'snabbdom';
import { Action, BringToFrontAction, GetSelectionAction, ResponseAction, SelectAction, SelectAllAction, SelectionResult } from 'sprotty-protocol/lib/actions';
import { Command, CommandExecutionContext } from '../../base/commands/command';
import { ModelRequestCommand } from '../../base/commands/request-command';
import { SChildElementImpl, SModelElementImpl, SModelRootImpl, SParentElementImpl } from '../../base/model/smodel';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { TYPES } from '../../base/types';
import { KeyListener } from '../../base/views/key-tool';
import { MouseListener } from '../../base/views/mouse-tool';
import { setClass } from '../../base/views/vnode-utils';
import { isCtrlOrCmd } from '../../utils/browser';
import { toArray } from '../../utils/iterable';
import { matchesKeystroke } from '../../utils/keyboard';
import { ButtonHandlerRegistry } from '../button/button-handler';
import { SButtonImpl } from '../button/model';
import { SwitchEditModeAction } from '../edit/edit-routing';
import { SRoutingHandleImpl } from '../routing/model';
import { SRoutableElementImpl } from '../routing/model';
import { findViewportScrollbar } from '../viewport/scroll';
import { isSelectable, Selectable } from './model';

@injectable()
export class SelectCommand extends Command {
    static readonly KIND = SelectAction.KIND;

    protected selected: (SChildElementImpl & Selectable)[] = [];
    protected deselected: (SChildElementImpl & Selectable)[] = [];

    constructor(@inject(TYPES.Action) public action: SelectAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRootImpl {
        const model = context.root;
        this.action.selectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElementImpl && isSelectable(element)) {
                this.selected.push(element);
            }
        });
        this.action.deselectedElementsIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SChildElementImpl && isSelectable(element)) {
                this.deselected.push(element);
            }
        });
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        for (const element of this.selected) {
            element.selected = false;
        }
        for (const element of this.deselected) {
            element.selected = true;
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRootImpl {
        for (const element of this.deselected) {
            element.selected = false;
        }
        for (const element of this.selected) {
            element.selected = true;
        }
        return context.root;
    }
}

@injectable()
export class SelectAllCommand extends Command {
    static readonly KIND = SelectAllAction.KIND;

    protected previousSelection: Record<string, boolean> = {};

    constructor(@inject(TYPES.Action) protected readonly action: SelectAllAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRootImpl {
        this.selectAll(context.root, this.action.select);
        return context.root;
    }

    protected selectAll(element: SParentElementImpl, newState: boolean): void {
        if (isSelectable(element)) {
            this.previousSelection[element.id] = element.selected;
            element.selected = newState;
        }
        for (const child of element.children) {
            this.selectAll(child, newState);
        }
    }

    undo(context: CommandExecutionContext): SModelRootImpl {
        const index = context.root.index;
        Object.keys(this.previousSelection).forEach(id => {
            const element = index.getById(id);
            if (element !== undefined && isSelectable(element))
                element.selected = this.previousSelection[id];
        });
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRootImpl {
        this.selectAll(context.root, this.action.select);
        return context.root;
    }
}

export class SelectMouseListener extends MouseListener {

    @inject(ButtonHandlerRegistry) @optional() protected buttonHandlerRegistry: ButtonHandlerRegistry;

    wasSelected = false;
    hasDragged = false;

    override mouseDown(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        if (event.button !== 0) {
            return [];
        }
        const buttonHandled = this.handleButton(target, event);
        if (buttonHandled) {
            return buttonHandled;
        }
        const selectableTarget = findParentByFeature(target, isSelectable);
        if (selectableTarget !== undefined || target instanceof SModelRootImpl) {
            this.hasDragged = false;
        }
        if (selectableTarget !== undefined) {
            let deselectedElements: SModelElementImpl[] = [];
            // multi-selection?
            if (!isCtrlOrCmd(event)) {
                deselectedElements = this.collectElementsToDeselect(target, selectableTarget);
            }
            if (selectableTarget !== undefined) {
                if (!selectableTarget.selected) {
                    this.wasSelected = false;
                    return this.handleSelectTarget(selectableTarget, deselectedElements, event);
                } else if (isCtrlOrCmd(event)) {
                    this.wasSelected = false;
                    return this.handleDeselectTarget(selectableTarget, event);
                } else {
                    this.wasSelected = true;
                }
            } else {
                return this.handleDeselectAll(deselectedElements, event);
            }
        }
        return [];
    }

    protected collectElementsToDeselect(target: SModelElementImpl, selectableTarget: (SModelElementImpl & Selectable) | undefined): SModelElementImpl[] {
        return toArray(target.root.index.all()
        .filter(element => isSelectable(element) && element.selected
            && !(selectableTarget instanceof SRoutingHandleImpl && element === selectableTarget.parent as SModelElementImpl)));
    }

    protected handleButton(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] | undefined {
        if (this.buttonHandlerRegistry !== undefined && target instanceof SButtonImpl && target.enabled) {
            const buttonHandler = this.buttonHandlerRegistry.get(target.type);
            if (buttonHandler !== undefined) {
                return buttonHandler.buttonPressed(target);
            }
        }
        return undefined;
    }

    protected handleSelectTarget(selectableTarget: SModelElementImpl & Selectable, deselectedElements: SModelElementImpl[], event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(SelectAction.create({ selectedElementsIDs: [selectableTarget.id], deselectedElementsIDs: deselectedElements.map(e => e.id) }));
        result.push(BringToFrontAction.create([selectableTarget.id]));
        const routableDeselect = deselectedElements.filter(e => e instanceof SRoutableElementImpl).map(e => e.id);
        if (selectableTarget instanceof SRoutableElementImpl) {
            result.push(SwitchEditModeAction.create({ elementsToActivate: [selectableTarget.id], elementsToDeactivate: routableDeselect }));
        } else if (routableDeselect.length > 0) {
            result.push(SwitchEditModeAction.create({ elementsToDeactivate: routableDeselect }));
        }
        return result;
    }

    protected handleDeselectTarget(selectableTarget: SModelElementImpl & Selectable, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(SelectAction.create({ selectedElementsIDs: [], deselectedElementsIDs: [selectableTarget.id] }));
        if (selectableTarget instanceof SRoutableElementImpl) {
            result.push(SwitchEditModeAction.create({ elementsToDeactivate: [selectableTarget.id] }));
        }
        return result;
    }

    protected handleDeselectAll(deselectedElements: SModelElementImpl[], event: MouseEvent): (Action | Promise<Action>)[] {
        const result: Action[] = [];
        result.push(SelectAction.create({ selectedElementsIDs: [], deselectedElementsIDs: deselectedElements.map(e => e.id) }));
        const routableDeselect = deselectedElements.filter(e => e instanceof SRoutableElementImpl).map(e => e.id);
        if (routableDeselect.length > 0) {
            result.push(SwitchEditModeAction.create({ elementsToDeactivate: routableDeselect }));
        }
        return result;
    }

    override mouseMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        this.hasDragged = true;
        return [];
    }

    override mouseUp(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        if (event.button === 0) {
            if (!this.hasDragged) {
                const selectableTarget = findParentByFeature(target, isSelectable);
                if (selectableTarget !== undefined) {
                    if (this.wasSelected) {
                        return [SelectAction.create({selectedElementsIDs:[selectableTarget.id],deselectedElementsIDs:[]})];
                    }
                } else if (target instanceof SModelRootImpl && !findViewportScrollbar(event)) {
                    // Mouse up on root but not over ViewPort's scroll bars > deselect all
                    return this.handleDeselectAll(this.collectElementsToDeselect(target, undefined), event);
                }
            }
        }
        this.hasDragged = false;
        return [];
    }

    override decorate(vnode: VNode, element: SModelElementImpl): VNode {
        const selectableTarget = findParentByFeature(element, isSelectable);
        if (selectableTarget !== undefined) {
            setClass(vnode, 'selected', selectableTarget.selected);
        }
        return vnode;
    }
}

@injectable()
export class GetSelectionCommand extends ModelRequestCommand {
    static readonly KIND = GetSelectionAction.KIND;

    protected previousSelection: Record<string, boolean> = {};

    constructor(@inject(TYPES.Action) protected readonly action: GetSelectionAction) {
        super();
    }

    protected retrieveResult(context: CommandExecutionContext): ResponseAction {
        const selection = context.root.index.all()
            .filter(e => isSelectable(e) && e.selected)
            .map(e => e.id);
        return SelectionResult.create(toArray(selection), this.action.requestId);
    }

}

export class SelectKeyboardListener extends KeyListener {
    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyA', 'ctrlCmd')) {
            return [ SelectAllAction.create()];
        }
        return [];
    }
}
