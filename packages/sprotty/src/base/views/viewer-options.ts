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

import { Container, interfaces } from 'inversify';
import { safeAssign } from 'sprotty-protocol/lib/utils/object';
import { Limits } from '../../utils/geometry';
import { TYPES } from '../types';

export interface ViewerOptions {
    /** ID of the HTML element into which the visible diagram is rendered. */
    baseDiv: string
    /** CSS class added to the base element of the visible diagram. */
    baseClass: string
    /** ID of the HTML element into which the hidden diagram is rendered. */
    hiddenDiv: string
    /** CSS class added to the base element of the hidden rendering. */
    hiddenClass: string
    /** ID of the HTML element into which hover popup boxes are rendered. */
    popupDiv: string
    /** CSS class added to the base element of popup boxes. */
    popupClass: string
    /** CSS class added to popup boxes when they are closed. */
    popupClosedClass: string
    /** Whether client layouts need to be computed by Sprotty. This activates a hidden rendering cycle. */
    needsClientLayout: boolean
    /** Whether the model source needs to invoke a layout engine after a model update. */
    needsServerLayout: boolean
    /** Delay for opening a popup box after mouse hovering an element. */
    popupOpenDelay: number
    /** Delay for closing a popup box after leaving the corresponding element. */
    popupCloseDelay: number
    /** Minimum (zoom out) and maximum (zoom in) values for the zoom factor. */
    zoomLimits: Limits
    /** Minimum and maximum values for the horizontal scroll position. */
    horizontalScrollLimits: Limits
    /** Minimum and maximum values for the vertical scroll position. */
    verticalScrollLimits: Limits
}

export const defaultViewerOptions: () => ViewerOptions = () => ({
    baseDiv: 'sprotty',
    baseClass: 'sprotty',
    hiddenDiv: 'sprotty-hidden',
    hiddenClass: 'sprotty-hidden',
    popupDiv: 'sprotty-popup',
    popupClass: 'sprotty-popup',
    popupClosedClass: 'sprotty-popup-closed',
    needsClientLayout: true,
    needsServerLayout: false,
    popupOpenDelay: 1000,
    popupCloseDelay: 300,
    zoomLimits: { min: 0.01, max: 10 },
    horizontalScrollLimits: { min: -100_000, max: 100_000 },
    verticalScrollLimits: { min: -100_000, max: 100_000 }
});

/**
 * Utility function to partially set viewer options. Default values (from `defaultViewerOptions`) are used for
 * options that are not specified.
 */
export function configureViewerOptions(context: { bind: interfaces.Bind, isBound: interfaces.IsBound, rebind: interfaces.Rebind },
        options: Partial<ViewerOptions>): void {
    const opt: ViewerOptions = {
        ...defaultViewerOptions(),
        ...options
    };
    if (context.isBound(TYPES.ViewerOptions))
        context.rebind(TYPES.ViewerOptions).toConstantValue(opt);
    else
        context.bind(TYPES.ViewerOptions).toConstantValue(opt);
}

/**
 * Utility function to partially override the currently configured viewer options in a DI container.
 */
export function overrideViewerOptions(container: Container, options: Partial<ViewerOptions>): ViewerOptions {
    const opt = container.get<ViewerOptions>(TYPES.ViewerOptions);
    safeAssign(opt, options);
    return opt;
}
