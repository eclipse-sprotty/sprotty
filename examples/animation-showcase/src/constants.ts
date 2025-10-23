/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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

import { AnimationState } from './model';

/**
 * Color mapping for different animation states
 */
export const STATE_COLORS: Record<AnimationState, string> = {
    idle: '#e0e0e0',
    active: '#2196f3',
    success: '#4caf50',
    error: '#f44336',
    loading: '#ff9800'
};

/**
 * State indicator icon dimensions
 */
export const ICON_SIZE = 16;
export const ICON_PADDING = 8;
export const ICON_SPINNER_RADIUS_OFFSET = 2;

/**
 * Edge animation dash pattern
 */
export const EDGE_DASH_ARRAY = '80 20';

