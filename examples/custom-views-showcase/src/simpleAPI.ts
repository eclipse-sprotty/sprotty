/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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
    createSprottyDiagram,
    fadeFeature,
    hoverFeedbackFeature,
    LogLevel,
    moveFeature,
    popupFeature,
    selectFeature
} from 'sprotty';

// Import our custom model classes
import {
    BasicShapeNode,
    ComplexNode,
    CustomLabel,
    EnhancedNode,
    StatefulNode,
    StyledEdge
} from './model.js';

// Import our custom view classes
import {
    BasicShapeView,
    ComplexNodeView,
    CustomLabelView,
    EnhancedNodeView,
    StatefulNodeView,
    StyledEdgeView
} from './views.js';

const basicShapeFeatures = { enable: [selectFeature, moveFeature, hoverFeedbackFeature] };

/**
 * The container of `di.config.ts`, built with the simplified API.
 *
 * `createSprottyDiagram` supplies everything the hand-written `ContainerModule` had to spell
 * out: the default modules, a `LocalModelSource`, a console logger, and the base element
 * vocabulary. What is left below is only what is specific to this diagram — the custom element
 * types, and the one viewer option that differs from the default.
 *
 * It returns a diagram rather than a container: `standalone.ts` sets the model and dispatches
 * through the returned object, and never mentions `TYPES` or `container.get`. The container is
 * still there, as `diagram.container`, for anything the diagram does not cover.
 *
 * Two things the other file configures are absent here on purpose:
 *
 * - `graph` is one of the default element types, registered with exactly the `SGraphImpl` /
 *   `SGraphView` pair that `di.config.ts` spells out by hand.
 * - `baseDiv` already defaults to `'sprotty'`, the id used by this example's HTML page.
 *
 * The log level is spelled out, because the default is `warn` and this example has always run at
 * `log`.
 *
 * The default vocabulary also covers `routing-point` and `volatile-routing-point`, which the
 * framework creates whenever an edge is selected. `di.config.ts` never registers those, so
 * clicking an edge there paints `missing "routing-point" view` instead of a handle.
 */
export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    return createSprottyDiagram({
        viewerOptions: {
            needsClientLayout: false,
        },
        logLevel: LogLevel.log,
        elements: {
            'node:basic-circle': [BasicShapeNode, BasicShapeView, basicShapeFeatures],
            'node:basic-triangle': [BasicShapeNode, BasicShapeView, basicShapeFeatures],
            'node:basic-diamond': [BasicShapeNode, BasicShapeView, basicShapeFeatures],
            'node:enhanced': [EnhancedNode, EnhancedNodeView, {
                enable: [selectFeature, moveFeature, hoverFeedbackFeature, popupFeature]
            }],
            'node:complex': [ComplexNode, ComplexNodeView, {
                enable: [selectFeature, moveFeature, hoverFeedbackFeature, popupFeature, fadeFeature]
            }],
            'node:stateful': [StatefulNode, StatefulNodeView, {
                enable: [selectFeature, hoverFeedbackFeature]
            }],
            'edge:styled': [StyledEdge, StyledEdgeView],
            'label:custom': [CustomLabel, CustomLabelView]
        }
    });
};
