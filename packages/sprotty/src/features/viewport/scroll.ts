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

import { inject } from 'inversify';
import { Viewport } from 'sprotty-protocol/lib/model';
import { Action, CenterAction, SetViewportAction } from 'sprotty-protocol/lib/actions';
import { almostEquals, Bounds, Point } from 'sprotty-protocol/lib/utils/geometry';
import { SModelElementImpl, SModelRootImpl } from '../../base/model/smodel';
import { MouseListener } from '../../base/views/mouse-tool';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { isViewport } from './model';
import { isMoveable } from '../move/model';
import { SRoutingHandleImpl } from '../routing/model';
import { getModelBounds } from '../projection/model';
import { getWindowScroll, hitsMouseEvent } from '../../utils/browser';
import { TYPES } from '../../base/types';
import { ViewerOptions } from '../../base/views/viewer-options';
import { ITouchListener } from '../../base/views/touch-tool';
import { limit } from '../../utils/geometry';

export class ScrollMouseListener extends MouseListener implements ITouchListener {

    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;

    protected lastScrollPosition: Point | undefined;
    protected lastTouchDistance: number | undefined;
    protected lastTouchMidpoint: Point | undefined;
    protected scrollbar: HTMLElement | undefined;
    protected scrollbarMouseDownTimeout: number | undefined;
    protected scrollbarMouseDownDelay = 200;

    override mouseDown(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        const moveable = findParentByFeature(target, isMoveable);
        if (moveable === undefined && !(target instanceof SRoutingHandleImpl)) {
            const viewport = findParentByFeature(target, isViewport);
            if (viewport) {
                return this.mouseDownOrSingleTouchStart(event, viewport);
            } else {
                this.lastScrollPosition = undefined;
                this.scrollbar = undefined;
            }
        }
        return [];
    }

