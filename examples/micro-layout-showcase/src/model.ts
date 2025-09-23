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

import { SNodeImpl } from 'sprotty';

/**
 * Custom node model for interactive layout demonstration.
 * This node's layout properties can be modified through the UI controls.
 */
export class InteractiveCardNode extends SNodeImpl {
    // Layout properties that can be modified interactively
    override layout: 'vbox' | 'hbox' | 'stack' = 'vbox';

    override layoutOptions = {
        hAlign: 'center' as 'left' | 'center' | 'right',
        vAlign: 'center' as 'top' | 'center' | 'bottom',
        paddingTop: 5,
        paddingRight: 10,
        paddingBottom: 5,
        paddingLeft: 10,
        minWidth: 100,
        minHeight: 80,
        resizeContainer: true
    };
}
