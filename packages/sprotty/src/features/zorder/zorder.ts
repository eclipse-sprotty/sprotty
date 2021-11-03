/********************************************************************************
 * Copyright (c) 2019 TypeFox and others.
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

import { injectable, inject } from "inversify";
import { TYPES } from "../../base/types";
import { SModelRoot, SChildElement, SModelElement, SParentElement } from '../../base/model/smodel';
import { Action } from "../../base/actions/action";
import { Command, CommandExecutionContext } from "../../base/commands/command";
import { SRoutableElement, SConnectableElement } from "../routing/model";

/**
 * Action to render the selected elements in front of others by manipulating the z-order.
 */
export class BringToFrontAction implements Action {
    static readonly KIND = 'bringToFront';
    kind = BringToFrontAction.KIND;

    constructor(public readonly elementIDs: string[]) {
    }
}

export type ZOrderElement = {
    element: SChildElement
    index: number
};

@injectable()
export class BringToFrontCommand extends Command {
    static readonly KIND = BringToFrontAction.KIND;

    protected selected: ZOrderElement[] = [];

    constructor(@inject(TYPES.Action) public action: BringToFrontAction) {
        super();
    }

    execute(context: CommandExecutionContext): SModelRoot {
        const model = context.root;
        this.action.elementIDs.forEach(id => {
            const element = model.index.getById(id);
            if (element instanceof SRoutableElement) {
                if (element.source)
                    this.addToSelection(element.source);
                if (element.target)
                    this.addToSelection(element.target);
            }
            if (element instanceof SChildElement) {
                this.addToSelection(element);
            }
            this.includeConnectedEdges(element);
        });
        return this.redo(context);
    }

    protected includeConnectedEdges(element?: SModelElement): void {
        if (element instanceof SConnectableElement) {
            element.incomingEdges.forEach(edge => this.addToSelection(edge));
            element.outgoingEdges.forEach(edge => this.addToSelection(edge));
        }
        if (element instanceof SParentElement) {
            for (const child of element.children) {
                this.includeConnectedEdges(child);
            }
        }
    }

    protected addToSelection(element: SChildElement): void {
        this.selected.push({
            element: element,
            index: element.parent.children.indexOf(element)
        });
    }

    undo(context: CommandExecutionContext): SModelRoot {
        for (let i = this.selected.length - 1; i >= 0; i--) {
            const selection = this.selected[i];
            const element = selection.element;
            element.parent.move(element, selection.index);
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): SModelRoot {
        for (let i = 0; i < this.selected.length; i++) {
            this.bringToFront(this.selected[i]);
        }
        return context.root;
    }

    protected bringToFront(selection: ZOrderElement) {
        const element = selection.element;
        const childrenLength = element.parent.children.length;
        element.parent.move(element, childrenLength - 1);
    }
}
