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
import { TYPES } from "../../base/types";
import { SChildElement, SModelElement, SModelRoot } from "../../base/model/smodel";
import { Action } from "../../base/actions/action";
import { HoverFeedbackAction, HoverMouseListener } from "./hover";
import { Hoverable, hoverFeedbackFeature, popupFeature } from "./model";
import defaultModule from "../../base/di.config";
import hoverModule from "./di.config";

describe('hover', () => {
    class HoverListenerMock extends HoverMouseListener {

        set popupIsOpen(isOpen: boolean) {
            this.state.popupOpen = isOpen;
        }

        get popupIsOpen(): boolean {
            return this.state.popupOpen;
        }

        set previousPopupElementMock(el: SModelElement) {
            this.state.previousPopupElement = el;
        }

        protected startMouseOverTimer(target: SModelElement, evt: MouseEvent): Promise<Action> {
            this.state.popupOpen = true;
            this.state.previousPopupElement = target;
            return new Promise<Action>(() => {
            });
        }


        protected startMouseOutTimer(): Promise<Action> {
            this.state.popupOpen = false;
            return new Promise<Action>(() => {
            });
        }
    }

    class PopupTarget extends SChildElement {
        hasFeature(feature: symbol): boolean {
            return feature === popupFeature;
        }
    }

    class HoverableTarget extends SModelElement implements Hoverable {
        hoverFeedback: boolean = false;

        constructor(id: string = "1") {
            super();
            this.id = id;
        }

        hasFeature(feature: symbol): boolean {
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
            const target = new SModelElement();
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event);
            expect(mouseOverResult).to.be.empty;
        });
        it('contains HoverFeedbackAction on hovering over an hoverable element', () => {
            const target = new HoverableTarget();
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event);

            expect(mouseOverResult).to.have.lengthOf(1);
            expect(mouseOverResult[0]).to.be.an.instanceof(HoverFeedbackAction);
        });
        it('resets the hover feedback on hovering over another element', () => {
            const target = new HoverableTarget("1");
            const anotherTarget = new HoverableTarget("2");
            hoverListener.mouseOver(target, event);
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(anotherTarget, event);

            expect(mouseOverResult).to.have.lengthOf(2);
            expect(mouseOverResult[0]).to.be.an.instanceof(HoverFeedbackAction);
            expect(mouseOverResult[1]).to.be.an.instanceof(HoverFeedbackAction);

            const action1 = mouseOverResult[0] as HoverFeedbackAction;
            const action2 = mouseOverResult[1] as HoverFeedbackAction;
            const actionForTarget = [action1, action2].filter(action => action.mouseoverElement === target.id);
            const actionForAnotherTarget = [action1, action2].filter(action => action.mouseoverElement === anotherTarget.id);
            expect(actionForTarget[0].mouseIsOver).to.be.false;
            expect(actionForAnotherTarget[0].mouseIsOver).to.be.true;
            // reset state by hovering over the root
            hoverListener.mouseOver(new SModelRoot(), event);
        });
        it('contains SetPopupModelAction if popup is open and hovering over an non-hoverable element', () => {
            hoverListener.popupIsOpen = true;
            const target = new SModelElement();
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event);

            expect(mouseOverResult).to.have.lengthOf(1);
            expect(mouseOverResult[0]).to.be.an.instanceof(Promise);
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
            const childTarget = new SChildElement();
            childTarget.id = 'someLabel';
            const target = new PopupTarget();
            target.id = 'hoverTarget';
            const root = new SModelRoot();
            root.add(target);
            target.add(childTarget);

            hoverListener.mouseOver(target, event);
            expect(hoverListener.popupIsOpen).to.equal(true);

            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(childTarget, event);
            expect(mouseOverResult).to.have.lengthOf(0);
        });
    });

});
