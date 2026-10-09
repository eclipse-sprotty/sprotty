/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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
import { CommandExecutionContext } from '../../base/commands/command.js';
import { SModelRootImpl } from '../../base/model/smodel.js';
import { SNodeImpl } from '../../graph/sgraph.js';
import { FadeAnimation } from './fade.js';

describe('FadeAnimation', () => {
    it('removes a faded-out element only once', () => {
        const root = new SModelRootImpl();
        const element = new SNodeImpl();
        root.add(element);
        const context = {} as CommandExecutionContext;
        const animation = new FadeAnimation(root, [{ element, type: 'out' }], context, true);

        animation.tween(1, context);
        expect(root.children).not.toContain(element);
        expect(() => animation.tween(1, context)).not.toThrow();
    });
});
