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

import { CenterAction, SelectAction } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { LabeledAction } from '../../base/actions/action.js';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { SNodeImpl } from '../../graph/sgraph.js';
import { NullLogger } from '../../utils/logging.js';
import { Nameable, nameFeature } from '../nameable/model.js';
import { CommandPaletteActionProviderRegistry, RevealNamedElementActionProvider } from './action-providers.js';

class NamedNode extends SNodeImpl implements Nameable {
    name: string;

    override hasFeature(feature: symbol): boolean {
        return feature === nameFeature;
    }
}

function createModel(): SModelRootImpl {
    const root = new SModelRootImpl();
    for (const [id, name] of [['a', 'Alpha'], ['b', 'Beta']]) {
        const node = new NamedNode();
        node.id = id;
        node.name = name;
        root.add(node);
    }
    const unnamed = new SNodeImpl();
    unnamed.id = 'c';
    root.add(unnamed);
    return root;
}

describe('CommandPaletteActionProviderRegistry', () => {
    const root = new SModelRootImpl();

    it('returns no actions without providers', async () => {
        expect(await new CommandPaletteActionProviderRegistry().getActions(root, '')).toEqual([]);
        expect(await new CommandPaletteActionProviderRegistry([]).getActions(root, '')).toEqual([]);
    });

    it('concatenates the actions of all providers in registration order', async () => {
        const registry = new CommandPaletteActionProviderRegistry([
            { getActions: () => Promise.resolve([new LabeledAction('one', [])]) },
            { getActions: () => Promise.resolve([new LabeledAction('two', []), new LabeledAction('three', [])]) }
        ]);
        const actions = await registry.getActions(root, '');
        expect(actions.map(action => action.label)).toEqual(['one', 'two', 'three']);
    });
});

describe('RevealNamedElementActionProvider', () => {
    const provider = new RevealNamedElementActionProvider(new NullLogger());
    const root = createModel();

    it('offers a reveal action per nameable element on even palette pages', async () => {
        const actions = await provider.getActions(root, '', undefined, 0);
        expect(actions.map(action => action.label)).toEqual(['Reveal Alpha', 'Reveal Beta']);
        expect(actions[0].icon).toBe('eye');
        expect(actions[0].actions).toEqual([SelectAction.create({ selectedElementsIDs: ['a'] }), CenterAction.create(['a'])]);
    });

    it('offers "Select all" on odd pages and when no page index is given', async () => {
        expect((await provider.getActions(root, '', undefined, 1)).map(action => action.label)).toEqual(['Select all']);
        expect((await provider.getActions(root, '')).map(action => action.label)).toEqual(['Select all']);
    });
});
