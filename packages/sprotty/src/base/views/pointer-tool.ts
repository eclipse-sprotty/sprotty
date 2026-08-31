/********************************************************************************
 * Copyright (c) 2025-2026 TypeFox and others.
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
import { Action, isAction } from "sprotty-protocol";
import { IActionDispatcher } from "../actions/action-dispatcher.js";
import { SModelElementImpl, SModelRootImpl } from "../model/smodel.js";
import { TYPES } from "../types.js";
import { DOMHelper } from "./dom-helper.js";
import { IVNodePostprocessor } from "./vnode-postprocessor.js";
import { on } from "./vnode-utils.js";

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
        // Capture events fall back to the root: the target may be a node removed from the DOM mid-drag.
        const element = this.getTargetElement(model, event) ?? (isCaptureEvent(methodName) ? model : undefined);
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

function isCaptureEvent(kind: PointerEventKind): boolean {
    return kind === "gotPointerCapture" || kind === "lostPointerCapture";
}

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

/**
 * Captures the pointer on mouse/pen presses so drags continue outside the canvas (#485).
 * Produces no actions; the mouse listeners keep handling the drag. Touch is never captured,
 * as `TouchTool` relies on the browser's implicit touch capture.
 */
@injectable()
export class PointerCaptureListener extends PointerListener {

    protected capturedPointerIds = new Set<number>();

    override pointerDown(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        if (this.shouldCapture(event)) {
            // Capture the hit element, not the root, so the compatibility mouse events keep their target.
            const element = this.getCaptureElement(event.target);
            if (element) {
                this.setCapture(element, event.pointerId);
            }
        }
        return [];
    }

    override lostPointerCapture(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        // A captured element removed mid-drag drops the capture: re-capture on the root while pressed.
        if (this.capturedPointerIds.has(event.pointerId) && event.buttons !== 0) {
            const root = this.getCaptureElement(event.currentTarget);
            if (root) {
                this.setCapture(root, event.pointerId);
            }
        }
        return [];
    }

    override pointerUp(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        this.releaseCapture(event);
        return [];
    }

    override pointerCancel(target: SModelElementImpl, event: PointerEvent): (Action | Promise<Action>)[] {
        this.releaseCapture(event);
        return [];
    }

    protected shouldCapture(event: PointerEvent): boolean {
        return event.isPrimary && event.button === 0 && event.pointerType !== 'touch';
    }

    protected getCaptureElement(target: EventTarget | null): Element | undefined {
        if (target instanceof Element) {
            return target;
        }
        if (target instanceof Node && target.parentElement) {
            return target.parentElement;
        }
        return undefined;
    }

    protected setCapture(element: Element, pointerId: number): void {
        try {
            element.setPointerCapture(pointerId);
            this.capturedPointerIds.add(pointerId);
        } catch {
            // Ignore: the pointer may no longer be active.
        }
    }

    protected releaseCapture(event: PointerEvent): void {
        this.capturedPointerIds.delete(event.pointerId);
        const element = this.getCaptureElement(event.target);
        if (element) {
            try {
                if (element.hasPointerCapture(event.pointerId)) {
                    element.releasePointerCapture(event.pointerId);
                }
            } catch {
                // Ignore: the capture may already be released.
            }
        }
    }
}
