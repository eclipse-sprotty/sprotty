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

import { describe, expect, it } from 'vitest';
import { boundsFeature } from '../features/bounds/model.js';
import { SModelElementImpl } from './model/smodel.js';
import { TYPES } from './types.js';

/**
 * Regression tests for #559: DI service identifiers and feature symbols must be created with
 * `Symbol.for`, so that duplicate copies of the module (within the same realm) resolve to the
 * identical symbol. A plain `Symbol()` would not be registered and `Symbol.keyFor` returns
 * `undefined` for it.
 */
describe('Symbol.for-based identities (#559)', () => {
    it('registers TYPES service identifiers in the global symbol registry', () => {
        expect(Symbol.keyFor(TYPES.Action)).toBe('Action');
        expect(Symbol.keyFor(TYPES.MouseListener)).toBe('MouseListener');
        expect(TYPES.MouseListener).toBe(Symbol.for('MouseListener'));
    });

    it('preserves the historical keys of the context-menu identifiers', () => {
        expect(Symbol.keyFor(TYPES.IContextMenuItemProvider)).toBe('IContextMenuProvider');
        expect(Symbol.keyFor(TYPES.IContextMenuServiceProvider)).toBe('IContextMenuServiceProvider');
    });

    it('registers feature symbols so a re-derived lookup matches hasFeature', () => {
        expect(Symbol.keyFor(boundsFeature)).toBe('boundsFeature');

        const element = new SModelElementImpl();
        element.features = new Set([boundsFeature]);

        expect(element.hasFeature(Symbol.for('boundsFeature'))).toBe(true);
    });
});
