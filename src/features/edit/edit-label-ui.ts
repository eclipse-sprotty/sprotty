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
import { inject, injectable, optional } from "inversify";
import { IActionDispatcherProvider } from "../../base/actions/action-dispatcher";
import { CommandExecutionContext, CommandResult, SystemCommand } from "../../base/commands/command";
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { AbstractUIExtension } from "../../base/ui-extensions/ui-extension";
import { SetUIExtensionVisibilityAction } from "../../base/ui-extensions/ui-extension-registry";
import { DOMHelper } from "../../base/views/dom-helper";
import { ViewerOptions } from "../../base/views/viewer-options";
import { matchesKeystroke } from "../../utils/keyboard";
import { getAbsoluteClientBounds } from "../bounds/model";
import { ApplyLabelEditAction, EditableLabel, EditLabelAction, isEditableLabel, IEditLabelValidator, EditLabelValidationResult } from "./edit-label";
import { getZoom } from "../viewport/zoom";

/** Shows a UI extension for editing a label on emitted `EditLabelAction`s. */
@injectable()
export class EditLabelCommand extends SystemCommand {
    static KIND: string = EditLabelAction.KIND;
    @inject(TYPES.IActionDispatcherProvider) public actionDispatcherProvider: IActionDispatcherProvider;

    constructor(@inject(TYPES.Action) public action: EditLabelAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        this.actionDispatcherProvider().then(dispatcher =>
            dispatcher.dispatch(new SetUIExtensionVisibilityAction(EditLabelUI.ID, true, [this.action.labelId])));
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandResult {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        return context.root;
    }
}

@injectable()
export class EditLabelUI extends AbstractUIExtension {
    static readonly ID = "editLabelUi";

    readonly id = EditLabelUI.ID;
    readonly containerClass = "label-edit";

    /** The additional width to be added to the current label length for editing in pixel. Will be scaled depending on zoom level. */
    readonly additionalInputWidth = 100;

    @inject(TYPES.IActionDispatcherProvider) public actionDispatcherProvider: IActionDispatcherProvider;
    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;
    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;
    @inject(TYPES.IEditLabelValidator) @optional() public labelValidator: IEditLabelValidator;

    protected inputElement: HTMLInputElement;
    protected label?: EditableLabel & SModelElement;
    protected labelElement: HTMLElement | null;
    protected validationTimeout?: number = undefined;
    protected isActive: boolean = false;

    protected get labelId() { return this.label ? this.label.id : 'unknown'; }

    protected initializeContents(containerElement: HTMLElement): void {
        containerElement.style.position = 'absolute';
        this.inputElement = document.createElement('input');
        this.inputElement.addEventListener('keydown', (event) => this.hideIfEscapeEvent(event));
        this.inputElement.onblur = () => window.setTimeout(() => this.applyLabelEdit(), 200);
        this.inputElement.addEventListener('keydown', (event) => this.applyLabelEditIfEnterEvent(event));
        this.inputElement.onkeyup = (event) => this.performLabelValidation(event, this.inputElement.value);
        containerElement.appendChild(this.inputElement);
    }

    protected hideIfEscapeEvent(event: KeyboardEvent): any {
        if (matchesKeystroke(event, 'Escape')) { this.hide(); }
    }

    protected applyLabelEditIfEnterEvent(event: KeyboardEvent): any {
        if (matchesKeystroke(event, 'Enter')) {
            this.applyLabelEdit();
        }
    }

    private applyLabelEdit() {
        if (!this.isActive) {
            return;
        }
        this.actionDispatcherProvider()
            .then(actionDispatcher => actionDispatcher.dispatch(new ApplyLabelEditAction(this.labelId, this.inputElement.value)))
            .catch((reason) => this.logger.error(this, 'No action dispatcher available to execute apply label edit action', reason));
        this.hide();
    }

    protected performLabelValidation(event: KeyboardEvent, value: string) {
        if (this.validationTimeout) {
            window.clearTimeout(this.validationTimeout);
        }
        this.validationTimeout = window.setTimeout(() => this.validateLabel(value), 200);
    }

