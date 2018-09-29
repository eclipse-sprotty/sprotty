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

import "reflect-metadata";
import "mocha";
import { expect } from "chai";
import { Bounds, EMPTY_BOUNDS } from '../../utils/geometry';
import { SModelRoot } from "../model/smodel";
import { CommandExecutionContext } from '../commands/command';
import { InitializeCanvasBoundsAction, InitializeCanvasBoundsCommand } from './initialize-canvas';

describe('InitializeCanvasBoundsCommand', () => {

    const bounds: Bounds = {
        x: 10,
        y: 20,
        width: 10,
        height: 10
    };

    const root = new SModelRoot();
    const command = new InitializeCanvasBoundsCommand(new InitializeCanvasBoundsAction(bounds));

    const context: CommandExecutionContext = {
        root: root,
        logger: undefined!,
        modelFactory: undefined!,
        modelChanged: undefined!,
        duration: 100,
        syncer: undefined!
    };

    it('execute() works as expected', () => {
        // sanity check for initial bounds values
        expect(EMPTY_BOUNDS).deep.equals(root.canvasBounds);
        command.execute(context);
        expect(bounds).deep.equals(root.canvasBounds);
    });

    it('undo() works as expected', () => {
        command.undo(context);
        expect(bounds).deep.equals(root.canvasBounds);
    });

    it('redo() works as expected', () => {
        command.redo(context);
        expect(bounds).deep.equals(root.canvasBounds);
    });
});
