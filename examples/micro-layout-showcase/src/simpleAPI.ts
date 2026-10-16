/********************************************************************************
 * Copyright (c) 2025-2026 TypeFox and others.
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
    LogLevel,
    RectangularNodeView,
    SCompartmentImpl,
    SCompartmentView,
    SLabelImpl, SLabelView,
    SNodeImpl,
    createSprottyDiagram,
    layoutableChildFeature
} from 'sprotty';
import { InteractiveCardNode } from './model.js';
import { ComponentView, DemoCardView, InteractiveCardView } from './views.js';

export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    // CRITICAL: micro-layout needs client-side layout, which is the default `needsClientLayout: true`
    return createSprottyDiagram({
        logLevel: LogLevel.log,
        elements: {
            // Interactive card that users can modify
            'node:interactive-card': [InteractiveCardNode, InteractiveCardView, { enable: [layoutableChildFeature] }],

            // Demo cards showing different layout types
            'node:demo-card': [SNodeImpl, DemoCardView, { enable: [layoutableChildFeature] }],

            // Small components (icons, buttons, metrics)
            'node:component': [SNodeImpl, ComponentView, { enable: [layoutableChildFeature] }],

            // Basic nodes for nested examples (with layoutableChildFeature)
            'node:basic': [SNodeImpl, RectangularNodeView, { enable: [layoutableChildFeature] }],

            // Regular nodes for comparison (without layoutableChildFeature)
            'node:regular': [SNodeImpl, RectangularNodeView],

            // Compartments for complex layouts
            'comp:compartment': [SCompartmentImpl, SCompartmentView],

            // Labels
            'label:text': [SLabelImpl, SLabelView]
        }
    });
};
