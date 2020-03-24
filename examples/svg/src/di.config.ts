/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
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
    TYPES, ConsoleLogger, LogLevel, loadDefaultModules, LocalModelSource, PreRenderedView,
    SvgViewportView, ViewportRootElement, ShapedPreRenderedElement, configureModelElement,
    ForeignObjectElement, ForeignObjectView
} from "../../../src";

export default () => {
    require("../../../css/sprotty.css");
    require("../css/diagram.css");

    const svgModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        const context = { bind, unbind, isBound, rebind };
        configureModelElement(context, 'svg', ViewportRootElement, SvgViewportView);
        configureModelElement(context, 'pre-rendered', ShapedPreRenderedElement, PreRenderedView);
        configureModelElement(context, 'foreign-object', ForeignObjectElement, ForeignObjectView);
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(svgModule);
    return container;
};
