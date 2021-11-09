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

import { Direction, LocalModelSource, TYPES, IActionDispatcher } from 'sprotty';
import { SLabel, UpdateModelAction } from 'sprotty-protocol';
import {
    ChannelSchema, CoreSchema, CrossbarSchema, ProcessorSchema
} from './chipmodel';
import createContainer from "./di.config";

export default function runMulticore() {
    const container = createContainer();

    // Initialize model
    const dim = 32;
    const cores: CoreSchema[] = [];
    const channels: ChannelSchema[] = [];
    for (let i = 0; i < dim; ++i) {
        for (let j = 0; j < dim; ++j) {
            const pos = i + '_' + j;
            cores.push({
                id: 'core_' + pos,
                type: 'simplecore',
                column: i,
                row: j,
                kernelNr: Math.round(Math.random() * 11),
                layout: 'vbox',
                resizeContainer: false,
                children: [{
                    id: 'nr_' + pos,
                    type: 'label:heading',
                    text: '' + pos
                } as SLabel]
            });
            channels.push(createChannel(i, j, Direction.up));
            channels.push(createChannel(i, j, Direction.down));
            channels.push(createChannel(i, j, Direction.left));
            channels.push(createChannel(i, j, Direction.right));
        }
        channels.push(createChannel(dim, i, Direction.up));
        channels.push(createChannel(dim, i, Direction.down));
        channels.push(createChannel(i, dim, Direction.left));
        channels.push(createChannel(i, dim, Direction.right));
    }

    function createChannel(row: number, column: number, direction: Direction): ChannelSchema {
        const pos = row + '_' + column;
        return {
            id: 'channel_' + direction + '_' + pos,
            type: 'channel',
            column: column,
            row: row,
            direction: direction,
            load: Math.random(),
        };
    }

    const crossbars = [{
        id: 'cb_up',
        type: 'crossbar',
        load: Math.random(),
        direction: Direction.up
    }, {
        id: 'cb_down',
        type: 'crossbar',
        load: Math.random(),
        direction: Direction.down
    }, {
        id: 'cb_left',
        type: 'crossbar',
        load: Math.random(),
        direction: Direction.left
    }, {
        id: 'cb_right',
        type: 'crossbar',
        load: Math.random(),
        direction: Direction.right
    }];

    let children: (CrossbarSchema | ChannelSchema | CoreSchema)[] = [];
    children = children.concat(channels);
    children = children.concat(crossbars);
    children = children.concat(cores);

    const processor: ProcessorSchema = {
        id: 'processor',
        type: 'processor',
        rows: dim,
        columns: dim,
        children: children
    };

    // Run
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    modelSource.setModel(processor);

    const actionDispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    function changeModel() {
        for (let i = 0; i < processor.children!.length; ++i) {
            const child = processor.children![i];
            if (child.type === 'simplecore' && Math.random() > 0.7) {
                (child as CoreSchema).kernelNr = Math.round(Math.random() * 11);
            }
        }
        // modelSource.update() would trigger hidden bounds computation, which is not necessary here
        actionDispatcher.dispatch(UpdateModelAction.create(processor));
    }

    setInterval(() => changeModel(), 300);
}
