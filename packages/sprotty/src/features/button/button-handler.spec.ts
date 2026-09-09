/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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

import { Container, ContainerModule, injectable } from 'inversify';
import { Action } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import expandModule from '../expand/di.config.js';
import { ExpandButtonHandler } from '../expand/expand.js';
import { ButtonHandlerRegistry, configureButtonHandler, IButtonHandler } from './button-handler.js';
import buttonModule from './di.config.js';
import { SButtonImpl } from './model.js';

describe('ButtonHandlerRegistry', () => {
    @injectable()
    class TestButtonHandler implements IButtonHandler {
        buttonPressed(button: SButtonImpl): Action[] {
            return [{ kind: 'pressed:' + button.id }];
        }
    }

    it('is empty when no button handler is configured', () => {
        const container = new Container();
        container.load(buttonModule);
        expect(container.get(ButtonHandlerRegistry).hasKey(ExpandButtonHandler.TYPE)).toBe(false);
    });

    it('resolves handlers configured with configureButtonHandler by their button type', () => {
        const container = new Container();
        container.load(buttonModule, expandModule, new ContainerModule(({ bind, isBound }) => {
            configureButtonHandler({ bind, isBound }, 'button:test', TestButtonHandler);
        }));
        const registry = container.get(ButtonHandlerRegistry);
        expect(registry.get(ExpandButtonHandler.TYPE)).toBeInstanceOf(ExpandButtonHandler);

        const button = new SButtonImpl();
        button.id = 'button1';
        expect(registry.get('button:test').buttonPressed(button)).toEqual([{ kind: 'pressed:button1' }]);
        expect(() => registry.get('button:unknown')).toThrow(/Unknown registry key/);
    });
});
