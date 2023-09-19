/********************************************************************************
 * Copyright (c) 2017-2023 TypeFox and others.
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

import {
    SShapeElementImpl, SChildElementImpl, BoundsAware, boundsFeature, Fadeable, fadeFeature,
    layoutContainerFeature, LayoutContainer, Selectable, selectFeature,
    ViewportRootElement, hoverFeedbackFeature, Hoverable, popupFeature
} from 'sprotty';
import { Bounds, SModelElement, SModelRoot, JsonMap, SShapeElement } from 'sprotty-protocol';

export enum Direction { up, down, left, right }

export const CORE_WIDTH = 50;
export const CORE_DISTANCE = 10;

export interface ProcessorSchema extends SModelRoot {
    rows: number
    columns: number
}

export class Processor extends ViewportRootElement implements BoundsAware {
    static override readonly DEFAULT_FEATURES = [...ViewportRootElement.DEFAULT_FEATURES, boundsFeature];

    rows: number = 0;
    columns: number = 0;
    layoutOptions: JsonMap;

    override get bounds(): Bounds {
        return {
            x: -3 * CORE_DISTANCE,
            y: -3 * CORE_DISTANCE,
            width: this.columns * (CORE_WIDTH + CORE_DISTANCE) + 5 * CORE_DISTANCE,
            height: this.rows * (CORE_WIDTH + CORE_DISTANCE) + 5 * CORE_DISTANCE
        };
    }

    override set bounds(newBounds: Bounds) {
        // Ignore the new bounds
    }

}

export interface CoreSchema extends SShapeElement {
    row: number
    column: number
    kernelNr?: number
    selected?: boolean
    layout: string
    children: SModelElement[]
}

export class Core extends SShapeElementImpl implements Selectable, Fadeable, Hoverable, LayoutContainer {
    static readonly DEFAULT_FEATURES = [selectFeature, fadeFeature, layoutContainerFeature,
        hoverFeedbackFeature, popupFeature];

    hoverFeedback: boolean = false;
    kernelNr: number = -1;
    column: number = 0;
    row: number = 0;
    selected: boolean = false;
    opacity: number = 1;
    layout: string = 'vbox';

}

export interface CrossbarSchema extends SModelElement {
    selected?: boolean
    direction: Direction
    load: number
}

export class Crossbar extends SChildElementImpl {
    direction: Direction;
    load: number = 0;
}

export interface ChannelSchema extends SModelElement {
    row: number
    column: number
    direction: Direction
    selected?: boolean
    load: number
}

export class Channel extends SChildElementImpl implements Selectable {
    static readonly DEFAULT_FEATURES = [selectFeature];

    column: number = 0;
    row: number = 0;
    direction: Direction;
    load: number = 0;
    selected: boolean = false;

}
