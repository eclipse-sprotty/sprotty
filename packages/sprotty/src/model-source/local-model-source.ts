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

import { saveAs } from 'file-saver';
import { inject, injectable, optional } from 'inversify';
import {
    Action, ComputedBoundsAction, RequestBoundsAction, RequestModelAction, RequestPopupModelAction,
    SetModelAction, SetPopupModelAction, UpdateModelAction
} from 'sprotty-protocol/lib/actions';
import { SModelElement, SModelRoot, Viewport} from 'sprotty-protocol/lib/model';
import { IModelLayoutEngine, GetViewportAction, ViewportResult, GetSelectionAction, SelectionResult } from 'sprotty-protocol';
import { Bounds } from 'sprotty-protocol/lib/utils/geometry';
import { SModelIndex, findElement } from 'sprotty-protocol/lib/utils/model-utils';
import { ILogger } from '../utils/logging';
import { FluentIterable } from '../utils/iterable';
import { TYPES } from '../base/types';
import { ActionHandlerRegistry } from '../base/actions/action-handler';
import { EMPTY_ROOT } from '../base/model/smodel-factory';
import { ExportSvgAction } from '../features/export/svg-exporter';
import { applyMatches, Match } from '../features/update/model-matching';
import { ModelSource, ComputedBoundsApplicator } from './model-source';

export interface IPopupModelProvider {
    getPopupModel(request: RequestPopupModelAction, element?: SModelElement): SModelRoot | undefined;
}

/**
 * A model source that allows to set and modify the model through function calls.
 * This class can be used as a facade over the action-based API of sprotty. It handles
 * actions for bounds calculation and model updates.
 */
@injectable()
export class LocalModelSource extends ModelSource {

    @inject(TYPES.ILogger) protected readonly logger: ILogger;
    @inject(ComputedBoundsApplicator) protected readonly computedBoundsApplicator: ComputedBoundsApplicator;
    @inject(TYPES.IPopupModelProvider)@optional() protected popupModelProvider?: IPopupModelProvider;
    @inject(TYPES.IModelLayoutEngine)@optional() protected layoutEngine?: IModelLayoutEngine;

    protected currentRoot: SModelRoot = EMPTY_ROOT;

    /**
     * The `type` property of the model root is used to determine whether a model update
     * is a change of the previous model or a totally new one.
     */
    protected lastSubmittedModelType: string;

    override get model(): SModelRoot {
        return this.currentRoot;
    }

    set model(root: SModelRoot) {
        this.setModel(root);
    }

