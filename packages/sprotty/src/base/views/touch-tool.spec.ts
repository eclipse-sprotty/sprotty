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
import { beforeEach, describe, expect, it } from 'vitest';
import { IActionDispatcher } from '../actions/action-dispatcher.js';
import defaultModule from '../di.config.js';
import { SChildElementImpl, SModelElementImpl, SModelRootImpl } from '../model/smodel.js';
import { TYPES } from '../types.js';
import { TouchListener, TouchTool } from './touch-tool.js';

class RecordingListener extends TouchListener {
    targets: string[] = [];

    override touchStart(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[] {
        this.targets.push(target.id);
        return [{ kind: 'start:' + target.id }];
    }
}

describe('TouchTool', () => {
    const dispatched: Action[] = [];
    const container = new Container();
    container.load(defaultModule);
    container.rebind(TYPES.IActionDispatcher).toConstantValue({
        dispatch: (action: Action) => { dispatched.push(action); return Promise.resolve(); }
    } as unknown as IActionDispatcher);
    const tool = container.get(TouchTool);

    const root = new SModelRootImpl();
    root.id = 'root';
    const node = new SChildElementImpl();
    node.id = 'node';
    root.add(node);

    function mount(): { svg: Element, inner: Element } {
        document.body.innerHTML = '<div id="sprotty"><svg id="sprotty_root"><g id="sprotty_node"><rect id="inner"></rect></g></svg></div>';
        return { svg: document.getElementById('sprotty_root')!, inner: document.getElementById('inner')! };
    }

    function touchStart(target: Element): TouchEvent {
        const event = new TouchEvent('touchstart', { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event;
    }

    beforeEach(() => {
        dispatched.length = 0;
    });

    it('registers handlers for the touch events on the root element only', () => {
        const rootNode = h('svg');
        tool.decorate(rootNode, root);
        expect(Object.keys(rootNode.data!.on!).sort()).toEqual(['touchend', 'touchmove', 'touchstart']);
        const childNode = h('g');
        tool.decorate(childNode, node);
        expect(childNode.data?.on).toBeUndefined();
    });

    it('resolves the model element from the closest DOM ancestor with a model id and dispatches the listener actions', () => {
        const { svg, inner } = mount();
        const listener = new RecordingListener();
        tool.register(listener);
        const vnode = h('svg');
        tool.decorate(vnode, root);
        svg.addEventListener('touchstart', vnode.data!.on!.touchstart as EventListener);

        const event = touchStart(inner);
        expect(listener.targets).toEqual(['node']);
        expect(event.defaultPrevented).toBe(true);
        expect(dispatched).toEqual([{ kind: 'start:node' }]);

        tool.deregister(listener);
        touchStart(inner);
        expect(listener.targets).toEqual(['node']);
    });

    it('ignores touch events while no listener is registered', () => {
        const { svg, inner } = mount();
        const vnode = h('svg');
        tool.decorate(vnode, root);
        svg.addEventListener('touchstart', vnode.data!.on!.touchstart as EventListener);
        expect(() => touchStart(inner)).not.toThrow();
        expect(dispatched).toEqual([]);
    });
});
