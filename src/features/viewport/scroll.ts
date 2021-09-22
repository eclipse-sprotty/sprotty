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

import { Point } from '../../utils/geometry';
import { SModelElement, SModelRoot } from '../../base/model/smodel';
import { MouseListener } from '../../base/views/mouse-tool';
import { Action } from '../../base/actions/action';
import { SModelExtension } from '../../base/model/smodel-extension';
import { findParentByFeature } from '../../base/model/smodel-utils';
import { SetViewportAction } from './viewport';
import { isViewport, Viewport } from './model';
import { isMoveable } from '../move/model';
import { SRoutingHandle } from '../routing/model';
import { getModelBounds } from '../projection/model';

export interface Scrollable extends SModelExtension {
    scroll: Point
}

export function isScrollable(element: SModelElement | Scrollable): element is Scrollable {
    return 'scroll' in element;
}

export class ScrollMouseListener extends MouseListener {

    lastScrollPosition: Point |undefined;
    scrollbar: HTMLElement | undefined;

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const moveable = findParentByFeature(target, isMoveable);
        if (moveable === undefined && !(target instanceof SRoutingHandle)) {
            const viewport = findParentByFeature(target, isViewport);
            if (viewport) {
                this.lastScrollPosition = { x: event.pageX, y: event.pageY };
                this.scrollbar = this.getScrollbar(event);
                if (this.scrollbar) {
                    return this.moveScrollBar(viewport, event, this.scrollbar);
                }
            } else {
                this.lastScrollPosition = undefined;
                this.scrollbar = undefined;
            }
        }
        return [];
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (event.buttons === 0) {
            return this.mouseUp(target, event);
        }
        if (this.scrollbar) {
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

    mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SModelRoot && event.buttons === 0) {
            this.mouseUp(target, event);
        }
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        this.lastScrollPosition = undefined;
        this.scrollbar = undefined;
        return [];
    }

    protected dragCanvas(viewport: SModelRoot & Viewport, event: MouseEvent, lastScrollPosition: Point): Action[] {
        const dx = (event.pageX - lastScrollPosition.x) / viewport.zoom;
        const dy = (event.pageY - lastScrollPosition.y) / viewport.zoom;
        const newViewport: Viewport = {
            scroll: {
                x: viewport.scroll.x - dx,
                y: viewport.scroll.y - dy,
            },
            zoom: viewport.zoom
        };
        this.lastScrollPosition = { x: event.pageX, y: event.pageY };
        return [new SetViewportAction(viewport.id, newViewport, false)];
    }

    protected moveScrollBar(model: SModelRoot & Viewport, event: MouseEvent, scrollbar: HTMLElement): Action[] {
        const modelBounds = getModelBounds(model);
        if (!modelBounds || model.zoom <= 0) {
            return [];
        }
        const scrollbarRect = scrollbar.getBoundingClientRect();
        let newScroll: Point;
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
        }
        return [new SetViewportAction(model.id, { scroll: newScroll, zoom: model.zoom }, false)];
    }

    protected getScrollbar(event: MouseEvent): HTMLElement | undefined {
        let element = event.target as HTMLElement | null;
        while (element) {
            if (element.classList && element.classList.contains('sprotty-projection-bar')) {
                return element;
            }
            element = element.parentElement;
        }
        return undefined;
    }

    protected getScrollbarOrientation(scrollbar: HTMLElement): 'horizontal' | 'vertical' {
        if (scrollbar.classList.contains('horizontal')) {
            return 'horizontal';
        } else {
            return 'vertical';
        }
    }

}
