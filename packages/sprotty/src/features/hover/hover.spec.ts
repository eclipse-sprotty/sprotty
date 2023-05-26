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

import "reflect-metadata";
import "mocha";
import { expect } from "chai";
import { Container } from "inversify";
import { Action, HoverFeedbackAction } from 'sprotty-protocol/lib/actions';
import { TYPES } from "../../base/types";
import { SChildElementImpl, SModelElementImpl, SModelRootImpl } from "../../base/model/smodel";
import { HoverMouseListener } from "./hover";
import { Hoverable, hoverFeedbackFeature, popupFeature } from "./model";
import defaultModule from "../../base/di.config";
import hoverModule from "./di.config";

describe('hover', () => {
    class HoverListenerMock extends HoverMouseListener {

        resetLastHoverFeedbackElement() {
            this.lastHoverFeedbackElementId = undefined;
        }

        set popupIsOpen(isOpen: boolean) {
            this.state.popupOpen = isOpen;
        }

        get popupIsOpen(): boolean {
            return this.state.popupOpen;
        }

        set previousPopupElementMock(el: SModelElementImpl) {
            this.state.previousPopupElement = el;
        }

        protected override startMouseOverTimer(target: SModelElementImpl, evt: MouseEvent): Promise<Action> {
            this.state.popupOpen = true;
            this.state.previousPopupElement = target;
            return new Promise<Action>(() => {
            });
        }

        protected override startMouseOutTimer(): Promise<Action> {
            this.state.popupOpen = false;
            return new Promise<Action>(() => {
            });
        }

        protected override getElementFromEventPosition(event: MouseEvent) {
            // the original implementation uses document which isn't available in unit testing
            return null;
        }
    }

    class PopupTarget extends SChildElementImpl {
        override hasFeature(feature: symbol): boolean {
            return feature === popupFeature;
        }
    }

    class HoverableTarget extends SModelElementImpl implements Hoverable {
        hoverFeedback: boolean = false;

        constructor(id: string = "1") {
            super();
            this.id = id;
        }

        override hasFeature(feature: symbol): boolean {
            return feature === hoverFeedbackFeature;
        }
    }

    const container = new Container();
    container.load(defaultModule, hoverModule);
    container.rebind(TYPES.MouseListener).to(HoverListenerMock);
    const hoverListener = container.get<HoverListenerMock>(TYPES.MouseListener);

    const event = {} as MouseEvent;

    describe('mouseover result', () => {
        it('is empty on hovering over non-hoverable elements', () => {
            const target = new SModelElementImpl();
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event);
            expect(mouseOverResult).to.be.empty;
        });
        it('contains HoverFeedbackAction on hovering over an hoverable element', () => {
            const target = new HoverableTarget();
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event);

            expect(mouseOverResult).to.have.lengthOf(1);
            expect((mouseOverResult[0] as Action).kind).to.equal(HoverFeedbackAction.KIND);
        });
        it('resets the hover feedback on hovering over another element', () => {
            const target = new HoverableTarget("1");
            const anotherTarget = new HoverableTarget("2");
            hoverListener.mouseOver(target, event);
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(anotherTarget, event);

            expect(mouseOverResult).to.have.lengthOf(2);
            expect((mouseOverResult[0] as Action).kind).to.equal(HoverFeedbackAction.KIND);
            expect((mouseOverResult[1] as Action).kind).to.equal(HoverFeedbackAction.KIND);

            const action1 = mouseOverResult[0] as HoverFeedbackAction;
            const action2 = mouseOverResult[1] as HoverFeedbackAction;
            const actionForTarget = [action1, action2].filter(action => action.mouseoverElement === target.id);
            const actionForAnotherTarget = [action1, action2].filter(action => action.mouseoverElement === anotherTarget.id);
            expect(actionForTarget[0].mouseIsOver).to.be.false;
            expect(actionForAnotherTarget[0].mouseIsOver).to.be.true;
            // reset state by hovering over the root
            hoverListener.mouseOver(new SModelRootImpl(), event);
        });
        it('contains SetPopupModelAction if popup is open and hovering over an non-hoverable element', () => {
            hoverListener.resetLastHoverFeedbackElement();
            hoverListener.popupIsOpen = true;
            const target = new SModelElementImpl();
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event);

            expect(mouseOverResult).to.have.lengthOf(1);
            expect(mouseOverResult[0]).to.be.an.instanceof(Promise);
        });
        it('resets the hover feedback when moving out of another element', () => {
            hoverListener.resetLastHoverFeedbackElement();
            const target = new HoverableTarget("1");
            const anotherTarget = new HoverableTarget("2");
            hoverListener.mouseOver(target, event);
            const mouseOutResult: (Action | Promise<Action>)[] = hoverListener.mouseOut(anotherTarget, event);

            expect(mouseOutResult).to.have.lengthOf(2);
            expect((mouseOutResult[0] as Action).kind).to.equal(HoverFeedbackAction.KIND);
            expect((mouseOutResult[1] as Action).kind).to.equal(HoverFeedbackAction.KIND);

            const action1 = mouseOutResult[0] as HoverFeedbackAction;
            const action2 = mouseOutResult[1] as HoverFeedbackAction;
            const actionForTarget = [action1, action2].filter(action => action.mouseoverElement === target.id);
            const actionForAnotherTarget = [action1, action2].filter(action => action.mouseoverElement === anotherTarget.id);
            expect(actionForTarget[0].mouseIsOver).to.be.false;
            expect(actionForAnotherTarget[0].mouseIsOver).to.be.false;
            // reset state by hovering over the root
            hoverListener.mouseOver(new SModelRootImpl(), event);
        });
        it('contains SetPopupModelAction and Promise if popup is open and previous target is not the same', () => {
            hoverListener.popupIsOpen = true;
            const prevTarget = new PopupTarget();
            prevTarget.id = 'prevTarget';
            hoverListener.previousPopupElementMock = prevTarget;
            const target = new PopupTarget();
            target.id = 'newTarget';
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event);

            expect(mouseOverResult).to.have.lengthOf(2);
            expect(mouseOverResult[0]).to.be.an.instanceof(Promise);
            expect(mouseOverResult[1]).to.be.an.instanceof(Promise);
        });
        it('contains nothing if popup is open and previous target is the same', () => {
            hoverListener.popupIsOpen = false;
            const childTarget = new SChildElementImpl();
            childTarget.id = 'someLabel';
            const target = new PopupTarget();
            target.id = 'hoverTarget';
            const root = new SModelRootImpl();
            root.add(target);
            target.add(childTarget);

            hoverListener.mouseOver(target, event);
            expect(hoverListener.popupIsOpen).to.equal(true);

            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(childTarget, event);
            expect(mouseOverResult).to.have.lengthOf(0);
        });
    });

});
