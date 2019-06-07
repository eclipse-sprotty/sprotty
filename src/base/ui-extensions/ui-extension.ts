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
import { inject, injectable } from "inversify";
import { ILogger } from "../../utils/logging";
import { SModelRoot } from "../model/smodel";
import { TYPES } from "../types";
import { ViewerOptions } from "../views/viewer-options";

/**
 * A UI extension displaying additional UI elements on top of a sprotty diagram.
 */
export interface IUIExtension {
    readonly id: string;
    show(root: Readonly<SModelRoot>, ...contextElementIds: string[]): void;
    hide(): void;
}

/**
 * Abstract base class for UI extensions.
 */
@injectable()
export abstract class AbstractUIExtension implements IUIExtension {
    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;
    @inject(TYPES.ILogger) protected logger: ILogger;

    abstract readonly id: string;
    abstract readonly containerClass: string;
    protected containerElement: HTMLElement;
    protected activeElement: Element | null;

    show(root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        this.activeElement = document.activeElement;
        if (!this.containerElement) {
            if (!this.initialize()) return;
        }
        this.onBeforeShow(this.containerElement, root, ...contextElementIds);
        this.setContainerVisible(true);
    }

    hide(): void {
        this.setContainerVisible(false);
        this.restoreFocus();
        this.activeElement = null;
    }

    protected restoreFocus() {
        const focusedElement = this.activeElement as HTMLElement;
        if (focusedElement) {
            focusedElement.focus();
        }
    }

    protected initialize(): boolean {
        const baseDiv = document.getElementById(this.options.baseDiv);
        if (!baseDiv) {
            this.logger.warn(this, `Could not obtain sprotty base container for initializing UI extension ${this.id}`, this);
            return false;
        }
        this.containerElement = this.getOrCreateContainer(baseDiv.id);
        this.initializeContents(this.containerElement);
        if (baseDiv) {
            baseDiv.insertBefore(this.containerElement, baseDiv.firstChild);
        }
        return true;
    }

    protected getOrCreateContainer(baseDivId: string): HTMLElement {
        let container = document.getElementById(this.id);
        if (container === null) {
            container = document.createElement('div');
            container.id = baseDivId + "_" + this.id;
            container.classList.add(this.containerClass);
        }
        return container;
    }

    protected setContainerVisible(visible: boolean) {
        if (this.containerElement) {
            if (visible) {
                this.containerElement.style.visibility = 'visible';
                this.containerElement.style.opacity = '1';
            } else {
                this.containerElement.style.visibility = 'hidden';
                this.containerElement.style.opacity = '0';
            }
        }
    }

    /**
     * Updates the `containerElement` under the given `context` before it becomes visible.
     *
     * Subclasses may override this method to, for instance, modifying the position of the
     * `containerElement`, add or remove elements, etc. depending on the specified `root`
     * or `contextElementIds`.
     */
    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        // default: do nothing
    }

    /**
     * Initializes the contents of this UI extension.
     *
     * Subclasses must implement this method to initialize the UI elements of this UI extension inside the specified `containerElement`.
     */
    protected abstract initializeContents(containerElement: HTMLElement): void;
}
