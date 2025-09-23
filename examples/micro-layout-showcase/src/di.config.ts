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

import { Container, ContainerModule } from 'inversify';
import {
    ConsoleLogger,
    LocalModelSource,
    LogLevel,
    RectangularNodeView,
    SCompartmentImpl,
    SCompartmentView,
    SGraphImpl,
    SGraphView,
    SLabelImpl, SLabelView,
    SNodeImpl,
    TYPES,
    configureModelElement,
    configureViewerOptions,
    layoutableChildFeature,
    loadDefaultModules
} from 'sprotty';
import { InteractiveCardNode } from './model';
import { ComponentView, DemoCardView, InteractiveCardView } from './views';

export default () => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const microLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };

        // Configure model elements for micro-layout demonstration
        configureModelElement(context, 'graph', SGraphImpl, SGraphView);

        // Interactive card that users can modify
        configureModelElement(context, 'node:interactive-card', InteractiveCardNode, InteractiveCardView, { enable: [layoutableChildFeature] });

        // Demo cards showing different layout types
        configureModelElement(context, 'node:demo-card', SNodeImpl, DemoCardView, { enable: [layoutableChildFeature] });

        // Small components (icons, buttons, metrics)
        configureModelElement(context, 'node:component', SNodeImpl, ComponentView, { enable: [layoutableChildFeature] });

        // Basic nodes for nested examples (with layoutableChildFeature)
        configureModelElement(context, 'node:basic', SNodeImpl, RectangularNodeView, {
            enable: [layoutableChildFeature]
        });

        // Regular nodes for comparison (without layoutableChildFeature)
        configureModelElement(context, 'node:regular', SNodeImpl, RectangularNodeView);

        // Compartments for complex layouts
        configureModelElement(context, 'comp:compartment', SCompartmentImpl, SCompartmentView);

        // Labels
        configureModelElement(context, 'label:text', SLabelImpl, SLabelView);

        // CRITICAL: Enable client-side layout for micro-layout to work
        configureViewerOptions(context, {
            needsClientLayout: true,
            baseDiv: 'sprotty'
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(microLayoutModule);
    return container;
};
