/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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
import { Action, ApplyLabelEditAction } from 'sprotty-protocol/lib/actions';
import { IActionDispatcherProvider } from '../../base/actions/action-dispatcher';
import { IActionHandler } from '../../base/actions/action-handler';
import { ICommand } from '../../base/commands/command';
import { SModelElementImpl, SModelRootImpl } from '../../base/model/smodel';
import { TYPES } from '../../base/types';
import { AbstractUIExtension } from '../../base/ui-extensions/ui-extension';
import { SetUIExtensionVisibilityAction } from '../../base/ui-extensions/ui-extension-registry';
import { DOMHelper } from '../../base/views/dom-helper';
import { ViewerOptions } from '../../base/views/viewer-options';
import { CommitModelAction } from '../../model-source/commit-model';
import { matchesKeystroke, KeyCode, KeyboardModifier } from '../../utils/keyboard';
import { getAbsoluteClientBounds } from '../bounds/model';
import { getZoom } from '../viewport/zoom';
import { EditLabelValidationResult, IEditLabelValidator, isEditLabelAction, Severity } from './edit-label';
import { EditableLabel, isEditableLabel } from './model';

/** Shows a UI extension for editing a label on emitted `EditLabelAction`s. */
@injectable()
export class EditLabelActionHandler implements IActionHandler {
    handle(action: Action): void | Action | ICommand {
        if (isEditLabelAction(action)) {
            return SetUIExtensionVisibilityAction.create({ extensionId: EditLabelUI.ID, visible: true, contextElementsId: [action.labelId] });
        }
    }
}

export interface IEditLabelValidationDecorator {
    decorate(input: HTMLInputElement | HTMLTextAreaElement, validationResult: EditLabelValidationResult): void;
    dispose(input: HTMLInputElement | HTMLTextAreaElement): void;
}

@injectable()
export class EditLabelUI extends AbstractUIExtension {
    static readonly ID = 'editLabelUi';

    @inject(TYPES.IActionDispatcherProvider) public actionDispatcherProvider: IActionDispatcherProvider;
    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;
    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;
    @inject(TYPES.IEditLabelValidator) @optional() public labelValidator: IEditLabelValidator;
    @inject(TYPES.IEditLabelValidationDecorator) @optional() public validationDecorator: IEditLabelValidationDecorator;

    protected inputElement: HTMLInputElement;
    protected textAreaElement: HTMLTextAreaElement;

    protected label?: EditableLabel & SModelElementImpl;
    protected labelElement: HTMLElement | null;
    protected validationTimeout?: number = undefined;
    protected isActive: boolean = false;
    protected blockApplyEditOnInvalidInput = true;
    protected isCurrentLabelValid: boolean = true;
    protected previousLabelContent?: string;

    public id() { return EditLabelUI.ID; }
    public containerClass() { return 'label-edit'; }

    protected get labelId() { return this.label ? this.label.id : 'unknown'; }

    protected initializeContents(containerElement: HTMLElement) {
        containerElement.style.position = 'absolute';
        this.inputElement = document.createElement('input');
        this.textAreaElement = document.createElement('textarea');
        [this.inputElement, this.textAreaElement].forEach((element) => {
            element.onkeydown = event => this.applyLabelEditOnEvent(event, 'Enter');
            this.configureAndAdd(element, containerElement);
        });
    }

    protected configureAndAdd(element: HTMLInputElement | HTMLTextAreaElement, containerElement: HTMLElement) {
        element.style.visibility = 'hidden';
        element.style.position = 'absolute';
        element.style.top = '0px';
        element.style.left = '0px';
        element.addEventListener('keydown', (event: KeyboardEvent) => this.hideIfEscapeEvent(event));
        element.addEventListener('keyup', (event: KeyboardEvent) => this.validateLabelIfContentChange(event, element.value));
        element.addEventListener('blur', () => window.setTimeout(() => this.applyLabelEdit(), 200));
        containerElement.appendChild(element);
    }

    get editControl(): HTMLInputElement | HTMLTextAreaElement {
        if (this.label && this.label.isMultiLine) {
            return this.textAreaElement;
        }
        return this.inputElement;
    }

    protected hideIfEscapeEvent(event: KeyboardEvent) {
        if (matchesKeystroke(event, 'Escape')) { this.hide(); }
    }

    protected applyLabelEditOnEvent(event: KeyboardEvent, code?: KeyCode, ...modifiers: KeyboardModifier[]) {
        if (matchesKeystroke(event, code ? code : 'Enter', ...modifiers)) {
            event.preventDefault();
            this.applyLabelEdit();
        }
    }

