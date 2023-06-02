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

import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { Action, ComputedBoundsAction, ElementAndAlignment, ElementAndBounds, RequestBoundsAction } from 'sprotty-protocol/lib/actions';
import { almostEquals, Bounds, Point } from 'sprotty-protocol/lib/utils/geometry';
import { isSVGGraphicsElement } from '../../utils/browser';
import { ILogger } from '../../utils/logging';
import { IActionDispatcher } from '../../base/actions/action-dispatcher';
import { SChildElementImpl, SModelElementImpl, SModelRootImpl } from '../../base/model/smodel';
import { TYPES } from '../../base/types';
import { IVNodePostprocessor } from '../../base/views/vnode-postprocessor';
import { Layouter } from './layout';
import { BoundsAware, isAlignable, isLayoutContainer, isSizeable } from './model';

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
export class HiddenBoundsUpdater implements IVNodePostprocessor {

    @inject(TYPES.ILogger) protected logger: ILogger;
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(TYPES.Layouter) protected layouter: Layouter;

    private readonly element2boundsData: Map<SModelElementImpl & BoundsAware, BoundsData> = new Map;

    root: SModelRootImpl | undefined;

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (isSizeable(element) || isLayoutContainer(element)) {
            this.element2boundsData.set(element, {
                vnode: vnode,
                bounds: element.bounds,
                boundsChanged: false,
                alignmentChanged: false
            });
        }
        if (element instanceof SModelRootImpl) {
            this.root = element;
        }
        return vnode;
    }

    postUpdate(cause?: Action) {
        if (cause === undefined || cause.kind !== RequestBoundsAction.KIND) {
            return;
        }
        const request = cause as RequestBoundsAction;
        this.getBoundsFromDOM();
        this.layouter.layout(this.element2boundsData);
        const resizes: ElementAndBounds[] = [];
        const alignments: ElementAndAlignment[] = [];
        this.element2boundsData.forEach(
            (boundsData, element) => {
                if (boundsData.boundsChanged && boundsData.bounds !== undefined) {
                    const resize: ElementAndBounds = {
                        elementId: element.id,
                        newSize: {
                            width: boundsData.bounds.width,
                            height: boundsData.bounds.height
                        }
                    };
                    // don't copy position if the element is layouted by the server
                    if (element instanceof SChildElementImpl && isLayoutContainer(element.parent)) {
                        resize.newPosition = {
                            x: boundsData.bounds.x,
                            y: boundsData.bounds.y,
                        };
                    }
                    resizes.push(resize);
                }
                if (boundsData.alignmentChanged && boundsData.alignment !== undefined) {
                    alignments.push({
                        elementId: element.id,
                        newAlignment: boundsData.alignment
                    });
                }
            });
        const revision = (this.root !== undefined) ? this.root.revision : undefined;
        this.actionDispatcher.dispatch(ComputedBoundsAction.create(resizes, { revision, alignments, requestId: request.requestId }));
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

    /**
     * Compute the bounds of the given DOM element. Override this method to customize how
     * the bounding box of a rendered view is determined.
     *
     * In case your Sprotty model element contains children that are rendered outside of
     * their parent, you can add the `ATTR_BBOX_ELEMENT` attribute to the SVG element
     * that shall be used to compute the bounding box.
     */
    protected getBounds(elm: Node, element: SModelElementImpl & BoundsAware): Bounds {
        if (!isSVGGraphicsElement(elm)) {
            this.logger.error(this, 'Not an SVG element:', elm);
            return Bounds.EMPTY;
        }
        if (elm.tagName === 'g') {
            for (const child of Array.from(elm.children)) {
                if (child.getAttribute(ATTR_BBOX_ELEMENT) !== null) {
                    return this.getBounds(child, element);
                }
            }
        }
        const bounds = elm.getBBox();
        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        };
    }
}

/**
 * Attribute name identifying the SVG element that determines the bounding box of a rendered view.
 * This can be used when a view creates a group of which only a part should contribute to the
 * bounding box computed by `HiddenBoundsUpdater`.
 */
export const ATTR_BBOX_ELEMENT = 'bboxElement';
