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

import { inject, injectable } from "inversify";
import { VNode } from "snabbdom/vnode";
import { TYPES } from "../../base/types";
import { almostEquals, Bounds, Point } from '../../utils/geometry';
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { IVNodeDecorator } from "../../base/views/vnode-decorators";
import { IActionDispatcher } from "../../base/actions/action-dispatcher";
import { ComputedBoundsAction, ElementAndBounds, ElementAndAlignment } from './bounds-manipulation';
import { BoundsAware, isSizeable, isLayoutContainer, isAlignable } from "./model";
import { Layouter } from "./layout";
import { isExportable } from "../export/model";

export class BoundsData {
    vnode?: VNode;
    bounds?: Bounds;
    alignment?: Point;
    boundsChanged: boolean;
    alignmentChanged: boolean;
}

/**
 * Grabs the bounds from hidden SVG DOM elements, applies layouts and fires
 * ComputedBoundsActions.
 *
 * The actual bounds of an element can usually not be determined from the SModel
 * as they depend on the view implementation and CSS stylings. So the best way is
 * to grab them from a live (but hidden) SVG using getBBox().
 *
 * If an element is Alignable, and the top-left corner of its bounding box is not
 * the origin, we also issue a realign with the ComputedBoundsAction.
 */
@injectable()
export class HiddenBoundsUpdater implements IVNodeDecorator {

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(TYPES.Layouter) protected layouter: Layouter;

    private readonly element2boundsData: Map<SModelElement, BoundsData> = new Map;

    root: SModelRoot | undefined;

    decorate(vnode: VNode, element: SModelElement): VNode {
        if (isSizeable(element) || isLayoutContainer(element)) {
            this.element2boundsData.set(element, {
                vnode: vnode,
                bounds: element.bounds,
                boundsChanged: false,
                alignmentChanged: false
            });
        }
        if (element instanceof SModelRoot)
            this.root = element;
        return vnode;
    }

    postUpdate() {
        if (this.root !== undefined && isExportable(this.root) && this.root.export)
            return;
        this.getBoundsFromDOM();
        this.layouter.layout(this.element2boundsData);
        const resizes: ElementAndBounds[] = [];
        const realignments: ElementAndAlignment[] = [];
        this.element2boundsData.forEach(
            (boundsData, element) => {
                if (boundsData.boundsChanged && boundsData.bounds !== undefined)
                    resizes.push({
                        elementId: element.id,
                        newBounds: boundsData.bounds
                    });
                if (boundsData.alignmentChanged && boundsData.alignment !== undefined)
                    realignments.push({
                        elementId: element.id,
                        newAlignment: boundsData.alignment
                    });
            });
        const revision = (this.root !== undefined) ? this.root.revision : undefined;
        this.actionDispatcher.dispatch(new ComputedBoundsAction(resizes, revision, realignments));
        this.element2boundsData.clear();
    }

    protected getBoundsFromDOM() {
        this.element2boundsData.forEach(
            (boundsData, element) => {
                if (boundsData.bounds && isSizeable(element)) {
                    const vnode = boundsData.vnode;
                    if (vnode && vnode.elm) {
                        const boundingBox = this.getBounds(vnode.elm, element);
                        if (isAlignable(element) && !(
                            almostEquals(boundingBox.x, 0) && almostEquals(boundingBox.y, 0)
                        )) {
                            boundsData.alignment = {
                                x: -boundingBox.x,
                                y: -boundingBox.y
                            };
                            boundsData.alignmentChanged = true;
                        }
                        const newBounds = {
                            x: element.bounds.x,
                            y: element.bounds.y,
                            width: boundingBox.width,
                            height: boundingBox.height
                        };
                        if (!(almostEquals(newBounds.x, element.bounds.x)
                            && almostEquals(newBounds.y, element.bounds.y)
                            && almostEquals(newBounds.width, element.bounds.width)
                            && almostEquals(newBounds.height, element.bounds.height))) {
                            boundsData.bounds = newBounds;
                            boundsData.boundsChanged = true;
                        }
                    }
                }
            }
        );
    }

    protected getBounds(elm: any, element: BoundsAware): Bounds {
        const bounds = elm.getBBox();
        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    }
}