    protected validateLabelIfContentChange(event: KeyboardEvent, value: string) {
        if (this.previousLabelContent === undefined || this.previousLabelContent !== value) {
            this.previousLabelContent = value;
            this.performLabelValidation(event, this.editControl.value);
        }
    }

    protected async applyLabelEdit() {
        if (!this.isActive) {
            return;
        }
        if (this.label?.text === this.editControl.value) {
            // no action necessary
            this.hide();
            return;
        }
        if (this.blockApplyEditOnInvalidInput) {
            const result = await this.validateLabel(this.editControl.value);
            if ('error' === result.severity) {
                this.editControl.focus();
                return;
            }
        }
        this.actionDispatcherProvider()
            .then((actionDispatcher) => actionDispatcher.dispatchAll([ApplyLabelEditAction.create(this.labelId, this.editControl.value), CommitModelAction.create()]))
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
            this.validationDecorator.decorate(this.editControl, result);
        }
    }

    protected clearValidationResult() {
        if (this.validationDecorator) {
            this.validationDecorator.dispose(this.editControl);
        }
    }

    override show(root: Readonly<SModelRootImpl>, ...contextElementIds: string[]) {
        if (!hasEditableLabel(contextElementIds, root) || this.isActive) {
            return;
        }
        super.show(root, ...contextElementIds);
        this.isActive = true;
    }

    override hide(): void {
        this.editControl.style.visibility = 'hidden';
        super.hide();
        this.clearValidationResult();
        this.isActive = false;
        this.isCurrentLabelValid = true;
        this.previousLabelContent = undefined;
        if (this.labelElement) {
            this.labelElement.style.visibility = 'visible';
        }
    }

    protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRootImpl>, ...contextElementIds: string[]) {
        this.label = getEditableLabels(contextElementIds, root)[0];
        this.previousLabelContent = this.label.text;
        this.setPosition(containerElement);
        this.applyTextContents();
        this.applyFontStyling();
        this.editControl.style.visibility = 'visible';
        this.editControl.focus();
    }

    protected setPosition(containerElement: HTMLElement) {
        let x = 0;
        let y = 0;
        let width = 100;
        let height = 20;

        if (this.label) {
            const zoom = getZoom(this.label);
            const bounds = getAbsoluteClientBounds(this.label, this.domHelper, this.viewerOptions);
            x = bounds.x + (this.label.editControlPositionCorrection ? this.label.editControlPositionCorrection.x : 0) * zoom;
            y = bounds.y + (this.label.editControlPositionCorrection ? this.label.editControlPositionCorrection.y : 0) * zoom;
            height = (this.label.editControlDimension ? this.label.editControlDimension.height : height) * zoom;
            width = (this.label.editControlDimension ? this.label.editControlDimension.width : width) * zoom;
        }

        containerElement.style.left = `${x}px`;
        containerElement.style.top = `${y}px`;
        containerElement.style.width = `${width}px`;
        this.editControl.style.width = `${width}px`;
        containerElement.style.height = `${height}px`;
        this.editControl.style.height = `${height}px`;
    }

    protected applyTextContents() {
        if (this.label) {
            this.editControl.value = this.label.text;
            if (this.editControl instanceof HTMLTextAreaElement) {
                this.editControl.selectionStart = 0;
                this.editControl.selectionEnd = 0;
                this.editControl.scrollTop = 0;
                this.editControl.scrollLeft = 0;
            } else {
                this.editControl.setSelectionRange(0, this.editControl.value.length);
            }
        }
    }

    protected applyFontStyling() {
        if (this.label) {
            this.labelElement = document.getElementById(this.domHelper.createUniqueDOMElementId(this.label));
            if (this.labelElement) {
                this.labelElement.style.visibility = 'hidden';
                const style = window.getComputedStyle(this.labelElement);
                this.editControl.style.font = style.font;
                this.editControl.style.fontStyle = style.fontStyle;
                this.editControl.style.fontFamily = style.fontFamily;
                this.editControl.style.fontSize = scaledFont(style.fontSize, getZoom(this.label));
                this.editControl.style.fontWeight = style.fontWeight;
                this.editControl.style.lineHeight = style.lineHeight;
            }
        }
    }
}

function hasEditableLabel(contextElementIds: string[], root: Readonly<SModelRootImpl>) {
    return getEditableLabels(contextElementIds, root).length === 1;
}

function getEditableLabels(contextElementIds: string[], root: Readonly<SModelRootImpl>) {
    return contextElementIds.map(id => root.index.getById(id)).filter(isEditableLabel);
}

function scaledFont(font: string, zoom: number): string {
    return font.replace(/\d+(\.\d+)?/, (match) => {
        return String(Number.parseInt(match, 10) * zoom);
    });
}
