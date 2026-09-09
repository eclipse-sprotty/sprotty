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

import { describe, expect, it } from 'vitest';
import { LabeledAction } from '../../base/actions/action.js';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { SetUIExtensionVisibilityAction } from '../../base/ui-extensions/ui-extension-registry.js';
import { SNodeImpl } from '../../graph/sgraph.js';
import { selectFeature } from '../select/model.js';
import { CommandPalette, CommandPaletteKeyListener } from './command-palette.js';

function keyEvent(code: string, modifiers: { ctrl?: boolean, shift?: boolean } = {}): KeyboardEvent {
    return { code, ctrlKey: modifiers.ctrl ?? false, metaKey: false, altKey: false, shiftKey: modifiers.shift ?? false } as KeyboardEvent;
}

class SelectableNode extends SNodeImpl {
    override hasFeature(feature: symbol): boolean {
        return feature === selectFeature;
    }
}

describe('CommandPaletteKeyListener', () => {
    const root = new SModelRootImpl();
    for (const [id, selected] of [['a', true], ['b', false], ['c', true]] as const) {
        const node = new SelectableNode();
        node.id = id;
        node.selected = selected;
        root.add(node);
    }
    const listener = new CommandPaletteKeyListener();

    it('opens the palette for the selected elements on Ctrl+Space', () => {
        expect(listener.keyDown(root, keyEvent('Space', { ctrl: true }))).toEqual([
            SetUIExtensionVisibilityAction.create({ extensionId: CommandPalette.ID, visible: true, contextElementsId: ['a', 'c'] })
        ]);
    });

    it('closes the palette on Escape', () => {
        expect(listener.keyDown(root, keyEvent('Escape'))).toEqual([
            SetUIExtensionVisibilityAction.create({ extensionId: CommandPalette.ID, visible: false, contextElementsId: [] })
        ]);
    });

    it('ignores other keys', () => {
        expect(listener.keyDown(root, keyEvent('Space'))).toEqual([]);
        expect(listener.keyDown(root, keyEvent('KeyP', { ctrl: true, shift: true }))).toEqual([]);
    });
});

describe('CommandPalette', () => {
    // inject-from-base: exempt — constructed with `new`, never resolved by a container
    class TestCommandPalette extends CommandPalette {
        filter(text: string, candidates: LabeledAction[]): LabeledAction[] {
            return this.filterActions(text, candidates);
        }
    }
    const actions = [new LabeledAction('Reveal Alpha', []), new LabeledAction('Reveal Beta', []), new LabeledAction('Select all', [])];

    it('keeps the actions whose label contains every search word, ignoring case', () => {
        const palette = new TestCommandPalette();
        expect(palette.filter('', actions)).toHaveLength(3);
        expect(palette.filter('reveal', actions).map(action => action.label)).toEqual(['Reveal Alpha', 'Reveal Beta']);
        expect(palette.filter('PH reveal', actions).map(action => action.label)).toEqual(['Reveal Alpha']);
        expect(palette.filter('gamma', actions)).toEqual([]);
    });
});
