/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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

import { Container, ContainerModule, injectable, inject } from "inversify";
import {
    TYPES, configureViewerOptions, SGraphView, ConsoleLogger, LogLevel, loadDefaultModules,
    LocalModelSource, CircularNode, configureModelElement, SGraph, SEdge, selectFeature, PolylineEdgeView, MouseListener, SModelElement
} from 'sprotty';
import { Action, Point } from "sprotty-protocol";
import { CircleNodeView } from "./views";

const NodeCreator = Symbol('NodeCreator');

export default (nodeCreator: (point?: Point)=>void) => {
    require("sprotty/css/sprotty.css");
    require("../css/diagram.css");

    const circlegraphModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        bind(NodeCreator).toConstantValue(nodeCreator);
        bind(DroppableMouseListener).toSelf().inSingletonScope();
        bind(TYPES.MouseListener).toService(DroppableMouseListener);
        const context = { bind, unbind, isBound, rebind };
        configureModelElement(context, 'graph', SGraph, SGraphView);
        configureModelElement(context, 'node:circle', CircularNode, CircleNodeView);
        configureModelElement(context, 'edge:straight', SEdge, PolylineEdgeView, {
            disable: [selectFeature]
        });
        configureViewerOptions(context, {
            needsClientLayout: false
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(circlegraphModule);
    return container;
};

@injectable()
class DroppableMouseListener extends MouseListener {

    @inject(NodeCreator) nodeCreator: (point?: Point)=>void;

    override dragOver(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        event.preventDefault();
        return [];
    }

    override drop(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.nodeCreator({ x: event.offsetX, y:event.offsetY })
        return [];
    }
}

