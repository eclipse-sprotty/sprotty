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

import { Bounds, EMPTY_BOUNDS, isValidDimension, Dimension, Point } from "../../utils/geometry";
import { SParentElement, SModelElement, SChildElement } from "../../base/model/smodel";
import { isLayoutContainer, isLayoutableChild, LayoutContainer, isBoundsAware } from "./model";
import { ILayout, StatefulLayouter } from './layout';
import { AbstractLayoutOptions, HAlignment, VAlignment } from './layout-options';
import { BoundsData } from './hidden-bounds-updater';

export abstract class AbstractLayout<T extends AbstractLayoutOptions> implements ILayout {

    layout(container: SParentElement & LayoutContainer,
           layouter: StatefulLayouter) {
        const boundsData = layouter.getBoundsData(container);
        const options = this.getLayoutOptions(container);
        const childrenSize = this.getChildrenSize(container, options, layouter);
        const maxWidth = options.paddingFactor * (
            options.resizeContainer
            ? childrenSize.width
            : Math.max(0, this.getFixedContainerBounds(container, options, layouter).width) - options.paddingLeft - options.paddingRight);
        const maxHeight =  options.paddingFactor * (
            options.resizeContainer
            ? childrenSize.height
            : Math.max(0, this.getFixedContainerBounds(container, options, layouter).height) - options.paddingTop - options.paddingBottom);
        if (maxWidth > 0 && maxHeight > 0) {
            const offset = this.layoutChildren(container, layouter, options, maxWidth, maxHeight);
            boundsData.bounds = this.getFinalContainerBounds(container, offset, options, maxWidth, maxHeight);
            boundsData.boundsChanged = true;
        }
    }
    protected abstract layoutChild(child: SChildElement,
                                boundsData: BoundsData, bounds: Bounds,
                                childOptions: T, containerOptions: T,
                                currentOffset: Point,
                                maxWidth: number, maxHeight: number): Point;

    protected getFinalContainerBounds(container: SParentElement & LayoutContainer,
                                    lastOffset: Point,
                                    options: T,
                                    maxWidth: number,
                                    maxHeight: number): Bounds {
        return {
            x: container.bounds.x,
            y: container.bounds.y,
            width: Math.max(options.minWidth, maxWidth + options.paddingLeft + options.paddingRight),
            height: Math.max(options.minHeight, maxHeight + options.paddingTop + options.paddingBottom)
        };
    }

    protected getFixedContainerBounds(
            container: SModelElement,
            layoutOptions: T,
            layouter: StatefulLayouter): Bounds {
        let currentContainer = container;
        while (true) {
            if (isBoundsAware(currentContainer)) {
                const bounds = currentContainer.bounds;
                if (isLayoutContainer(currentContainer) && layoutOptions.resizeContainer)
                    layouter.log.error(currentContainer, 'Resizable container found while detecting fixed bounds');
                if (isValidDimension(bounds))
                    return bounds;
            }
            if (currentContainer instanceof SChildElement) {
                currentContainer = currentContainer.parent;
            } else {
                layouter.log.error(currentContainer, 'Cannot detect fixed bounds');
                return EMPTY_BOUNDS;
            }
        }
    }

    protected abstract getChildrenSize(container: SParentElement & LayoutContainer,
                               containerOptions: T,
                               layouter: StatefulLayouter): Dimension;

    protected layoutChildren(container: SParentElement & LayoutContainer,
                            layouter: StatefulLayouter,
                            containerOptions: T,
                            maxWidth: number,
                            maxHeight: number): Point {
        let currentOffset: Point = {
            x: containerOptions.paddingLeft + 0.5 * (maxWidth - (maxWidth / containerOptions.paddingFactor)),
            y: containerOptions.paddingTop + 0.5 * (maxHeight - (maxHeight / containerOptions.paddingFactor))};
        container.children.forEach(
            child => {
                if (isLayoutableChild(child)) {
                    const boundsData = layouter.getBoundsData(child);
                    const bounds = boundsData.bounds;
                    const childOptions = this.getChildLayoutOptions(child, containerOptions);
                    if (bounds !== undefined && isValidDimension(bounds)) {
                        currentOffset = this.layoutChild(child, boundsData, bounds,
                            childOptions, containerOptions, currentOffset,
                            maxWidth, maxHeight);
                    }
                }
            }
        );
        return currentOffset;
    }

    protected getDx(hAlign: HAlignment, bounds: Bounds, maxWidth: number): number {
        switch (hAlign) {
            case 'left':
                return 0;
            case 'center':
                return 0.5 * (maxWidth - bounds.width);
            case 'right':
                return maxWidth - bounds.width;
        }
    }

    protected getDy(vAlign: VAlignment, bounds: Bounds, maxHeight: number): number {
        switch (vAlign) {
            case 'top':
                return 0;
            case 'center':
                return 0.5 * (maxHeight - bounds.height);
            case 'bottom':
                return maxHeight - bounds.height;
        }
    }

    protected getChildLayoutOptions(child: SChildElement, containerOptions: T): T {
        const layoutOptions = (child as any).layoutOptions;
        if (layoutOptions === undefined)
            return containerOptions;
        else
            return this.spread(containerOptions, layoutOptions);
    }

    protected getLayoutOptions(element: SModelElement): T {
        let current = element;
        const allOptions: T[] = [];
        while (current !== undefined) {
            const layoutOptions = (current as any).layoutOptions;
            if (layoutOptions !== undefined)
                allOptions.push(layoutOptions);
            if (current instanceof SChildElement)
                current = current.parent;
            else
                break;
        }
        return allOptions.reverse().reduce(
            (a, b) => { return this.spread(a, b); }, this.getDefaultLayoutOptions());
    }

    protected abstract getDefaultLayoutOptions(): T;

    protected abstract spread(a: T, b: T): T;
}
