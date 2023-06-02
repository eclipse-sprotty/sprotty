/********************************************************************************
 * Copyright (c) 2017-2023 TypeFox and others.
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
import ElkConstructor from 'elkjs/lib/elk.bundled';
import { LayoutOptions } from 'elkjs/lib/elk-api';
import {
    TYPES, configureViewerOptions, SGraphView, SLabelView, ConsoleLogger, LogLevel,
    loadDefaultModules, LocalModelSource, SNodeImpl, SEdgeImpl, SLabelImpl, configureModelElement,
    SGraphImpl, RectangularNodeView, edgeIntersectionModule, PolylineEdgeViewWithGapsOnIntersections,
    SPortImpl
} from 'sprotty';
import {
    DefaultLayoutConfigurator, ElkFactory, ElkLayoutEngine, ILayoutConfigurator, elkLayoutModule
} from 'sprotty-elk/lib/inversify';
import { SGraph, SModelIndex, SNode, SPort } from 'sprotty-protocol';
import { PortViewWithExternalLabel } from './views';

export default (containerId: string) => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    const elkFactory: ElkFactory = () => new ElkConstructor({
        algorithms: ['layered']
    });

    const randomGraphModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        bind(TYPES.IModelLayoutEngine).toService(ElkLayoutEngine);
        bind(ElkFactory).toConstantValue(elkFactory);
        rebind(ILayoutConfigurator).to(RandomGraphLayoutConfigurator);
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };
        configureModelElement(container, 'graph', SGraphImpl, SGraphView);
        configureModelElement(container, 'node', SNodeImpl, RectangularNodeView);
        configureModelElement(container, 'port', SPortImpl, PortViewWithExternalLabel);
        configureModelElement(container, 'edge', SEdgeImpl, PolylineEdgeViewWithGapsOnIntersections);
        configureModelElement(container, 'label:node', SLabelImpl, SLabelView);
        configureModelElement(container, 'label:port', SLabelImpl, SLabelView);

        configureViewerOptions(context, {
            needsClientLayout: true,
            baseDiv: containerId
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(edgeIntersectionModule);
    container.load(elkLayoutModule, randomGraphModule);
    return container;
};

export class RandomGraphLayoutConfigurator extends DefaultLayoutConfigurator {

    protected override graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions | undefined {
        return {
            'org.eclipse.elk.algorithm': 'org.eclipse.elk.layered'
        };
    }

    protected override nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        return {
            'org.eclipse.elk.nodeSize.constraints': 'PORTS PORT_LABELS NODE_LABELS MINIMUM_SIZE',
            'org.eclipse.elk.nodeSize.minimum': '(40, 40)',
            'org.eclipse.elk.portConstraints': 'FREE',
            'org.eclipse.elk.nodeLabels.placement': 'INSIDE H_CENTER V_TOP',
            'org.eclipse.elk.portLabels.placement': 'OUTSIDE'
        };
    }

    protected override portOptions(sport: SPort, index: SModelIndex): LayoutOptions | undefined {
        return {
            'org.eclipse.elk.port.borderOffset': '1'
        };
    }

}
