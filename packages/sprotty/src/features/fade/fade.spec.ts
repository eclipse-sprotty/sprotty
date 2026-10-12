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

import { h } from 'snabbdom';
import { describe, expect, it } from 'vitest';
import { AnimationFrameSyncer } from '../../base/animations/animation-frame-syncer.js';
import { CommandExecutionContext } from '../../base/commands/command.js';
import { SModelElementImpl, SModelRootImpl } from '../../base/model/smodel.js';
import { SNodeImpl } from '../../graph/sgraph.js';
import { ConsoleLogger } from '../../utils/logging.js';
import { ElementFader, FadeAnimation } from './fade.js';
import { fadeFeature } from './model.js';

class FadeableNode extends SNodeImpl {
    override hasFeature(feature: symbol): boolean {
        return feature === fadeFeature;
    }
}

describe('ElementFader', () => {
    const fader = new ElementFader();

    function opacityAttributeOf(element: SModelElementImpl): unknown {
        const vnode = h('g');
        fader.decorate(vnode, element);
        return vnode.data?.attrs?.opacity;
    }

    it('sets the opacity attribute of faded elements', () => {
        const node = new FadeableNode();
        node.opacity = 0.5;
        expect(opacityAttributeOf(node)).toBe(0.5);
    });

    it('leaves fully opaque and non-fadeable elements alone', () => {
        const node = new FadeableNode();
        node.opacity = 1;
        expect(opacityAttributeOf(node)).toBeUndefined();
        expect(opacityAttributeOf(new SModelElementImpl())).toBeUndefined();
    });
});

describe('FadeAnimation', () => {
    function createModel() {
        const root = new SModelRootImpl();
        const fadingIn = new FadeableNode();
        fadingIn.id = 'in';
        root.add(fadingIn);
        const fadingOut = new FadeableNode();
        fadingOut.id = 'out';
        root.add(fadingOut);
        const context: CommandExecutionContext = {
            root, modelFactory: undefined!, duration: 0, modelChanged: undefined!, logger: new ConsoleLogger(), syncer: new AnimationFrameSyncer()
        };
        return { root, fadingIn, fadingOut, context };
    }

    it('interpolates the opacity of fading elements', () => {
        const { root, fadingIn, fadingOut, context } = createModel();
        const animation = new FadeAnimation(root, [{ element: fadingIn, type: 'in' }, { element: fadingOut, type: 'out' }], context);
        expect(animation.tween(0.25, context)).toBe(root);
        expect(fadingIn.opacity).toBe(0.25);
        expect(fadingOut.opacity).toBe(0.75);
        animation.tween(1, context);
        expect(fadingIn.opacity).toBe(1);
        expect(fadingOut.opacity).toBe(0);
        expect(root.children).toHaveLength(2);
    });

    it('removes faded-out elements at the end when requested', () => {
        const { root, fadingOut, context } = createModel();
        const animation = new FadeAnimation(root, [{ element: fadingOut, type: 'out' }], context, true);
        animation.tween(0.5, context);
        expect(root.children.map(child => child.id)).toEqual(['in', 'out']);
        animation.tween(1, context);
        expect(root.children.map(child => child.id)).toEqual(['in']);
        expect(root.index.getById('out')).toBeUndefined();
    });
});
