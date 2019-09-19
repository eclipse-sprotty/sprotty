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
import { Action } from "../../base/actions/action";
import { IActionDispatcherProvider } from "../../base/actions/action-dispatcher";
import { IActionHandler } from "../../base/actions/action-handler";
import { ICommand } from "../../base/commands/command";
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { AbstractUIExtension } from "../../base/ui-extensions/ui-extension";
import { SetUIExtensionVisibilityAction } from "../../base/ui-extensions/ui-extension-registry";
import { DOMHelper } from "../../base/views/dom-helper";
import { ViewerOptions } from "../../base/views/viewer-options";
import { CommitModelAction } from "../../model-source/commit-model";
import { matchesKeystroke } from "../../utils/keyboard";
import { getAbsoluteClientBounds } from "../bounds/model";
import { getZoom } from "../viewport/zoom";
import {
    ApplyLabelEditAction, EditLabelValidationResult, IEditLabelValidator, isEditLabelAction, Severity
} from "./edit-label";
import { EditableLabel, isEditableLabel } from "./model";

/** Shows a UI extension for editing a label on emitted `EditLabelAction`s. */
@injectable()
export class EditLabelActionHandler implements IActionHandler {
    handle(action: Action): void | Action | ICommand {
        if (isEditLabelAction(action)) {
            return new SetUIExtensionVisibilityAction(EditLabelUI.ID, true, [action.labelId]);
        }
    }
}

export interface IEditLabelValidationDecorator {
    decorate(input: HTMLInputElement, validationResult: EditLabelValidationResult): void;
    dispose(input: HTMLInputElement): void;
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
    @inject(TYPES.IEditLabelValidationDecorator) @optional() public validationDecorator: IEditLabelValidationDecorator;

    protected inputElement: HTMLInputElement;
    protected label?: EditableLabel & SModelElement;
    protected labelElement: HTMLElement | null;
    protected validationTimeout?: number = undefined;
    protected isActive: boolean = false;
    protected blockApplyEditOnInvalidInput = true;
    protected isCurrentLabelValid: boolean = true;
    protected previousLabelContent?: string;

    protected get labelId() { return this.label ? this.label.id : 'unknown'; }

    protected initializeContents(containerElement: HTMLElement) {
        containerElement.style.position = 'absolute';
        this.inputElement = document.createElement('input');
        this.inputElement.onkeydown = (event) => this.handleKeyDown(event);
        this.inputElement.onkeyup = (event) => this.validateLabelIfContentChange(event, this.inputElement.value);
        this.inputElement.onblur = () => window.setTimeout(() => this.applyLabelEdit(), 200);
        containerElement.appendChild(this.inputElement);
    }

    protected handleKeyDown(event: KeyboardEvent) {
        this.hideIfEscapeEvent(event);
        this.applyLabelEditIfEnterEvent(event);
    }

    protected hideIfEscapeEvent(event: KeyboardEvent) {
        if (matchesKeystroke(event, 'Escape')) { this.hide(); }
    }

    protected applyLabelEditIfEnterEvent(event: KeyboardEvent) {
        if (matchesKeystroke(event, 'Enter')) {
            this.applyLabelEdit();
        }
    }

    protected validateLabelIfContentChange(event: KeyboardEvent, value: string) {
        if (this.previousLabelContent === undefined || this.previousLabelContent !== value) {
            this.previousLabelContent = value;
            this.performLabelValidation(event, this.inputElement.value);
        }
    }

    protected async applyLabelEdit() {
        if (!this.isActive) {
            return;
        }
        if (this.blockApplyEditOnInvalidInput) {
            const result = await this.validateLabel(this.inputElement.value);
            if ('error' === result.severity) {
                this.inputElement.focus();
                return;
            }
        }
        this.actionDispatcherProvider()
            .then((actionDispatcher) => actionDispatcher.dispatchAll([new ApplyLabelEditAction(this.labelId, this.inputElement.value), new CommitModelAction()]))
            .catch((reason) => this.logger.error(this, 'No action dispatcher available to execute apply label edit action', reason));
        this.hide();
    }

    protected performLabelValidation(event: KeyboardEvent, value: string) {
        if (this.validationTimeout) {
            window.clearTimeout(this.validationTimeout);
        }
        this.validationTimeout = window.setTimeout(() => this.validateLabel(value), 200);
    }

    protected async validateLabel(value: string): Promise<EditLabelValidationResult> {
        if (this.labelValidator && this.label) {
            try {
                const result = await this.labelValidator.validate(value, this.label);
                this.isCurrentLabelValid = 'error' !== result.severity;
                this.showValidationResult(result);
                return result;
            } catch (reason) {
                this.logger.error(this, 'Error validating edited label', reason);
            }
        }
        this.isCurrentLabelValid = true;
        return { severity: <Severity>'ok', message: undefined };
    }

    protected showValidationResult(result: EditLabelValidationResult) {
        this.clearValidationResult();
        if (this.validationDecorator) {
            this.validationDecorator.decorate(this.inputElement, result);
        }
    }

    protected clearValidationResult() {
        if (this.validationDecorator) {
            this.validationDecorator.dispose(this.inputElement);
        }
    }

    show(root: Readonly<SModelRoot>, ...contextElementIds: string[]) {
        if (!hasEditableLabel(contextElementIds, root) || this.isActive) {
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
        this.isCurrentLabelValid = true;
        this.previousLabelContent = undefined;
        if (this.labelElement) {
            this.labelElement.style.visibility = 'visible';
        }
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]) {
        this.label = getEditableLabels(contextElementIds, root)[0];
        this.previousLabelContent = this.label.text;
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

function scaledFont(font: string, zoom: number): string {
    return font.replace(/([0-9]+)/, (match) => {
        return String(Number.parseInt(match, 10) * zoom);
    });
}
