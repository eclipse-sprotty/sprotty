/********************************************************************************
 * Copyright (c) 2017-2026 TypeFox and others.
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

import { ContainerModule, injectable, inject } from 'inversify';
import {
    TYPES, LogLevel, CircularNode, SEdgeImpl, selectFeature, PolylineEdgeView, MouseListener,
    SModelElementImpl, createSprottyDiagram
} from 'sprotty';
import { Action, Point } from 'sprotty-protocol';
import { CircleNodeView } from './views.js';

const NodeCreator = Symbol('NodeCreator');

export default (nodeCreator: (point?: Point) => void) => {
    require('sprotty/css/sprotty.css');
    require('../css/diagram.css');

    // The drop listener is not an element registration, so it still comes in a module
    const circlegraphModule = new ContainerModule((bind) => {
        bind(NodeCreator).toConstantValue(nodeCreator);
        bind(DroppableMouseListener).toSelf().inSingletonScope();
        bind(TYPES.MouseListener).toService(DroppableMouseListener);
    });

    return createSprottyDiagram({
        viewerOptions: {
            needsClientLayout: false
        },
        logLevel: LogLevel.log,
        modules: [circlegraphModule],
        elements: {
            'node:circle': [CircularNode, CircleNodeView],
            'edge:straight': [SEdgeImpl, PolylineEdgeView, { disable: [selectFeature] }]
        }
    });
};

@injectable()
class DroppableMouseListener extends MouseListener {

    @inject(NodeCreator) nodeCreator: (point?: Point) => void;

    override dragOver(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        event.preventDefault();
        return [];
    }

    override drop(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.nodeCreator({ x: event.offsetX, y:event.offsetY });
        return [];
    }
}
