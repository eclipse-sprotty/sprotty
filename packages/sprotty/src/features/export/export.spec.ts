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
import { CommandExecutionContext } from '../../base/commands/command';
import { SNodeImpl, SGraphImpl } from '../../graph/sgraph';
import { ExportSvgCommand, RequestExportSvgAction } from './export';
import defaultModule from '../../base/di.config';
import { SNode } from 'sprotty-protocol';
import { IModelFactory } from '../../base/model/smodel-factory';
import { registerModelElement } from '../../base/model/smodel-utils';

describe('ExportSvgCommand', () => {
    const container = new Container();
    container.load(defaultModule);

    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'node:circle', SNodeImpl);

    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);

    const myNodeSchema: SNode = {
        id: 'node', type: 'node:circle',
        position: {x: 100, y: 200},
        size: {width: 10, height: 20}
    };

    const model = graphFactory.createRoot({
        id: 'model',
        type: 'graph',
        children: [myNodeSchema]
    }) as SGraphImpl;

    const myNode = model.children[0] as SNodeImpl;

    const cmd = new ExportSvgCommand(RequestExportSvgAction.create());

    const context: CommandExecutionContext = {
        root: model,
        modelFactory: graphFactory,
        duration: 0,
        modelChanged: undefined!,
        logger: new ConsoleLogger(),
        syncer: undefined!
    };

    it('execute() clears selection', () => {
        myNode.selected = true;
        const newModel = cmd.execute(context).model;
        expect(newModel.children[0]).instanceof(SNodeImpl);
        expect((newModel.children[0] as SNodeImpl).selected).to.equal(false);
    });

    it('execute() removes hover feedback', () => {
        myNode.hoverFeedback = true;
        const newModel = cmd.execute(context).model;
        expect(newModel.children[0]).instanceof(SNodeImpl);
        expect((newModel.children[0] as SNodeImpl).hoverFeedback).to.equal(false);
    });

    it('execute() resets viewport', () => {
        model.zoom = 17;
        model.scroll = { x: 12, y: 12};
        const newModel = cmd.execute(context).model;
        expect(newModel).instanceof(SGraphImpl);
        expect((newModel as SGraphImpl).zoom).to.equal(1);
        expect((newModel as SGraphImpl).scroll.x).to.equal(0);
        expect((newModel as SGraphImpl).scroll.y).to.equal(0);
    });
});
