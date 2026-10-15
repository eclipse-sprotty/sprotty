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

/** @vitest-environment happy-dom */

import { Container } from 'inversify';
import { beforeEach, describe, expect, it } from 'vitest';
import defaultModule from '../di.config.js';
import { SModelRootImpl } from '../model/smodel.js';
import { TYPES } from '../types.js';
import { IPointerListener, PointerCaptureListener } from './pointer-tool.js';

interface CaptureCalls {
    set: number[];
    release: number[];
}

function makeElement(): { element: Element, calls: CaptureCalls } {
    const element = document.createElement('div');
    const calls: CaptureCalls = { set: [], release: [] };
    const captured = new Set<number>();
    element.setPointerCapture = (id: number) => { calls.set.push(id); captured.add(id); };
    element.releasePointerCapture = (id: number) => { calls.release.push(id); captured.delete(id); };
    element.hasPointerCapture = (id: number) => captured.has(id);
    return { element, calls };
}

function pointerEvent(target: EventTarget | null, props: Partial<PointerEvent> = {}): PointerEvent {
    return {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        buttons: 1,
        pointerType: 'mouse',
        target,
        currentTarget: target,
        ...props
    } as unknown as PointerEvent;
}

describe('PointerCaptureListener', () => {
    const root = new SModelRootImpl();
    let listener: PointerCaptureListener;

    beforeEach(() => {
        listener = new PointerCaptureListener();
    });

    it('captures the hit element on a primary mouse pointerdown', () => {
        const { element, calls } = makeElement();
        const result = listener.pointerDown(root, pointerEvent(element));
        expect(calls.set).to.deep.equal([1]);
        expect(result).to.be.empty;
    });

    it('captures on a primary pen pointerdown', () => {
        const { element, calls } = makeElement();
        listener.pointerDown(root, pointerEvent(element, { pointerType: 'pen' }));
        expect(calls.set).to.deep.equal([1]);
    });

    it('does not capture touch pointers', () => {
        const { element, calls } = makeElement();
        listener.pointerDown(root, pointerEvent(element, { pointerType: 'touch' }));
        expect(calls.set).to.be.empty;
    });

    it('does not capture the secondary button', () => {
        const { element, calls } = makeElement();
        listener.pointerDown(root, pointerEvent(element, { button: 2 }));
        expect(calls.set).to.be.empty;
    });

    it('does not capture non-primary pointers', () => {
        const { element, calls } = makeElement();
        listener.pointerDown(root, pointerEvent(element, { isPrimary: false }));
        expect(calls.set).to.be.empty;
    });

    it('re-captures the root on lostpointercapture while the button is down', () => {
        const hit = makeElement();
        const rootElement = makeElement();
        listener.pointerDown(root, pointerEvent(hit.element));
        listener.lostPointerCapture(root, pointerEvent(hit.element, { currentTarget: rootElement.element, buttons: 1 }));
        expect(rootElement.calls.set).to.deep.equal([1]);
        // The lost-capture branch must not release the pointer, or it would undo its own re-capture.
        expect(hit.element.hasPointerCapture(1)).to.be.true;
    });

    it('does not re-capture on lostpointercapture once the button is released', () => {
        const hit = makeElement();
        const rootElement = makeElement();
        listener.pointerDown(root, pointerEvent(hit.element));
        listener.lostPointerCapture(root, pointerEvent(hit.element, { currentTarget: rootElement.element, buttons: 0 }));
        expect(rootElement.calls.set).to.be.empty;
    });

    it('does not re-capture a pointer it never captured', () => {
        const rootElement = makeElement();
        listener.lostPointerCapture(root, pointerEvent(makeElement().element, { currentTarget: rootElement.element, buttons: 1 }));
        expect(rootElement.calls.set).to.be.empty;
    });

    it('releases the capture on pointerup', () => {
        const { element, calls } = makeElement();
        listener.pointerDown(root, pointerEvent(element));
        listener.pointerUp(root, pointerEvent(element, { buttons: 0 }));
        expect(calls.release).to.deep.equal([1]);
    });

    it('releases the capture on pointercancel', () => {
        const { element, calls } = makeElement();
        listener.pointerDown(root, pointerEvent(element));
        listener.pointerCancel(root, pointerEvent(element, { buttons: 0 }));
        expect(calls.release).to.deep.equal([1]);
    });

    it('does not throw when the pointer id is already invalid', () => {
        const element = document.createElement('div');
        element.setPointerCapture = () => { throw new Error('InvalidPointerId'); };
        expect(() => listener.pointerDown(root, pointerEvent(element))).not.to.throw();
    });
});

describe('PointerCaptureListener bindings', () => {
    it('is bound as a default pointer listener', () => {
        const container = new Container();
        container.load(defaultModule);
        const listeners = container.getAll<IPointerListener>(TYPES.IPointerListener);
        expect(listeners.some(l => l instanceof PointerCaptureListener)).to.be.true;
    });
});
