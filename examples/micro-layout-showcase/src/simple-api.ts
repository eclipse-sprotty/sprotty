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
    SCompartmentView,
    SLabelView,
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
            'node:interactive-card': { model: InteractiveCardNode, view: InteractiveCardView, features: { enable: [layoutableChildFeature] } },

            // Demo cards showing different layout types
            'node:demo-card': { view: DemoCardView, features: { enable: [layoutableChildFeature] } },

            // Small components (icons, buttons, metrics)
            'node:component': { view: ComponentView, features: { enable: [layoutableChildFeature] } },

            // Basic nodes for nested examples (with layoutableChildFeature)
            'node:basic': { view: RectangularNodeView, features: { enable: [layoutableChildFeature] } },

            // Regular nodes for comparison (without layoutableChildFeature)
            'node:regular': { view: RectangularNodeView },

            // Compartments for complex layouts
            'comp:compartment': { view: SCompartmentView },

            // Labels
            'label:text': { view: SLabelView }
        }
    });
};
