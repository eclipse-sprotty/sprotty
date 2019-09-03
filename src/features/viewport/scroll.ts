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

import { Point } from "../../utils/geometry";
import { SModelElement, SModelRoot } from "../../base/model/smodel";
import { MouseListener } from "../../base/views/mouse-tool";
import { Action } from "../../base/actions/action";
import { SModelExtension } from "../../base/model/smodel-extension";
import { findParentByFeature } from "../../base/model/smodel-utils";
import { SetViewportAction } from "./viewport";
import { isViewport, Viewport } from "./model";
import { isMoveable } from "../move/model";
import { SRoutingHandle } from "../routing/model";

export interface Scrollable extends SModelExtension {
    scroll: Point
}

export function isScrollable(element: SModelElement | Scrollable): element is Scrollable {
    return 'scroll' in element;
}

export class ScrollMouseListener extends MouseListener {

    lastScrollPosition: Point |undefined;

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        const moveable = findParentByFeature(target, isMoveable);
        if (moveable === undefined && !(target instanceof SRoutingHandle)) {
            const viewport = findParentByFeature(target, isViewport);
            if (viewport)
                this.lastScrollPosition = { x: event.pageX, y: event.pageY };
            else
                this.lastScrollPosition = undefined;
        }
        return [];
    }

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        if (event.buttons === 0)
            this.mouseUp(target, event);
        else if (this.lastScrollPosition) {
            const viewport = findParentByFeature(target, isViewport);
            if (viewport) {
                const dx = (event.pageX - this.lastScrollPosition.x) / viewport.zoom;
                const dy = (event.pageY - this.lastScrollPosition.y) / viewport.zoom;
                const newViewport: Viewport = {
                    scroll: {
                        x: viewport.scroll.x - dx,
                        y: viewport.scroll.y - dy,
                    },
                    zoom: viewport.zoom
                };
                this.lastScrollPosition = {x: event.pageX, y: event.pageY};
                return [new SetViewportAction(viewport.id, newViewport, false)];
            }
        }
        return [];
    }

    mouseEnter(target: SModelElement, event: MouseEvent): Action[] {
        if (target instanceof SModelRoot && event.buttons === 0)
            this.mouseUp(target, event);
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        this.lastScrollPosition = undefined;
        return [];
    }
}
