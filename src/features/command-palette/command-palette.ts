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
import { AutocompleteResult, AutocompleteSettings } from "autocompleter";
import { inject, injectable } from "inversify";
import { Action, isAction } from "../../base/actions/action";
import { IActionDispatcherProvider } from "../../base/actions/action-dispatcher";
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { AbstractUIExtension } from "../../base/ui-extensions/ui-extension";
import { SetUIExtensionVisibilityAction } from "../../base/ui-extensions/ui-extension-registry";
import { DOMHelper } from "../../base/views/dom-helper";
import { KeyListener } from "../../base/views/key-tool";
import { ViewerOptions } from "../../base/views/viewer-options";
import { toArray } from "../../utils/iterable";
import { matchesKeystroke } from "../../utils/keyboard";
import { getAbsoluteClientBounds } from "../bounds/model";
import { isSelectable } from "../select/model";
import { CommandPaletteActionProviderRegistry, isLabeledAction, LabeledAction } from "./action-providers";
import { MousePositionTracker } from "../../base/views/mouse-tool";


// import of function autocomplete(...) doesn't work
// see also https://github.com/kraaden/autocomplete/issues/13
// this is a workaround to still get the function including type support
const configureAutocomplete: (settings: AutocompleteSettings<LabeledAction>) => AutocompleteResult = require("autocompleter");

@injectable()
export class CommandPalette extends AbstractUIExtension {
    static readonly ID = "command-palette";

    readonly id = CommandPalette.ID;
    readonly containerClass = "command-palette";
    readonly actionsLoadingClass = "autocomplete-loading";
    readonly xOffset = 20;
    readonly yOffset = 20;
    readonly defaultWidth = 400;
    readonly debounceWaitMs = 200;
    protected inputElement: HTMLInputElement;
    protected autoCompleteResult: AutocompleteResult;
    protected contextActions?: LabeledAction[];

    @inject(TYPES.IActionDispatcherProvider) protected actionDispatcherProvider: IActionDispatcherProvider;
    @inject(TYPES.ICommandPaletteActionProviderRegistry) protected actionProviderRegistry: CommandPaletteActionProviderRegistry;
    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;
    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;
    @inject(MousePositionTracker) protected mousePositionTracker: MousePositionTracker;

    show(root: Readonly<SModelRoot>, ...contextElementIds: string[]) {
        super.show(root, ...contextElementIds);
        this.contextActions = undefined;

        if (this.inputElement!.value) {
            this.inputElement.setSelectionRange(0, this.inputElement.value.length);
        }
        this.autoCompleteResult = configureAutocomplete(this.autocompleteSettings(root));
        this.inputElement.focus();
    }

    protected initializeContents(containerElement: HTMLElement) {
        containerElement.style.position = "absolute";
        this.inputElement = document.createElement('input');
        this.inputElement.style.width = '100%';
        this.inputElement.addEventListener('keydown', (event) => this.hideIfEscapeEvent(event));
        this.inputElement.onblur = () => window.setTimeout(() => this.hide(), 200);
        containerElement.appendChild(this.inputElement);
    }

    protected hideIfEscapeEvent(event: KeyboardEvent): any {
        if (matchesKeystroke(event, 'Escape')) { this.hide(); }
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...selectedElementIds: string[]) {
        let x = this.xOffset;
        let y = this.yOffset;
        const selectedElements = toArray(root.index.all().filter(e => isSelectable(e) && e.selected));
        if (selectedElements.length === 1) {
            const bounds = getAbsoluteClientBounds(selectedElements[0], this.domHelper, this.viewerOptions);
            x += bounds.x + bounds.width;
            y += bounds.y;
        } else {
            const bounds = getAbsoluteClientBounds(root, this.domHelper, this.viewerOptions);
            x += bounds.x;
            y += bounds.y;
        }
        containerElement.style.left = `${x}px`;
        containerElement.style.top = `${y}px`;
        containerElement.style.width = `${this.defaultWidth}px`;
    }

