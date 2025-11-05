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

import { Container, ContainerModule } from 'inversify';
import {
    TYPES,
    configureModelElement,
    configureViewerOptions,
    loadDefaultModules,
    LocalModelSource,
    LogLevel,
    SEdgeImpl,
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    SNodeImpl,
    SPortImpl,
    SRoutingHandleImpl,
    SRoutingHandleView,
    JumpingPolylineEdgeView,
    PolylineEdgeViewWithGapsOnIntersections
} from 'sprotty';
import { IntersectionFinder } from 'sprotty/lib/features/edge-intersection/intersection-finder';
import {
    CustomEdgeView,
    BezierCustomEdgeView,
    CustomRectangleNodeView,
    CustomCircleNodeView,
    HexagonNodeView,
    DiamondNodeView,
    PortView,
    NodeLabelView
} from './views';
// import { ArcEdgeRouter, StepEdgeRouter } from './custom-routers';
import { HexagonAnchor, DynamicAnchor } from './custom-anchors';

/**
 * Dependency injection configuration for the advanced edges showcase
 */
const advancedEdgesModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Configure log level (logger is provided by loadDefaultModules)
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);

    // Bind model source
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();

    // Configure viewer options
    configureViewerOptions(context, {
        needsClientLayout: false,
        needsServerLayout: false,
        baseDiv: 'sprotty-diagram',
        hiddenDiv: 'sprotty-hidden'
    });

    // Register custom routers (disabled for now - anchor registry integration needed)
    // TODO: Register anchor computers for custom routers with all anchor kinds
    // bind(ArcEdgeRouter).toSelf().inSingletonScope();
    // bind(TYPES.IEdgeRouter).toService(ArcEdgeRouter);

    // bind(StepEdgeRouter).toSelf().inSingletonScope();
    // bind(TYPES.IEdgeRouter).toService(StepEdgeRouter);

    // Register custom anchors
    bind(HexagonAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(HexagonAnchor);

    bind(DynamicAnchor).toSelf().inSingletonScope();
    bind(TYPES.IAnchorComputer).toService(DynamicAnchor);

    // Register intersection finder for jumps/gaps
    bind(IntersectionFinder).toSelf().inSingletonScope();
    bind(TYPES.IEdgeRoutePostprocessor).toService(IntersectionFinder);

    // Configure model elements with views
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);

    // Node types
    configureModelElement(context, 'node:rectangle', SNodeImpl, CustomRectangleNodeView);
    configureModelElement(context, 'node:circle', SNodeImpl, CustomCircleNodeView);
    configureModelElement(context, 'node:hexagon', SNodeImpl, HexagonNodeView);
    configureModelElement(context, 'node:diamond', SNodeImpl, DiamondNodeView);

    // Edge types
    // Polyline and Manhattan edges use CustomEdgeView
    configureModelElement(context, 'edge:polyline', SEdgeImpl, CustomEdgeView);
    configureModelElement(context, 'edge:manhattan', SEdgeImpl, CustomEdgeView);

    // Bezier edges use BezierCustomEdgeView
    configureModelElement(context, 'edge:bezier', SEdgeImpl, BezierCustomEdgeView);

    // Intersection handling edges
    configureModelElement(context, 'edge:jumping', SEdgeImpl, JumpingPolylineEdgeView);
    configureModelElement(context, 'edge:gaps', SEdgeImpl, PolylineEdgeViewWithGapsOnIntersections);

    // Labels
    configureModelElement(context, 'label:node', SLabelImpl, NodeLabelView);

    // Ports
    configureModelElement(context, 'port', SPortImpl, PortView);

    // Routing handles
    configureModelElement(context, 'routing-handle', SRoutingHandleImpl, SRoutingHandleView);
    configureModelElement(context, 'volatile-routing-handle', SRoutingHandleImpl, SRoutingHandleView);
});

/**
 * Create and configure the dependency injection container
 */
export function createContainer(): Container {
    const container = new Container();

    // Load default Sprotty modules (includes routing)
    loadDefaultModules(container);

    // Load our custom module
    container.load(advancedEdgesModule);

    return container;
}