    override initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);

        // Register actions to be handled by the `handle` method
        registry.register(ComputedBoundsAction.KIND, this);
        registry.register(RequestPopupModelAction.KIND, this);
    }

    /**
     * Set the model without incremental update.
     */
    setModel(newRoot: SModelRoot): Promise<void> {
        this.currentRoot = newRoot;
        return this.submitModel(newRoot, false);
    }

    commitModel(newRoot: SModelRoot): Promise<SModelRoot> | SModelRoot {
        const previousRoot = this.currentRoot;
        this.currentRoot = newRoot;
        return previousRoot;
    }

    /**
     * Apply an incremental update to the model with an animation showing the transition to
     * the new state. If `newRoot` is undefined, the current root is submitted; in that case
     * it is assumed that it has been modified before.
     */
    updateModel(newRoot?: SModelRoot): Promise<void> {
        if (newRoot === undefined) {
            return this.submitModel(this.currentRoot, true);
        } else {
            this.currentRoot = newRoot;
            return this.submitModel(newRoot, true);
        }
    }

    /**
     * Get the current selection from the model.
     */
    async getSelection(): Promise<FluentIterable<SModelElement>> {
        const res = await this.actionDispatcher.request<SelectionResult>(GetSelectionAction.create());
        const result: SModelElement[] = [];
        this.gatherSelectedElements(this.currentRoot, new Set(res.selectedElementsIDs), result);
        return result;
    }

    private gatherSelectedElements(element: SModelElement, selected: Set<string>, result: SModelElement[]): void {
        if (selected.has(element.id)) {
            result.push(element);
        }
        if (element.children) {
            for (const child of element.children) {
                this.gatherSelectedElements(child, selected, result);
            }
        }
    }

    /**
     * Get the current viewport from the model.
     */
    async getViewport(): Promise<Viewport & { canvasBounds: Bounds }> {
        const res = await this.actionDispatcher.request<ViewportResult>(GetViewportAction.create());
        return {
            scroll: res.viewport.scroll,
            zoom: res.viewport.zoom,
            canvasBounds: res.canvasBounds
        };
    }

    /**
     * If client layout is active, run a `RequestBoundsAction` and wait for the resulting
     * `ComputedBoundsAction`, otherwise call `doSubmitModel(…)` directly.
     */
    protected async submitModel(newRoot: SModelRoot, update: boolean | Match[], cause?: Action): Promise<void> {
        if (this.viewerOptions.needsClientLayout) {
            const computedBounds = await this.actionDispatcher.request<ComputedBoundsAction>(RequestBoundsAction.create(newRoot));
            const index = this.computedBoundsApplicator.apply(this.currentRoot, computedBounds);
            await this.doSubmitModel(newRoot, true, cause, index);
        } else {
            await this.doSubmitModel(newRoot, update, cause);
        }
    }

    /**
     * Submit the given model with an `UpdateModelAction` or a `SetModelAction` depending on the
     * `update` argument. If available, the model layout engine is invoked first.
     */
    protected async doSubmitModel(newRoot: SModelRoot, update: boolean | Match[],
            cause?: Action, index?: SModelIndex): Promise<void> {
        if (this.layoutEngine !== undefined) {
            try {
                const layoutResult = this.layoutEngine.layout(newRoot, index);
                if (layoutResult instanceof Promise)
                    newRoot = await layoutResult;
                else if (layoutResult !== undefined)
                    newRoot = layoutResult;
            } catch (error) {
                this.logger.error(this, error.toString(), error.stack);
            }
        }

        const lastSubmittedModelType = this.lastSubmittedModelType;
        this.lastSubmittedModelType = newRoot.type;
        if (cause && cause.kind === RequestModelAction.KIND && (cause as RequestModelAction).requestId) {
            const request = cause as RequestModelAction;
            await this.actionDispatcher.dispatch(SetModelAction.create(newRoot, request.requestId));
        } else if (update && newRoot.type === lastSubmittedModelType) {
            const input = Array.isArray(update) ? update : newRoot;
            await this.actionDispatcher.dispatch(UpdateModelAction.create(input, { animate: true, cause }));
        } else {
            await this.actionDispatcher.dispatch(SetModelAction.create(newRoot));
        }
    }

    /**
     * Modify the current model with an array of matches.
     */
    applyMatches(matches: Match[]): Promise<void> {
        const root = this.currentRoot;
        applyMatches(root, matches);
        return this.submitModel(root, matches);
    }

    /**
     * Modify the current model by adding new elements.
     */
    addElements(elements: (SModelElement | { element: SModelElement, parentId: string })[]): Promise<void> {
        const matches: Match[] = [];
        for (const e of elements) {
            const anye: any = e;
            if (typeof anye.element === 'object' && typeof anye.parentId === 'string') {
                matches.push({
                    right: anye.element,
                    rightParentId: anye.parentId
                });
            } else if (typeof anye.id === 'string') {
                matches.push({
                    right: anye,
                    rightParentId: this.currentRoot.id
                });
            }
        }
        return this.applyMatches(matches);
    }

    /**
     * Modify the current model by removing elements.
     */
    removeElements(elements: (string | { elementId: string, parentId: string })[]): Promise<void> {
        const matches: Match[] = [];
        const index = new SModelIndex();
        index.add(this.currentRoot);
        for (const e of elements) {
            const anye: any = e;
            if (anye.elementId !== undefined && anye.parentId !== undefined) {
                const element = index.getById(anye.elementId);
                if (element !== undefined) {
                    matches.push({
                        left: element,
                        leftParentId: anye.parentId
                    });
                }
            } else {
                const element = index.getById(anye);
                if (element !== undefined) {
                    matches.push({
                        left: element,
                        leftParentId: this.currentRoot.id
                    });
                }
            }
        }
        return this.applyMatches(matches);
    }


    // ----- Methods for handling incoming actions ----------------------------

    handle(action: Action): void {
        switch (action.kind) {
            case RequestModelAction.KIND:
                this.handleRequestModel(action as RequestModelAction);
                break;
            case ComputedBoundsAction.KIND:
                this.computedBoundsApplicator.apply(this.currentRoot, action as ComputedBoundsAction);
                break;
            case RequestPopupModelAction.KIND:
                this.handleRequestPopupModel(action as RequestPopupModelAction);
                break;
            case ExportSvgAction.KIND:
                this.handleExportSvgAction(action as ExportSvgAction);
                break;
        }
    }

    protected handleRequestModel(action: RequestModelAction): void {
        this.submitModel(this.currentRoot, false, action);
    }

    protected handleRequestPopupModel(action: RequestPopupModelAction): void {
        if (this.popupModelProvider !== undefined) {
            const element = findElement(this.currentRoot, action.elementId);
            const popupRoot = this.popupModelProvider.getPopupModel(action, element);
            if (popupRoot !== undefined) {
                popupRoot.canvasBounds = action.bounds;
                this.actionDispatcher.dispatch(SetPopupModelAction.create(popupRoot, action.requestId));
            }
        }
    }

    protected handleExportSvgAction(action: ExportSvgAction): void {
        const blob = new Blob([action.svg], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'diagram.svg');
    }
}
