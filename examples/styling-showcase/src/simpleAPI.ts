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
    LogLevel, RectangularNodeView, PolylineEdgeView, SNodeImpl, SEdgeImpl, SLabelImpl, SLabelView,
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
            'node:default': [SNodeImpl, RectangularNodeView],

            // Section 2: Subtype-based styling - different node types get additional CSS classes
            'node:server': [SNodeImpl, RectangularNodeView],
            'node:database': [SNodeImpl, RectangularNodeView],
            'node:router': [SNodeImpl, RectangularNodeView],

            // Section 3: Custom CSS classes - node with additional cssClasses property
            'node:critical': [SNodeImpl, RectangularNodeView],

            // Section 4: Conditional styling - custom view with dynamic CSS classes
            'node:load-monitor': [SNodeImpl, LoadMonitorNodeView],

            // Section 5: Interactive styling - node with selection and hover features
            'node:interactive': [SNodeImpl, RectangularNodeView, {
                enable: [selectFeature, hoverFeedbackFeature]
            }],

            // Edge configurations
            'edge:ethernet': [SEdgeImpl, PolylineEdgeView],
            'edge:wireless': [SEdgeImpl, PolylineEdgeView],
            'edge:fiber': [SEdgeImpl, PolylineEdgeView],

            // Label configuration
            'label:text': [SLabelImpl, SLabelView]
        }
    });
};
