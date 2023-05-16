/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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

import { inject, injectable, multiInject, optional } from "inversify";
import { VNode } from "snabbdom";
import { Action, isAction } from "sprotty-protocol/lib/actions";
import { Point } from "sprotty-protocol/lib/utils/geometry";
import { IActionDispatcher } from "../actions/action-dispatcher";
import { SModelElementImpl, SModelRootImpl } from "../model/smodel";
import { TYPES } from "../types";
import { DOMHelper } from "./dom-helper";
import { IVNodePostprocessor } from "./vnode-postprocessor";
import { on } from "./vnode-utils";

@injectable()
export class MouseTool implements IVNodePostprocessor {

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;

    constructor(@multiInject(TYPES.MouseListener) @optional() protected mouseListeners: MouseListener[] = []) { }

    register(mouseListener: MouseListener) {
        this.mouseListeners.push(mouseListener);
    }

    deregister(mouseListener: MouseListener) {
        const index = this.mouseListeners.indexOf(mouseListener);
        if (index >= 0)
            this.mouseListeners.splice(index, 1);
    }

    protected getTargetElement(model: SModelRootImpl, event: MouseEvent): SModelElementImpl | undefined {
        let target = event.target as Element;
        const index = model.index;
        while (target) {
            if (target.id) {
                const element = index.getById(this.domHelper.findSModelIdByDOMElement(target));
                if (element !== undefined)
                    return element;
            }
            target = target.parentNode as Element;
        }
        return undefined;
    }

    protected handleEvent(methodName: MouseEventKind, model: SModelRootImpl, event: MouseEvent) {
        this.focusOnMouseEvent(methodName, model);
        const element = this.getTargetElement(model, event);
        if (!element)
            return;
        const actions = this.mouseListeners
            .map(listener => listener[methodName](element, event as WheelEvent))
            .reduce((a, b) => a.concat(b));
        if (actions.length > 0) {
            event.preventDefault();
            for (const actionOrPromise of actions) {
                if (isAction(actionOrPromise)) {
                    this.actionDispatcher.dispatch(actionOrPromise);
                } else {
                    actionOrPromise.then((action: Action) => {
                        this.actionDispatcher.dispatch(action);
                    });
                }
            }
        }
    }

    protected focusOnMouseEvent<K extends keyof MouseListener>(methodName: K, model: SModelRootImpl) {
        if (document && methodName === 'mouseDown') {
            const domElement = document.getElementById(this.domHelper.createUniqueDOMElementId(model));
            if (domElement !== null && typeof domElement.focus === 'function')
                domElement.focus();
        }
    }

    mouseOver(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('mouseOver', model, event);
    }

    mouseOut(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('mouseOut', model, event);
    }

    mouseEnter(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('mouseEnter', model, event);
    }

    mouseLeave(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('mouseLeave', model, event);
    }

    mouseDown(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('mouseDown', model, event);
    }

    mouseMove(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('mouseMove', model, event);
    }

    mouseUp(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('mouseUp', model, event);
    }

    wheel(model: SModelRootImpl, event: WheelEvent) {
        this.handleEvent('wheel', model, event);
    }

    contextMenu(model: SModelRootImpl, event: MouseEvent) {
        event.preventDefault();
        this.handleEvent('contextMenu', model, event);
    }

    doubleClick(model: SModelRootImpl, event: MouseEvent) {
        this.handleEvent('doubleClick', model, event);
    }

    decorate(vnode: VNode, element: SModelElementImpl) {
        if (element instanceof SModelRootImpl) {
            on(vnode, 'mouseover', this.mouseOver.bind(this, element));
            on(vnode, 'mouseout', this.mouseOut.bind(this, element));
            on(vnode, 'mouseenter', this.mouseEnter.bind(this, element));
            on(vnode, 'mouseleave', this.mouseLeave.bind(this, element));
            on(vnode, 'mousedown', this.mouseDown.bind(this, element));
            on(vnode, 'mouseup', this.mouseUp.bind(this, element));
            on(vnode, 'mousemove', this.mouseMove.bind(this, element));
            on(vnode, 'wheel', this.wheel.bind(this, element));
            on(vnode, 'contextmenu', this.contextMenu.bind(this, element));
            on(vnode, 'dblclick', this.doubleClick.bind(this, element));
            on(vnode, 'dragover', (event: MouseEvent) => this.handleEvent('dragOver', element, event));
            on(vnode, 'drop', (event: MouseEvent) => this.handleEvent('drop', element, event));
        }
        vnode = this.mouseListeners.reduce(
            (n: VNode, listener: MouseListener) => listener.decorate(n, element),
            vnode);
        return vnode;
    }

    postUpdate() {
    }
}

@injectable()
export class PopupMouseTool extends MouseTool {
    constructor(@multiInject(TYPES.PopupMouseListener) @optional() protected override mouseListeners: MouseListener[] = []) {
        super(mouseListeners);
    }
}

export type MouseEventKind =
    'mouseOver' | 'mouseOut' | 'mouseEnter' | 'mouseLeave' | 'mouseDown' | 'mouseMove' | 'mouseUp'
    | 'wheel' | 'doubleClick' | 'contextMenu' | 'dragOver' | 'drop';

@injectable()
export class MouseListener {

    mouseOver(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    mouseOut(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    mouseEnter(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    mouseLeave(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    mouseDown(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    mouseMove(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    mouseUp(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    wheel(target: SModelElementImpl, event: WheelEvent): (Action | Promise<Action>)[] {
        return [];
    }

    doubleClick(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    contextMenu(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    dragOver(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    drop(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        return [];
    }

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        return vnode;
    }
}

@injectable()
export class MousePositionTracker extends MouseListener {

    protected lastPosition: Point | undefined;

    override mouseMove(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.lastPosition = target.root.parentToLocal({ x: event.offsetX, y: event.offsetY });
        return [];
    }

    /**
     * Returns the last tracked mouse cursor position relative to the diagram root or `undefined`
     * if no mouse cursor position was ever tracked yet.
     */
    get lastPositionOnDiagram(): Point | undefined {
        return this.lastPosition;
    }
}