    private autocompleteSettings(root: Readonly<SModelRoot>): AutocompleteSettings<LabeledAction> {
        return {
            input: this.inputElement,
            emptyMsg: "No commands available",
            className: "command-palette-suggestions",
            debounceWaitMs: this.debounceWaitMs,
            minLength: -1,
            fetch: (text: string, update: (items: LabeledAction[]) => void) =>
                this.updateAutoCompleteActions(update, text, root),
            onSelect: (item: LabeledAction) => {
                this.executeAction(item);
                this.hide();
            },
            render: (item: LabeledAction, currentValue: string): HTMLDivElement | undefined =>
                this.renderLabeledActionSuggestion(item, currentValue),
            customize: (input: HTMLInputElement, inputRect: ClientRect | DOMRect, container: HTMLDivElement, maxHeight: number) => {
                // move container into our command palette container as this is already positioned correctly
                if (this.containerElement) {
                    this.containerElement.appendChild(container);
                }
            }
        };
    }

    protected updateAutoCompleteActions(update: (items: LabeledAction[]) => void, text: string, root: Readonly<SModelRoot>) {
        this.inputElement.classList.add(this.actionsLoadingClass);
        if (this.contextActions) {
            update(this.filterActions(text, this.contextActions));
            this.inputElement.classList.remove(this.actionsLoadingClass);
        } else {
            this.actionProviderRegistry.getActions(root, text, this.mousePositionTracker.lastPositionOnDiagram)
                .then(actions => {
                    this.contextActions = actions;
                    update(this.filterActions(text, actions));
                    this.inputElement.classList.remove(this.actionsLoadingClass);
                })
                .catch((reason) => {
                    this.logger.error(this, "Failed to obtain actions from command palette action providers", reason);
                    this.inputElement.classList.remove(this.actionsLoadingClass);
                });
        }
    }

    protected renderLabeledActionSuggestion(item: LabeledAction, value: string) {
        const itemElement = document.createElement("div");
        const wordMatcher = value.split(" ").join("|");
        const regex = new RegExp(wordMatcher, "gi");
        if (item.icon) {
            this.renderIcon(itemElement, item.icon);
        }
        itemElement.innerHTML += item.label.replace(regex, (match) => "<em>" + match + "</em>");
        return itemElement;
    }

    protected renderIcon(itemElement: HTMLDivElement, icon: string) {
        itemElement.innerHTML += `<span class="icon fa ${icon}"></span>`;
    }

    protected filterActions(filterText: string, actions: LabeledAction[]): LabeledAction[] {
        return toArray(actions.filter(action => {
            const label = action.label.toLowerCase();
            const searchWords = filterText.split(' ');
            return searchWords.every(word => label.indexOf(word.toLowerCase()) !== -1);
        }));
    }

    hide() {
        super.hide();
        if (this.autoCompleteResult) {
            this.autoCompleteResult.destroy();
        }
    }

    protected executeAction(input: LabeledAction | Action[] | Action) {
        this.actionDispatcherProvider()
            .then((actionDispatcher) => actionDispatcher.dispatchAll(toActionArray(input)))
            .catch((reason) => this.logger.error(this, 'No action dispatcher available to execute command palette action', reason));
    }
}

function toActionArray(input: LabeledAction | Action[] | Action): Action[] {
    if (isLabeledAction(input)) {
        return input.actions;
    } else if (isAction(input)) {
        return [input];
    }
    return [];
}

export class CommandPaletteKeyListener extends KeyListener {
    keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'Escape')) {
            return [new SetUIExtensionVisibilityAction(CommandPalette.ID, false, [])];
        } else if (matchesKeystroke(event, 'Space', 'ctrl')) {
            const selectedElements = toArray(element.index.all().filter(e => isSelectable(e) && e.selected).map(e => e.id));
            return [new SetUIExtensionVisibilityAction(CommandPalette.ID, true, selectedElements)];
        }
        return [];
    }
}