    override mouseMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (event.buttons === 0) {
            return this.mouseUp(target, event);
        }
        return this.mouseOrSingleTouchMove(target, event);
    }

    override mouseEnter(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (target instanceof SModelRootImpl && event.buttons === 0) {
            this.mouseUp(target, event);
        }
        return [];
    }

    override mouseUp(target: SModelElementImpl, event: MouseEvent): Action[] {
        this.lastScrollPosition = undefined;
        this.scrollbar = undefined;
        return [];
    }

    override doubleClick(target: SModelElementImpl, event: MouseEvent): Action[] {
        const viewport = findParentByFeature(target, isViewport);
        if (viewport) {
            const scrollbar = this.getScrollbar(event);
            if (scrollbar) {
                window.clearTimeout(this.scrollbarMouseDownTimeout);
                const targetElement = this.findClickTarget(scrollbar, event);
                let elementId: string | undefined;
                if (targetElement && targetElement.id.startsWith('horizontal-projection:')) {
                    elementId = targetElement.id.substring('horizontal-projection:'.length);
                } else if (targetElement && targetElement.id.startsWith('vertical-projection:')) {
                    elementId = targetElement.id.substring('vertical-projection:'.length);
                }
                if (elementId) {
                    return [CenterAction.create([elementId], { animate: true, retainZoom: true })];
                }
            }
        }
        return [];
    }

    touchStart(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[] {
        const viewport = findParentByFeature(target, isViewport);
        if (viewport) {
            const touches = event.touches;
            if (touches.length === 1) {
                return this.mouseDownOrSingleTouchStart(touches[0], viewport);
            } else if (touches.length === 2) {
                this.lastTouchDistance = this.calculateDistance(touches);
                this.lastTouchMidpoint = this.calculateMidpoint(touches, viewport.canvasBounds);
            }
        } else {
            this.lastScrollPosition = undefined;
            this.scrollbar = undefined;
        }
        return [];
    }

    touchMove(target: SModelElementImpl, event: TouchEvent): Action[] {
        const touches = event.touches;
        if (touches.length === 1) {
            return this.mouseOrSingleTouchMove(target, touches[0]);
        } else if (touches.length === 2) {
            return this.twoTouchMove(target, touches);
        } else {
            return [];
        }
    }

    protected mouseDownOrSingleTouchStart(event: MouseEvent | Touch, viewport: SModelRootImpl & Viewport): (Action | Promise<Action>)[] {
        this.lastScrollPosition = { x: event.pageX, y: event.pageY };
        this.scrollbar = this.getScrollbar(event);
        if (this.scrollbar) {
            window.clearTimeout(this.scrollbarMouseDownTimeout);
            return this.moveScrollBar(viewport, event, this.scrollbar, true)
                .map(action => new Promise(resolve => {
                    this.scrollbarMouseDownTimeout = window.setTimeout(() => resolve(action), this.scrollbarMouseDownDelay);
                }));
        }
        return [];
    }

    protected mouseOrSingleTouchMove(target: SModelElementImpl, event: MouseEvent | Touch): Action[] {
        if (this.scrollbar) {
            window.clearTimeout(this.scrollbarMouseDownTimeout);
            const viewport = findParentByFeature(target, isViewport);
            if (viewport) {
                return this.moveScrollBar(viewport, event, this.scrollbar);
            }
        }
        if (this.lastScrollPosition) {
            const viewport = findParentByFeature(target, isViewport);
            if (viewport) {
                return this.dragCanvas(viewport, event, this.lastScrollPosition);
            }
        }
        return [];
    }

    protected twoTouchMove(target: SModelElementImpl, touches: TouchList): Action[] {
        const viewport = findParentByFeature(target, isViewport);
        if (!viewport) {
            return [];
        }
        const newDistance = this.calculateDistance(touches);
        const newMidpoint = this.calculateMidpoint(touches, viewport.canvasBounds);

        const scaleChange = newDistance / this.lastTouchDistance!;
        const newZoom = limit(viewport.zoom * scaleChange, this.viewerOptions.zoomLimits);

        const dx = (newMidpoint.x - this.lastTouchMidpoint!.x) / viewport.zoom;
        const dy = (newMidpoint.y - this.lastTouchMidpoint!.y) / viewport.zoom;
        const offsetFactor = 1.0 / newZoom - 1.0 / viewport.zoom;
        const newViewport = {
            scroll: {
                x: viewport.scroll.x - dx - offsetFactor * newMidpoint.x,
                y: viewport.scroll.y - dy - offsetFactor * newMidpoint.y
            },
            zoom: newZoom
        };

        this.lastTouchDistance = newDistance;
        this.lastTouchMidpoint = newMidpoint;
        return [SetViewportAction.create(viewport.id, newViewport, { animate: false })];
    }

    touchEnd(target: SModelElementImpl, event: TouchEvent): Action[] {
        if (event.touches.length === 0) {
            this.lastScrollPosition = undefined;
            this.lastTouchDistance = undefined;
            this.lastTouchMidpoint = undefined;
            this.scrollbar = undefined;
            return [];
        } else if (event.touches.length === 1) {
            this.lastScrollPosition = {
                x: event.touches[0].pageX,
                y: event.touches[0].pageY
            };
        }
        return [];
    }

    protected dragCanvas(model: SModelRootImpl & Viewport, event: MouseEvent | Touch, lastScrollPosition: Point): Action[] {
        let dx = (event.pageX - lastScrollPosition.x) / model.zoom;
        if (dx > 0 && almostEquals(model.scroll.x, this.viewerOptions.horizontalScrollLimits.min)
            || dx < 0 && almostEquals(model.scroll.x, this.viewerOptions.horizontalScrollLimits.max - model.canvasBounds.width / model.zoom)) {
            dx = 0;
        }
        let dy = (event.pageY - lastScrollPosition.y) / model.zoom;
        if (dy > 0 && almostEquals(model.scroll.y, this.viewerOptions.verticalScrollLimits.min)
            || dy < 0 && almostEquals(model.scroll.y, this.viewerOptions.verticalScrollLimits.max - model.canvasBounds.height / model.zoom)) {
            dy = 0;
        }
        if (dx === 0 && dy === 0) {
            return [];
        }
        const newViewport: Viewport = {
            scroll: {
                x: model.scroll.x - dx,
                y: model.scroll.y - dy,
            },
            zoom: model.zoom
        };
        this.lastScrollPosition = { x: event.pageX, y: event.pageY };
        return [SetViewportAction.create(model.id, newViewport, { animate: false })];
    }

    protected moveScrollBar(model: SModelRootImpl & Viewport, event: MouseEvent | Touch, scrollbar: HTMLElement, animate: boolean = false): Action[] {
        const modelBounds = getModelBounds(model);
        if (!modelBounds || model.zoom <= 0) {
            return [];
        }
        const scrollbarRect = scrollbar.getBoundingClientRect();
        let newScroll: { x: number, y: number };
        if (this.getScrollbarOrientation(scrollbar) === 'horizontal') {
            if (scrollbarRect.width <= 0) {
                return [];
            }
            const viewportSize = (model.canvasBounds.width / (model.zoom * modelBounds.width)) * scrollbarRect.width;
            let position = event.clientX - scrollbarRect.x - viewportSize / 2;
            if (position < 0) {
                position = 0;
            } else if (position > scrollbarRect.width - viewportSize) {
                position = scrollbarRect.width - viewportSize;
            }
            newScroll = {
                x: modelBounds.x + (position / scrollbarRect.width) * modelBounds.width,
                y: model.scroll.y
            };
            if (newScroll.x < this.viewerOptions.horizontalScrollLimits.min) {
                newScroll.x = this.viewerOptions.horizontalScrollLimits.min;
            } else if (newScroll.x > this.viewerOptions.horizontalScrollLimits.max - model.canvasBounds.width / model.zoom) {
                newScroll.x = this.viewerOptions.horizontalScrollLimits.max - model.canvasBounds.width / model.zoom;
            }
            if (almostEquals(newScroll.x, model.scroll.x)) {
                return [];
            }
        } else {
            if (scrollbarRect.height <= 0) {
                return [];
            }
            const viewportSize = (model.canvasBounds.height / (model.zoom * modelBounds.height)) * scrollbarRect.height;
            let position = event.clientY - scrollbarRect.y - viewportSize / 2;
            if (position < 0) {
                position = 0;
            } else if (position > scrollbarRect.height - viewportSize) {
                position = scrollbarRect.height - viewportSize;
            }
            newScroll = {
                x: model.scroll.x,
                y: modelBounds.y + (position / scrollbarRect.height) * modelBounds.height
            };
            if (newScroll.y < this.viewerOptions.verticalScrollLimits.min) {
                newScroll.y = this.viewerOptions.verticalScrollLimits.min;
            } else if (newScroll.y > this.viewerOptions.verticalScrollLimits.max - model.canvasBounds.height / model.zoom) {
                newScroll.y = this.viewerOptions.verticalScrollLimits.max - model.canvasBounds.height / model.zoom;
            }
            if (almostEquals(newScroll.y, model.scroll.y)) {
                return [];
            }
        }
        return [SetViewportAction.create(model.id, { scroll: newScroll, zoom: model.zoom }, { animate })];
    }

    protected getScrollbar(event: MouseEvent | Touch): HTMLElement | undefined {
        return findViewportScrollbar(event);
    }

    protected getScrollbarOrientation(scrollbar: HTMLElement): 'horizontal' | 'vertical' {
        if (scrollbar.classList.contains('horizontal')) {
            return 'horizontal';
        } else {
            return 'vertical';
        }
    }

    protected findClickTarget(scrollbar: HTMLElement, event: MouseEvent): HTMLElement | undefined {
        const matching = Array.from(scrollbar.children).filter(child =>
            child.id && child.classList.contains('sprotty-projection') && hitsMouseEvent(child, event)
        ) as HTMLElement[];
        if (matching.length > 0) {
            return matching[matching.length - 1];
        }
        return undefined;
    }

    protected calculateDistance(touches: TouchList): number {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    protected calculateMidpoint(touches: TouchList, canvasBounds: Bounds): Point {
        const windowScroll = getWindowScroll();
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2 + windowScroll.x - canvasBounds.x,
            y: (touches[0].clientY + touches[1].clientY) / 2 + windowScroll.y - canvasBounds.y
        };
    }

}

export function findViewportScrollbar(event: MouseEvent | Touch): HTMLElement | undefined {
    let element = event.target as HTMLElement | null;
    while (element) {
        if (element.classList && element.classList.contains('sprotty-projection-bar')) {
            return element;
        }
        element = element.parentElement;
    }
    return undefined;
}
