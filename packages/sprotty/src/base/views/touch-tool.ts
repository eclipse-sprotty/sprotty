/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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
import { IActionDispatcher } from "../actions/action-dispatcher";
import { SModelElementImpl, SModelRootImpl } from "../model/smodel";
import { TYPES } from "../types";
import { DOMHelper } from "./dom-helper";
import { IVNodePostprocessor } from "./vnode-postprocessor";
import { on } from "./vnode-utils";

@injectable()
export class TouchTool implements IVNodePostprocessor {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;
    @inject(TYPES.DOMHelper) protected domHelper: DOMHelper;

    constructor(@multiInject(TYPES.ITouchListener) @optional() protected touchListeners: ITouchListener[] = []) { }

    register(touchListener: ITouchListener) {
        this.touchListeners.push(touchListener);
    }

    deregister(touchListener: ITouchListener) {
        const index = this.touchListeners.indexOf(touchListener);
        if (index >= 0)
            this.touchListeners.splice(index, 1);
    }

    protected getTargetElement(model: SModelRootImpl, event: TouchEvent): SModelElementImpl | undefined {
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

    protected handleEvent(methodName: TouchEventKind, model: SModelRootImpl, event: TouchEvent) {
        const element = this.getTargetElement(model, event);
        if (!element)
            return;
        const actions = this.touchListeners
            .map(listener => listener[methodName](element, event))
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

    touchStart(model: SModelRootImpl, event: TouchEvent) {
        this.handleEvent('touchStart', model, event);
    }

    touchMove(model: SModelRootImpl, event: TouchEvent) {
        this.handleEvent('touchMove', model, event);
    }

    touchEnd(model: SModelRootImpl, event: TouchEvent) {
        this.handleEvent('touchEnd', model, event);
    }

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (element instanceof SModelRootImpl) {
            on(vnode, 'touchstart', this.touchStart.bind(this, element));
            on(vnode, 'touchmove', this.touchMove.bind(this, element));
            on(vnode, 'touchend', this.touchEnd.bind(this, element));
        }
        return vnode;
    }

    postUpdate() {
    }
}

export type TouchEventKind = 'touchStart' | 'touchMove' | 'touchEnd';

export interface ITouchListener {

    touchStart(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[]

    touchMove(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[]

    touchEnd(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[]

}

@injectable()
export class TouchListener implements TouchListener {

    touchStart(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[] {
        return [];
    }

    touchMove(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[] {
        return [];
    }

    touchEnd(target: SModelElementImpl, event: TouchEvent): (Action | Promise<Action>)[] {
        return [];
    }

}
