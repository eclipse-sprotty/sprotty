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

import {
    SNodeImpl,
    SButtonImpl,
    SLabelImpl,
    selectFeature,
    moveFeature,
    hoverFeedbackFeature,
    fadeFeature,
    boundsFeature,
    layoutContainerFeature,
    layoutableChildFeature
} from 'sprotty';

/**
 * Interactive Node with buttons and rich content
 */
export class InteractiveNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = [
        selectFeature,
        moveFeature,
        hoverFeedbackFeature,
        fadeFeature,
        boundsFeature,
        layoutContainerFeature
    ];

    // Node content
    title?: string;
    description?: string;
    icon?: string;
    status?: 'online' | 'offline' | 'warning' | 'error';

    // Layout configuration
    override layout: string = 'vbox';
    override layoutOptions = {
        paddingTop: 8,
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: 8,
        vGap: 6
    };
}

/**
 * Interactive Button with custom styling
 */
export class InteractiveButton extends SButtonImpl {
    static override readonly DEFAULT_FEATURES = [
        boundsFeature
    ];

    buttonType?: 'info' | 'delete' | 'edit' | 'settings';
    tooltip?: string;
}

/**
 * Interactive Label with layout features
 */
export class InteractiveLabel extends SLabelImpl {
    static override readonly DEFAULT_FEATURES = [
        boundsFeature,
        layoutableChildFeature
    ];

    labelType?: 'title' | 'description' | 'status' | 'button-label';
}
