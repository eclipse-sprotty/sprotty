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

import { Container, ContainerModule, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { Action, RequestAction, ResponseAction, SelectAction, SetViewportAction, SModelRoot } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { IActionDispatcher } from '../actions/action-dispatcher.js';
import defaultModule from '../di.config.js';
import { IModelFactory } from '../model/smodel-factory.js';
import { registerModelElement } from '../model/smodel-utils.js';
import { SModelElementImpl, SModelRootImpl } from '../model/smodel.js';
import { TYPES } from '../types.js';
import selectModule from '../../features/select/di.config.js';
import viewportModule from '../../features/viewport/di.config.js';
import { SGraphImpl, SNodeImpl } from '../../graph/sgraph.js';
import { IMouseListener, MouseListener, MousePositionTracker, MouseTool, PopupMouseTool } from './mouse-tool.js';
import { ITouchListener, TouchTool } from './touch-tool.js';

@injectable()
class RecordingDispatcher implements IActionDispatcher {
    readonly actions: Action[] = [];

    dispatch(action: Action): Promise<void> {
        this.actions.push(action);
        return Promise.resolve();
    }

    dispatchAll(actions: Action[]): Promise<void> {
        this.actions.push(...actions);
        return Promise.resolve();
    }

    request<Res extends ResponseAction>(_action: RequestAction<Res>): Promise<Res> {
        return Promise.reject(new Error('not implemented'));
    }
}

class NullMouseListener implements IMouseListener {
    mouseOver(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    mouseOut(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    mouseEnter(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    mouseLeave(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    mouseDown(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    mouseMove(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    mouseUp(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    wheel(_target: SModelElementImpl, _event: WheelEvent): (Action | Promise<Action>)[] { return []; }
    doubleClick(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    contextMenu(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    dragOver(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    drop(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] { return []; }
    decorate(node: VNode, _element: SModelElementImpl): VNode { return node; }
}

const STANDALONE_KIND = 'test.standaloneMouseDown';

@injectable()
class StandaloneMouseListener extends NullMouseListener {
    override mouseDown(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] {
        return [{ kind: STANDALONE_KIND }];
    }
}

function createContainer(...modules: ContainerModule[]): Container {
    const container = new Container();
    container.load(defaultModule, ...modules);
    container.rebind(TYPES.IActionDispatcher).to(RecordingDispatcher).inSingletonScope();
    return container;
}

function dispatcherOf(container: Container): RecordingDispatcher {
    return container.get<RecordingDispatcher>(TYPES.IActionDispatcher);
}

function createRoot(container: Container, schema: SModelRoot = { id: 'root', type: 'NONE' }): SModelRootImpl {
    return container.get<IModelFactory>(TYPES.IModelFactory).createRoot(schema);
}

function mouseEvent(id: string, extra: Record<string, unknown> = {}): MouseEvent {
    return {
        target: { id },
        preventDefault() { /* noop */ },
        button: 0,
        buttons: 1,
        offsetX: 0,
        offsetY: 0,
        pageX: 0,
        pageY: 0,
        ...extra
    } as unknown as MouseEvent;
}

function touchEvent(id: string, touches: { pageX: number, pageY: number }[]): TouchEvent {
    return {
        target: { id },
        preventDefault() { /* noop */ },
        touches
    } as unknown as TouchEvent;
}

function createVNode(): VNode {
    return { sel: 'g', data: {}, children: [], text: undefined, elm: undefined, key: undefined };
}

describe('MouseTool', () => {

    it('dispatches actions from an IMouseListener that does not extend MouseListener', () => {
        const container = createContainer();
        container.bind(StandaloneMouseListener).toSelf().inSingletonScope();
        container.bind(TYPES.MouseListener).toService(StandaloneMouseListener);
        const mouseTool = container.get(MouseTool);
        const dispatcher = dispatcherOf(container);
        const root = createRoot(container);

        mouseTool.mouseDown(root, mouseEvent(root.id));

        expect(dispatcher.actions.some(a => a.kind === STANDALONE_KIND)).to.be.true;
    });

    it('register and deregister take effect on the next event', () => {
        const container = createContainer();
        const mouseTool = container.get(MouseTool);
        const dispatcher = dispatcherOf(container);
        const root = createRoot(container);
        const listener = new StandaloneMouseListener();

        mouseTool.register(listener);
        mouseTool.mouseDown(root, mouseEvent(root.id));
        expect(dispatcher.actions.filter(a => a.kind === STANDALONE_KIND)).to.have.length(1);

        mouseTool.deregister(listener);
        mouseTool.mouseDown(root, mouseEvent(root.id));
        expect(dispatcher.actions.filter(a => a.kind === STANDALONE_KIND)).to.have.length(1);
    });

    it('calls decorate once for a dual IMouseListener / ITouchListener; TouchTool does not', () => {
        let decorateCount = 0;
        @injectable()
        class DualListener extends NullMouseListener implements ITouchListener {
            override decorate(node: VNode, _element: SModelElementImpl): VNode {
                decorateCount++;
                return node;
            }
            touchStart(_target: SModelElementImpl, _event: TouchEvent): (Action | Promise<Action>)[] { return []; }
            touchMove(_target: SModelElementImpl, _event: TouchEvent): (Action | Promise<Action>)[] { return []; }
            touchEnd(_target: SModelElementImpl, _event: TouchEvent): (Action | Promise<Action>)[] { return []; }
        }

        const container = createContainer();
        container.bind(DualListener).toSelf().inSingletonScope();
        container.bind(TYPES.MouseListener).toService(DualListener);
        container.bind(TYPES.ITouchListener).toService(DualListener);
        const mouseTool = container.get(MouseTool);
        const touchTool = container.get(TouchTool);
        const root = createRoot(container);
        const tree = createVNode();

        mouseTool.decorate(tree, root);
        expect(decorateCount).to.equal(1);
        touchTool.decorate(tree, root);
        expect(decorateCount).to.equal(1);
    });

    it('routes mouse events to IMouseListener and touch events to ITouchListener on a dual-role class', () => {
        @injectable()
        class DualListener extends NullMouseListener implements ITouchListener {
            override mouseDown(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] {
                return [{ kind: 'dual.mouse' }];
            }
            touchStart(_target: SModelElementImpl, _event: TouchEvent): (Action | Promise<Action>)[] {
                return [{ kind: 'dual.touch' }];
            }
            touchMove(_target: SModelElementImpl, _event: TouchEvent): (Action | Promise<Action>)[] { return []; }
            touchEnd(_target: SModelElementImpl, _event: TouchEvent): (Action | Promise<Action>)[] { return []; }
        }

        const container = createContainer();
        container.bind(DualListener).toSelf().inSingletonScope();
        container.bind(TYPES.MouseListener).toService(DualListener);
        container.bind(TYPES.ITouchListener).toService(DualListener);
        const mouseTool = container.get(MouseTool);
        const touchTool = container.get(TouchTool);
        const dispatcher = dispatcherOf(container);
        const root = createRoot(container);

        mouseTool.mouseDown(root, mouseEvent(root.id));
        expect(dispatcher.actions.map(a => a.kind)).to.include('dual.mouse');
        expect(dispatcher.actions.map(a => a.kind)).to.not.include('dual.touch');

        touchTool.touchStart(root, touchEvent(root.id, [{ pageX: 0, pageY: 0 }]));
        expect(dispatcher.actions.map(a => a.kind)).to.include('dual.touch');
    });

    it('does not invoke a PopupMouseListener from the canvas MouseTool', () => {
        const POPUP_KIND = 'test.popupOnly';
        @injectable()
        class PopupOnlyListener extends NullMouseListener {
            override mouseDown(_target: SModelElementImpl, _event: MouseEvent): (Action | Promise<Action>)[] {
                return [{ kind: POPUP_KIND }];
            }
        }

        const container = createContainer();
        container.bind(PopupOnlyListener).toSelf().inSingletonScope();
        container.bind(TYPES.PopupMouseListener).toService(PopupOnlyListener);
        const mouseTool = container.get(MouseTool);
        const popupMouseTool = container.get(PopupMouseTool);
        const dispatcher = dispatcherOf(container);
        const root = createRoot(container);

        mouseTool.mouseDown(root, mouseEvent(root.id));
        expect(dispatcher.actions.some(a => a.kind === POPUP_KIND)).to.be.false;

        popupMouseTool.mouseDown(root, mouseEvent(root.id));
        expect(dispatcher.actions.some(a => a.kind === POPUP_KIND)).to.be.true;
    });

    it('MouseListener no-op base returns empty actions and identity decorate', () => {
        const listener = new MouseListener();
        const root = new SModelRootImpl();
        root.id = 'root';
        const event = mouseEvent(root.id);
        expect(listener.mouseOver(root, event)).to.deep.equal([]);
        expect(listener.mouseOut(root, event)).to.deep.equal([]);
        expect(listener.mouseEnter(root, event)).to.deep.equal([]);
        expect(listener.mouseLeave(root, event)).to.deep.equal([]);
        expect(listener.mouseDown(root, event)).to.deep.equal([]);
        expect(listener.mouseMove(root, event)).to.deep.equal([]);
        expect(listener.mouseUp(root, event)).to.deep.equal([]);
        expect(listener.wheel(root, event as WheelEvent)).to.deep.equal([]);
        expect(listener.doubleClick(root, event)).to.deep.equal([]);
        expect(listener.contextMenu(root, event)).to.deep.equal([]);
        expect(listener.dragOver(root, event)).to.deep.equal([]);
        expect(listener.drop(root, event)).to.deep.equal([]);
        const tree = createVNode();
        expect(listener.decorate(tree, root)).to.equal(tree);
    });

    it('handleEvent with no listeners does not throw', () => {
        const tool = new MouseTool([]);
        const dispatcher = new RecordingDispatcher();
        (tool as unknown as { actionDispatcher: IActionDispatcher }).actionDispatcher = dispatcher;
        (tool as unknown as { domHelper: { findSModelIdByDOMElement(el: Element): string, createUniqueDOMElementId(): string } }).domHelper = {
            findSModelIdByDOMElement: (el: Element) => el.id,
            createUniqueDOMElementId: () => 'x'
        };
        const root = new SModelRootImpl();
        root.id = 'root';
        root.index.add(root);

        expect(() => tool.mouseDown(root, mouseEvent(root.id))).to.not.throw();
        expect(dispatcher.actions).to.be.empty;
    });

    it('still delivers mouseMove to MousePositionTracker from defaultModule', () => {
        const container = createContainer();
        const mouseTool = container.get(MouseTool);
        const tracker = container.get(MousePositionTracker);
        const root = createRoot(container);

        mouseTool.mouseMove(root, mouseEvent(root.id, { offsetX: 10, offsetY: 20 }));

        expect(tracker.lastPositionOnDiagram).to.deep.equal({ x: 10, y: 20, width: -1, height: -1 });
    });

    it('still delivers SelectAction from SelectMouseListener through MouseTool', () => {
        const container = createContainer(selectModule);
        registerModelElement(container, 'graph', SGraphImpl);
        registerModelElement(container, 'node:circle', SNodeImpl);
        const mouseTool = container.get(MouseTool);
        const dispatcher = dispatcherOf(container);
        const root = createRoot(container, {
            id: 'graph',
            type: 'graph',
            children: [{ id: 'node0', type: 'node:circle' }]
        });

        mouseTool.mouseDown(root, mouseEvent('node0'));

        const select = dispatcher.actions.find(a => a.kind === SelectAction.KIND) as SelectAction | undefined;
        expect(select).to.not.be.undefined;
        expect(select!.selectedElementsIDs).to.deep.equal(['node0']);
    });

    it('still delivers viewport actions from ScrollMouseListener on mouse and touch paths', () => {
        const container = createContainer(viewportModule);
        registerModelElement(container, 'graph', SGraphImpl);
        const mouseTool = container.get(MouseTool);
        const touchTool = container.get(TouchTool);
        const dispatcher = dispatcherOf(container);
        const root = createRoot(container, { id: 'graph', type: 'graph', children: [] });

        mouseTool.mouseDown(root, mouseEvent(root.id, { pageX: 10, pageY: 10 }));
        mouseTool.mouseMove(root, mouseEvent(root.id, { pageX: 20, pageY: 30, buttons: 1 }));
        expect(dispatcher.actions.some(a => a.kind === SetViewportAction.KIND)).to.be.true;

        dispatcher.actions.length = 0;
        touchTool.touchStart(root, touchEvent(root.id, [{ pageX: 10, pageY: 10 }]));
        touchTool.touchMove(root, touchEvent(root.id, [{ pageX: 25, pageY: 40 }]));
        expect(dispatcher.actions.some(a => a.kind === SetViewportAction.KIND)).to.be.true;
    });

});
