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

import { Bounds, Point, isValidDimension } from '../../utils/geometry';
import { SParentElement, SChildElement } from "../../base/model/smodel";
import { AbstractLayout } from './abstract-layout';
import { AbstractLayoutOptions, VAlignment } from './layout-options';
import { BoundsData } from './hidden-bounds-updater';
import { LayoutContainer, isLayoutableChild } from './model';
import { StatefulLayouter } from './layout';

export interface HBoxLayoutOptions extends AbstractLayoutOptions {
    hGap: number
    vAlign: VAlignment
}

/**
 * Layouts children of a container in horizontal (left->right) direction.
 */
export class HBoxLayouter extends AbstractLayout<HBoxLayoutOptions> {

    static KIND = 'hbox';

    protected getChildrenSize(container: SParentElement & LayoutContainer,
                               containerOptions: HBoxLayoutOptions,
                               layouter: StatefulLayouter) {
        let maxWidth = 0;
        let maxHeight = -1;
        let isFirst = true;
        container.children.forEach(
            child => {
                if (isLayoutableChild(child)) {
                    const bounds = layouter.getBoundsData(child).bounds;
                    if (bounds !== undefined && isValidDimension(bounds)) {
                        if (isFirst)
                            isFirst = false;
                        else
                            maxWidth += containerOptions.hGap;
                        maxWidth += bounds.width;
                        maxHeight = Math.max(maxHeight, bounds.height);
                    }
                }
            }
        );
        return {
            width: maxWidth,
            height: maxHeight
        };
    }

    protected layoutChild(child: SChildElement,
                        boundsData: BoundsData,
                        bounds: Bounds,
                        childOptions: HBoxLayoutOptions,
                        containerOptions: HBoxLayoutOptions,
                        currentOffset: Point,
                        maxWidth: number,
                        maxHeight: number): Point {
        const dy = this.getDy(childOptions.vAlign, bounds, maxHeight);
        boundsData.bounds = {
            x: currentOffset.x + (child as any).bounds.x - bounds.x,
            y: containerOptions.paddingTop + (child as any).bounds.y - bounds.y + dy,
            width: bounds.width,
            height: bounds.height
        };
        boundsData.boundsChanged = true;
        return {
            x: currentOffset.x + bounds.width + containerOptions.hGap,
            y: currentOffset.y
        };
    }

    protected getDefaultLayoutOptions(): HBoxLayoutOptions {
        return {
            resizeContainer: true,
            paddingTop: 5,
            paddingBottom: 5,
            paddingLeft: 5,
            paddingRight: 5,
            paddingFactor: 1,
            hGap: 1,
            vAlign: 'center',
            minWidth: 0,
            minHeight: 0
        };
    }

    protected spread(a: HBoxLayoutOptions, b: HBoxLayoutOptions): HBoxLayoutOptions {
        return { ...a, ...b };
    }

}
