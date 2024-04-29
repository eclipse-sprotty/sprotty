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

import { injectable, inject } from "inversify";
import { IVNodePostprocessor } from "../../base/views/vnode-postprocessor";
import { VNode } from "snabbdom";
import { Action, RequestBoundsAction } from "sprotty-protocol";
import { SModelElementImpl } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { ViewerOptions } from "../../base/views/viewer-options";

/**
 * Finds all junction points in the first SVG group element (diagram root level) and moves them to the end of the SVG.
 * This ensures that junction points are rendered on top of all other elements.
 */
@injectable()
export class JunctionPostProcessor implements IVNodePostprocessor {
    @inject(TYPES.ViewerOptions) private viewerOptions: ViewerOptions;

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        return vnode;
    }
    postUpdate(cause?: Action | undefined): void {
        let targetDiv: string = this.viewerOptions.baseDiv;
        if (cause?.kind === RequestBoundsAction.KIND) {
            targetDiv = this.viewerOptions.hiddenDiv;
        }

        const junctionSelector = `#${targetDiv} > svg > g > g > g.sprotty-junction`;
        const svg = document.querySelector(`#${targetDiv} > svg > g`);
        if (svg) {
            const junctionGroups = Array.from(document.querySelectorAll(junctionSelector));

            junctionGroups.forEach(junctionGroup => {
                junctionGroup.remove();
            });

            svg.append(...junctionGroups);
        }
    }
}
