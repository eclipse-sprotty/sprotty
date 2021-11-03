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
import { expect } from "chai";
import { Container } from 'inversify';
import { TYPES } from '../../base/types';
import { ConsoleLogger } from "../../utils/logging";
import { CommandExecutionContext } from "../../base/commands/command";
import { SGraphFactory } from "../../graph/sgraph-factory";
import { SNode, SNodeSchema, SGraph } from "../../graph/sgraph";
import { ExportSvgCommand, RequestExportSvgAction } from './export';
import defaultModule from "../../base/di.config";

describe('ExportSvgCommand', () => {
    const container = new Container();
    container.load(defaultModule);
    container.rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope();

    const graphFactory = container.get<SGraphFactory>(TYPES.IModelFactory);

    const myNodeSchema: SNodeSchema = {
        id: 'node', type: 'node:circle',
        position: {x: 100, y: 200},
        size: {width: 10, height: 20}
    };

    const model = graphFactory.createRoot({
        id: 'model',
        type: 'graph',
        children: [myNodeSchema]
    }) as SGraph;

    const myNode = model.children[0] as SNode;

    const cmd = new ExportSvgCommand(new RequestExportSvgAction());

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
        expect(newModel.children[0]).instanceof(SNode);
        expect((newModel.children[0] as SNode).selected).to.equal(false);
    });

    it('execute() removes hover feedback', () => {
        myNode.hoverFeedback = true;
        const newModel = cmd.execute(context).model;
        expect(newModel.children[0]).instanceof(SNode);
        expect((newModel.children[0] as SNode).hoverFeedback).to.equal(false);
    });

    it('execute() resets viewport', () => {
        model.zoom = 17;
        model.scroll = { x: 12, y: 12};
        const newModel = cmd.execute(context).model;
        expect(newModel).instanceof(SGraph);
        expect((newModel as SGraph).zoom).to.equal(1);
        expect((newModel as SGraph).scroll.x).to.equal(0);
        expect((newModel as SGraph).scroll.y).to.equal(0);
    });
});
