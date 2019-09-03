/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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

import { inject } from "inversify";
import { Action, isAction } from "../../base/actions/action";
import { CommandExecutionContext, CommandReturn, Command } from "../../base/commands/command";
import { SModelElement } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { MouseListener } from "../../base/views/mouse-tool";
import { KeyListener } from "../../base/views/key-tool";
import { matchesKeystroke } from "../../utils/keyboard";
import { isSelectable } from "../select/model";
import { toArray } from "../../utils/iterable";
import { EditableLabel, isEditableLabel, isWithEditableLabel } from "./model";

export class EditLabelAction implements Action {
    static KIND = 'EditLabel';
    kind = EditLabelAction.KIND;
    constructor(readonly labelId: string) { }
}

export function isEditLabelAction(element?: any): element is EditLabelAction {
    return isAction(element) && element.kind === EditLabelAction.KIND && 'labelId' in element;
}

export class ApplyLabelEditAction implements Action {
    static readonly KIND = 'applyLabelEdit';
    kind = ApplyLabelEditAction.KIND;

    constructor(readonly labelId: string, readonly text: string) { }
}

export class ResolvedLabelEdit {
    label: EditableLabel;
    oldLabel: string;
    newLabel: string;
}

export class ApplyLabelEditCommand extends Command {
    static readonly KIND = ApplyLabelEditAction.KIND;

    protected resolvedLabelEdit: ResolvedLabelEdit;

    constructor(@inject(TYPES.Action) protected readonly action: ApplyLabelEditAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const index = context.root.index;
        const label = index.getById(this.action.labelId);
        if (label && isEditableLabel(label)) {
            this.resolvedLabelEdit = { label, oldLabel: label.text, newLabel: this.action.text };
            label.text = this.action.text;
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.resolvedLabelEdit) {
            this.resolvedLabelEdit.label.text = this.resolvedLabelEdit.oldLabel;
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.resolvedLabelEdit) {
            this.resolvedLabelEdit.label.text = this.resolvedLabelEdit.newLabel;
        }
        return context.root;
    }

}

export interface IEditLabelValidator {
    validate(value: string, label: EditableLabel & SModelElement): Promise<EditLabelValidationResult>;
}

export interface EditLabelValidationResult {
    readonly severity: Severity;
    readonly message?: string;
}

export type Severity = 'ok' | 'warning' | 'error';

export class EditLabelMouseListener extends MouseListener {
    doubleClick(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const editableLabel = getEditableLabel(target);
        if (editableLabel) {
            return [new EditLabelAction(editableLabel.id)];
        }
        return [];
    }
}

export class EditLabelKeyListener extends KeyListener {
    keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'F2')) {
            const editableLabels = toArray(element.index.all()
                .filter(e => isSelectable(e) && e.selected)).map(getEditableLabel)
                .filter((e): e is EditableLabel & SModelElement => e !== undefined);
            if (editableLabels.length === 1) {
                return [new EditLabelAction(editableLabels[0].id)];
            }
        }
        return [];
    }
}

export function getEditableLabel(element: SModelElement): EditableLabel & SModelElement | undefined {
    if (isEditableLabel(element)) {
        return element;
    } else if (isWithEditableLabel(element) && element.editableLabel) {
        return element.editableLabel;
    }
    return undefined;
}
