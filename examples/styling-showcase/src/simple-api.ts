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
    LogLevel, RectangularNodeView, PolylineEdgeView, SLabelView,
    selectFeature, hoverFeedbackFeature, createSprottyDiagram
} from 'sprotty';
import { LoadMonitorNodeView } from './views.js';

export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    return createSprottyDiagram({
        viewerOptions: {
            needsClientLayout: false
        },
        logLevel: LogLevel.log,
        elements: {
            // Section 1: Default styling - basic nodes with only sprotty-node class
            'node:default': { view: RectangularNodeView },

            // Section 2: Subtype-based styling - different node types get additional CSS classes
            'node:server': { view: RectangularNodeView },
            'node:database': { view: RectangularNodeView },
            'node:router': { view: RectangularNodeView },

            // Section 3: Custom CSS classes - node with additional cssClasses property
            'node:critical': { view: RectangularNodeView },

            // Section 4: Conditional styling - custom view with dynamic CSS classes
            'node:load-monitor': { view: LoadMonitorNodeView },

            // Section 5: Interactive styling - node with selection and hover features
            'node:interactive': { view: RectangularNodeView, features: {
                enable: [selectFeature, hoverFeedbackFeature]
            } },

            // Edge configurations
            'edge:ethernet': { view: PolylineEdgeView },
            'edge:wireless': { view: PolylineEdgeView },
            'edge:fiber': { view: PolylineEdgeView },

            // Label configuration
            'label:text': { view: SLabelView }
        }
    });
};
