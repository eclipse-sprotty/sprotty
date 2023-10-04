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

import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { Container } from 'inversify';
import { TYPES } from '../../base/types';
import { ConsoleLogger } from '../../utils/logging';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer';
import { CommandExecutionContext } from '../../base/commands/command';
import { SetViewportCommand } from './viewport';
import { ViewportRootElementImpl } from './viewport-root';
import defaultModule from '../../base/di.config';
import { SetViewportAction, Viewport, almostEquals } from 'sprotty-protocol';
import { IModelFactory } from '../../base/model/smodel-factory';
import { registerModelElement } from '../../base/model/smodel-utils';
import { SGraphImpl, SNodeImpl } from '../../graph/sgraph';

describe('BoundsAwareViewportCommand', () => {
    const container = new Container();
    container.load(defaultModule);

    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node', SNodeImpl);

    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);

    const viewportData: Viewport = { scroll: { x: 0, y: 0 }, zoom: 1 };
    const viewport: ViewportRootElementImpl = graphFactory.createRoot({ id: 'viewport1', type: 'graph', children: [] }) as ViewportRootElementImpl;
    viewport.zoom = viewportData.zoom;
    viewport.scroll = viewportData.scroll;

    const newViewportData: Viewport = { scroll: { x: 100, y: 100 }, zoom: 10 };

    const viewportAction = SetViewportAction.create(viewport.id, newViewportData, { animate: false });
    const cmd = new SetViewportCommand(viewportAction);
    (cmd as any).viewerOptions = container.get(TYPES.ViewerOptions);

    const context: CommandExecutionContext = {
        root: viewport,
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: new AnimationFrameSyncer()
    };

    it('execute() works as expected', () => {
        cmd.execute(context);
        expect(almostEquals(viewport.zoom, newViewportData.zoom)).to.be.true;
        expect(viewport.scroll).deep.equals(newViewportData.scroll);
    });

    it('undo() works as expected', () => {
        cmd.undo(context);
        expect(almostEquals(viewport.zoom, viewportData.zoom)).to.be.true;
        expect(viewport.scroll).deep.equals(viewportData.scroll);
    });

    it('redo() works as expected', () => {
        cmd.redo(context);
        expect(almostEquals(viewport.zoom, newViewportData.zoom)).to.be.true;
        expect(viewport.scroll).deep.equals(newViewportData.scroll);
    });

});
