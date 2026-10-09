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

import { Container } from 'inversify';
import { h } from 'snabbdom';
import { Action } from 'sprotty-protocol';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IActionDispatcher } from '../actions/action-dispatcher.js';
import defaultModule from '../di.config.js';
import { SChildElementImpl, SModelElementImpl, SModelRootImpl } from '../model/smodel.js';
import { TYPES } from '../types.js';
import { PointerListener, PointerTool } from './pointer-tool.js';

class RecordingListener extends PointerListener {
    targets: string[] = [];

    override pointerDown(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        this.targets.push(target.id);
        return [{ kind: 'down:' + target.id }, Promise.resolve({ kind: 'later:' + target.id })];
    }
}

describe('PointerTool', () => {
    const dispatched: Action[] = [];
    const container = new Container();
    container.load(defaultModule);
    container.rebind(TYPES.IActionDispatcher).toConstantValue({
        dispatch: (action: Action) => { dispatched.push(action); return Promise.resolve(); }
    } as unknown as IActionDispatcher);
    const tool = container.get(PointerTool);

    const root = new SModelRootImpl();
    root.id = 'root';
    const node = new SChildElementImpl();
    node.id = 'node';
    root.add(node);

    /** The rendered diagram: element ids carry the base div prefix, the inner rect has no model counterpart. */
    function mount(): { svg: Element, inner: Element, outside: Element } {
        document.body.innerHTML = '<div id="sprotty"><svg id="sprotty_root"><g id="sprotty_node"><rect id="inner"></rect></g></svg></div>';
        return { svg: document.getElementById('sprotty_root')!, inner: document.getElementById('inner')!, outside: document.getElementById('sprotty')! };
    }

    function pointerDown(target: Element): PointerEvent {
        const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event;
    }

    beforeEach(() => {
        dispatched.length = 0;
    });

    it('registers handlers for all pointer events on the root element only', () => {
        const rootNode = h('svg');
        tool.decorate(rootNode, root);
        expect(Object.keys(rootNode.data!.on!).sort()).toEqual([
            'gotpointercapture', 'lostpointercapture', 'pointercancel', 'pointerdown', 'pointerenter',
            'pointerleave', 'pointermove', 'pointerout', 'pointerover', 'pointerup'
        ]);
        const childNode = h('g');
        tool.decorate(childNode, node);
        expect(childNode.data?.on).toBeUndefined();
    });

    it('resolves the model element from the closest DOM ancestor with a model id and dispatches the listener actions', async () => {
        const { svg, inner } = mount();
        const listener = new RecordingListener();
        tool.register(listener);
        const vnode = h('svg');
        tool.decorate(vnode, root);
        svg.addEventListener('pointerdown', vnode.data!.on!.pointerdown as EventListener);

        const event = pointerDown(inner);
        expect(listener.targets).toEqual(['node']);
        expect(event.defaultPrevented).toBe(true);
        await vi.waitFor(() => expect(dispatched).toHaveLength(2));
        expect(dispatched).toEqual([{ kind: 'down:node' }, { kind: 'later:node' }]);

        tool.deregister(listener);
        pointerDown(inner);
        expect(listener.targets).toEqual(['node']);
    });

    it('ignores events outside the model and does not prevent the default without actions', () => {
        const { svg, inner, outside } = mount();
        const listener = new RecordingListener();
        tool.register(listener);
        const vnode = h('svg');
        tool.decorate(vnode, root);
        outside.addEventListener('pointerdown', vnode.data!.on!.pointerdown as EventListener);
        expect(pointerDown(outside).defaultPrevented).toBe(false);
        expect(listener.targets).toEqual([]);
        tool.deregister(listener);

        tool.register(new PointerListener());
        svg.addEventListener('pointerdown', vnode.data!.on!.pointerdown as EventListener);
        expect(pointerDown(inner).defaultPrevented).toBe(false);
        expect(dispatched).toEqual([]);
    });
});
