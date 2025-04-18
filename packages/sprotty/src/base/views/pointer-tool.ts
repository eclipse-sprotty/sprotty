/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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
export class PointerTool implements IVNodePostprocessor {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher!: IActionDispatcher;
    @inject(TYPES.DOMHelper) protected domHelper!: DOMHelper;

    constructor(@multiInject(TYPES.IPointerListener) @optional() protected pointerListeners: IPointerListener[] = []) {}

    register(pointerListener: IPointerListener) {
        this.pointerListeners.push(pointerListener);
    }

    deregister(pointerListener: IPointerListener) {
        const index = this.pointerListeners.indexOf(pointerListener);
        if (index >= 0) this.pointerListeners.splice(index, 1);
    }

    protected getTargetElement(model: SModelRootImpl, event: PointerEvent): SModelElementImpl | undefined {
        let target = event.target as Element;
        const index = model.index;
        while (target) {
            if (target.id) {
                const element = index.getById(this.domHelper.findSModelIdByDOMElement(target));
                if (element !== undefined) return element;
            }
            target = target.parentNode as Element;
        }
        return undefined;
    }

    protected handleEvent(methodName: PointerEventKind, model: SModelRootImpl, event: PointerEvent) {
        const element = this.getTargetElement(model, event);
        if (!element) return;
        const actions = this.pointerListeners
            .map((listener) => listener[methodName](element, event))
            .reduce((a, b) => a.concat(b), []);
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

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (element instanceof SModelRootImpl) {
            on(vnode, "pointerover", this.handleEvent.bind(this, "pointerOver", element) as (e: Event) => void);
            on(vnode, "pointerenter", this.handleEvent.bind(this, "pointerEnter", element) as (e: Event) => void);
            on(vnode, "pointerdown", this.handleEvent.bind(this, "pointerDown", element) as (e: Event) => void);
            on(vnode, "pointermove", this.handleEvent.bind(this, "pointerMove", element) as (e: Event) => void);
            on(vnode, "pointerup", this.handleEvent.bind(this, "pointerUp", element) as (e: Event) => void);
            on(vnode, "pointercancel", this.handleEvent.bind(this, "pointerCancel", element) as (e: Event) => void);
            on(vnode, "pointerout", this.handleEvent.bind(this, "pointerOut", element) as (e: Event) => void);
            on(vnode, "pointerleave", this.handleEvent.bind(this, "pointerLeave", element) as (e: Event) => void);
            on(
                vnode,
                "gotpointercapture",
                this.handleEvent.bind(this, "gotPointerCapture", element) as (e: Event) => void
            );
            on(
                vnode,
                "lostpointercapture",
                this.handleEvent.bind(this, "lostPointerCapture", element) as (e: Event) => void
            );
        }
          return vnode;
    }

    postUpdate() {
    }
}

export type PointerEventKind =
    | "pointerOver"
    | "pointerEnter"
    | "pointerDown"
    | "pointerMove"
    | "pointerUp"
    | "pointerCancel"
    | "pointerOut"
    | "pointerLeave"
    | "gotPointerCapture"
    | "lostPointerCapture";

export interface IPointerListener {

    pointerOver(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    pointerEnter(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    pointerDown(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    pointerMove(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    pointerUp(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    pointerCancel(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    pointerOut(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    pointerLeave(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    gotPointerCapture(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];

    lostPointerCapture(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[];
}

@injectable()
export class PointerListener implements IPointerListener {

    pointerOver(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    pointerEnter(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    pointerDown(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    pointerMove(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    pointerUp(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    pointerCancel(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    pointerOut(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    pointerLeave(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    gotPointerCapture(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

    lostPointerCapture(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        return [];
    }

}
