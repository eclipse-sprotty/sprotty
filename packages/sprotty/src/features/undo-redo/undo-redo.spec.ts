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

/**
 * @vitest-environment happy-dom
 */

import { RedoAction, UndoAction } from 'sprotty-protocol';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { UndoRedoKeyListener } from './undo-redo.js';

function keyEvent(code: string, modifiers: { ctrl?: boolean, meta?: boolean, shift?: boolean } = {}): KeyboardEvent {
    return {
        code,
        ctrlKey: modifiers.ctrl ?? false,
        metaKey: modifiers.meta ?? false,
        shiftKey: modifiers.shift ?? false,
        altKey: false
    } as KeyboardEvent;
}

describe('UndoRedoKeyListener', () => {
    const listener = new UndoRedoKeyListener();
    const root = new SModelRootImpl();

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('on Windows and Linux', () => {
        beforeEach(() => {
            vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (X11; Linux x86_64)');
        });

        it('undoes on Ctrl+Z', () => {
            expect(listener.keyDown(root, keyEvent('KeyZ', { ctrl: true }))).toEqual([UndoAction.create()]);
        });

        it('redoes on Ctrl+Shift+Z and on Ctrl+Y', () => {
            expect(listener.keyDown(root, keyEvent('KeyZ', { ctrl: true, shift: true }))).toEqual([RedoAction.create()]);
            expect(listener.keyDown(root, keyEvent('KeyY', { ctrl: true }))).toEqual([RedoAction.create()]);
        });

        it('ignores the Meta key and unmodified keys', () => {
            expect(listener.keyDown(root, keyEvent('KeyZ', { meta: true }))).toEqual([]);
            expect(listener.keyDown(root, keyEvent('KeyZ'))).toEqual([]);
        });
    });

    describe('on macOS', () => {
        beforeEach(() => {
            vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
        });

        it('undoes on Cmd+Z and redoes on Cmd+Shift+Z', () => {
            expect(listener.keyDown(root, keyEvent('KeyZ', { meta: true }))).toEqual([UndoAction.create()]);
            expect(listener.keyDown(root, keyEvent('KeyZ', { meta: true, shift: true }))).toEqual([RedoAction.create()]);
        });

        it('does not bind Y or the Ctrl key', () => {
            expect(listener.keyDown(root, keyEvent('KeyY', { meta: true }))).toEqual([]);
            expect(listener.keyDown(root, keyEvent('KeyY', { ctrl: true }))).toEqual([]);
            expect(listener.keyDown(root, keyEvent('KeyZ', { ctrl: true }))).toEqual([]);
        });
    });
});
