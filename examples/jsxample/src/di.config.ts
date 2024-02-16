/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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

import { Container, ContainerModule } from "inversify";
import {
    ConsoleLogger,
    LocalModelSource,
    LogLevel,
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    SLabelView,
    SNodeImpl,
    TYPES,
    configureModelElement,
    configureViewerOptions,
    loadDefaultModules} from "sprotty";
import { ExampleNodeView } from "./views";

export default (containerId: string) => {
    require('../css/diagram.css');

    const jsxampleModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };

        configureModelElement(context, 'graph', SGraphImpl, SGraphView);
        configureModelElement(context, 'node', SNodeImpl, ExampleNodeView);
        configureModelElement(context, 'label', SLabelImpl, SLabelView);

        configureViewerOptions(context, {
            needsClientLayout: true,
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(jsxampleModule);
    return container;
};
