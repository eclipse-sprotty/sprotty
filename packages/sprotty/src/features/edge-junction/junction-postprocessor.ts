/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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
import { VNode } from "snabbdom";
import { Action, RequestBoundsAction, SModelRoot } from "sprotty-protocol";
import { SModelElementImpl } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { ViewerOptions } from "../../base/views/viewer-options";
import { IVNodePostprocessor } from "../../base/views/vnode-postprocessor";
import { ModelSource } from "../../model-source/model-source";

/**
 * Finds all junction points in the first SVG group element (diagram root level) and moves them to the end of the SVG.
 * This ensures that junction points are rendered on top of all other elements.
 */
@injectable()
export class JunctionPostProcessor implements IVNodePostprocessor {
    currentModel: SModelRoot;
    isFirstRender = true;

    @inject(TYPES.ViewerOptions) private viewerOptions: ViewerOptions;
    @inject(TYPES.ModelSource) private modelSource: ModelSource;

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        return vnode;
    }
    postUpdate(cause?: Action | undefined): void {

        // if the model has changed, we need to remove the junction points from the previous model
        if (this.currentModel !== this.modelSource.model) {
            this.isFirstRender = true;
        }

        // if the cause of the update is a RequestBoundsAction (from the hidden model)
        // and we are rendering the diagram for the first time (not from an update or setting the same model again)
        // we need to remove the junction points from the previous model
        if (cause?.kind === RequestBoundsAction.KIND && this.isFirstRender) {
            const junctionPointsInHiddenDiv = document.querySelectorAll(`#${this.viewerOptions.hiddenDiv} > svg > g > g.sprotty-junction`);
            junctionPointsInHiddenDiv.forEach(e => e.remove());

            const junctionPointsInBaseDiv = document.querySelectorAll(`#${this.viewerOptions.baseDiv} > svg > g > g.sprotty-junction`);
            junctionPointsInBaseDiv.forEach(e => e.remove());
        }

        const hiddenSvg = document.querySelector(`#${this.viewerOptions.hiddenDiv} > svg > g`);
        const baseSvg = document.querySelector(`#${this.viewerOptions.baseDiv} > svg > g`);

        // move junction points to the end of the SVG in the hidden div
        if (hiddenSvg) {
            const junctionGroups = Array.from(document.querySelectorAll(`#${this.viewerOptions.hiddenDiv} > svg > g > g > g.sprotty-junction`));
            junctionGroups.forEach(junctionGroup => {
                junctionGroup.remove();
            });
            hiddenSvg.append(...junctionGroups);
        }

        // move junction points to the end of the SVG in the base div
        if (baseSvg) {
            const junctionGroups = Array.from(document.querySelectorAll(`#${this.viewerOptions.baseDiv} > svg > g > g > g.sprotty-junction`));
            junctionGroups.forEach(junctionGroup => {
                junctionGroup.remove();
            });
            baseSvg.append(...junctionGroups);
        }

        // update the current model
        this.currentModel = this.modelSource.model;
        // after the first render, we don't need to remove the junction points anymore
        this.isFirstRender = false;
    }
}