    protected validateLabel(value: string) {
        if (this.labelValidator && this.label) {
            this.labelValidator.validate(value, this.label)
                .then(result => this.showValidationResult(result))
                .catch((reason) => this.logger.error(this, 'Error validating edited label', reason));
        }
    }

    protected showValidationResult(result: EditLabelValidationResult) {
        this.clearValidationResult();
        if (result.message) {
            this.containerElement.setAttribute('data-balloon', result.message);
            this.containerElement.setAttribute('data-balloon-pos', 'up-left');
            this.containerElement.setAttribute('data-balloon-visible', 'true');
        }
        switch (result.severity) {
            case 'ok': this.containerElement.classList.add('validation-ok'); break;
            case 'warning': this.containerElement.classList.add('validation-warning'); break;
            case 'error': this.containerElement.classList.add('validation-error'); break;
        }
    }

    protected clearValidationResult() {
        if (this.containerElement) {
            this.containerElement.removeAttribute('data-balloon');
            this.containerElement.removeAttribute('data-balloon-pos');
            this.containerElement.removeAttribute('data-balloon-visible');
            this.containerElement.classList.remove('validation-ok', 'validation-warning', 'validation-error');
        }
    }

    show(root: Readonly<SModelRoot>, ...contextElementIds: string[]) {
        if (!hasEditableLabel(contextElementIds, root)) {
            return;
        }
        super.show(root, ...contextElementIds);
        this.isActive = true;
        this.inputElement.focus();
    }

    hide(): void {
        super.hide();
        this.clearValidationResult();
        this.isActive = false;
        if (this.labelElement) {
            this.labelElement.style.visibility = 'visible';
        }
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]) {
        this.label = getEditableLabels(contextElementIds, root)[0];
        this.setPosition(containerElement);
        this.applyTextContents();
        this.applyFontStyling();
    }

    protected setPosition(containerElement: HTMLElement) {
        let x = 0;
        let y = 0;
        let width = 100;
        let height = 20;

        if (this.label) {
            const bounds = getAbsoluteClientBounds(this.label, this.domHelper, this.viewerOptions);
            x = bounds.x;
            y = bounds.y;
            height = bounds.height;
            width = bounds.width + (this.additionalInputWidth * getZoom(this.label));
        }

        containerElement.style.left = `${x}px`;
        containerElement.style.top = `${y}px`;
        containerElement.style.width = `${width}px`;
        containerElement.style.height = `${height}px`;
        this.inputElement.style.position = 'absolute';
    }

    protected applyTextContents() {
        if (this.label) {
            this.inputElement.value = this.label.text;
            this.inputElement.setSelectionRange(0, this.inputElement.value.length);
        }
    }

    protected applyFontStyling() {
        if (this.label) {
            this.labelElement = document.getElementById(this.domHelper.createUniqueDOMElementId(this.label));
            if (this.labelElement) {
                this.labelElement.style.visibility = 'hidden';
                const style = window.getComputedStyle(this.labelElement);
                this.inputElement.style.font = style.font;
                this.inputElement.style.fontStyle = style.fontStyle;
                this.inputElement.style.fontFamily = style.fontFamily;
                this.inputElement.style.fontSize = scaledFont(style.fontSize, getZoom(this.label));
                this.inputElement.style.fontWeight = style.fontWeight;
            }
        }
    }
}

function hasEditableLabel(contextElementIds: string[], root: Readonly<SModelRoot>) {
    return getEditableLabels(contextElementIds, root).length === 1;
}

function getEditableLabels(contextElementIds: string[], root: Readonly<SModelRoot>) {
    return contextElementIds.map(id => root.index.getById(id)).filter(isEditableLabel);
}

function scaledFont(font: string | null, zoom: number): string | null {
    if (font === null) {
        return null;
    }
    return font.replace(/([0-9]+)/, (match) => {
        return String(Number.parseInt(match, 10) * zoom);
    });
}
