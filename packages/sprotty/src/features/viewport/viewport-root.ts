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

import { Bounds, Point, isBounds, isValidDimension, EMPTY_DIMENSION, Dimension, ORIGIN_POINT } from "../../utils/geometry";
import { SModelRoot, SModelIndex, SModelElement, SModelRootSchema } from '../../base/model/smodel';
import { Viewport, viewportFeature } from "./model";
import { exportFeature } from "../export/model";
import { BoundsAware } from "../bounds/model";

export interface ViewportRootElementSchema extends SModelRootSchema {
    scroll?: Point
    zoom?: number
    position?: Point
    size?: Dimension
}

/**
 * Model root element that defines a viewport, so it transforms the coordinate system with
 * a `scroll` translation and a `zoom` scaling.
 */
export class ViewportRootElement extends SModelRoot implements Viewport, BoundsAware {
    static readonly DEFAULT_FEATURES = [viewportFeature, exportFeature];

    scroll: Point = { x: 0, y: 0 };
    zoom: number = 1;
    position: Point = ORIGIN_POINT;
    size: Dimension = EMPTY_DIMENSION;

    constructor(index?: SModelIndex<SModelElement>) {
        super(index);
    }

    get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.size.width,
            height: this.size.height
        };
    }

    set bounds(newBounds: Bounds) {
        this.position = {
            x: newBounds.x,
            y: newBounds.y
        };
        this.size = {
            width: newBounds.width,
            height: newBounds.height
        };
    }

    localToParent(point: Point | Bounds): Bounds {
        const result = {
            x: (point.x - this.scroll.x) * this.zoom,
            y: (point.y - this.scroll.y) * this.zoom,
            width: -1,
            height: -1
        };
        if (isBounds(point)) {
            result.width = point.width * this.zoom;
            result.height = point.height * this.zoom;
        }
        return result;
    }

    parentToLocal(point: Point | Bounds): Bounds {
        const result = {
            x: (point.x / this.zoom) + this.scroll.x,
            y: (point.y / this.zoom) + this.scroll.y,
            width: -1,
            height: -1
        };
        if (isBounds(point) && isValidDimension(point)) {
            result.width = point.width / this.zoom;
            result.height = point.height / this.zoom;
        }
        return result;
    }
}
