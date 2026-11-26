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

import { Container } from 'inversify';
import { SetViewportAction } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { SModelElementImpl } from '../../base/model/smodel.js';
import { TYPES } from '../../base/types.js';
import { ViewerOptions } from '../../base/views/viewer-options.js';
import { SNodeImpl } from '../../graph/sgraph.js';
import { ScrollMouseListener } from './scroll.js';
import { ViewportRootElementImpl } from './viewport-root.js';
import viewportModule from './di.config.js';

describe('ScrollMouseListener', () => {
    const container = new Container();
    container.load(defaultModule, viewportModule);
    registerModelElement(container, 'viewport', ViewportRootElementImpl);
    registerModelElement(container, 'node:circle', SNodeImpl);
    const graphFactory = container.get<IModelFactory>(TYPES.IModelFactory);

    function createListener(): ScrollMouseListener {
        const listener = new ScrollMouseListener();
        (listener as any).viewerOptions = container.get<ViewerOptions>(TYPES.ViewerOptions);
        return listener;
    }

    interface ViewportModel { root: ViewportRootElementImpl; node: SModelElementImpl; }

    function createModel(): ViewportModel {
        const node0 = { id: 'node0', type: 'node:circle', position: { x: 0, y: 0 } };
        const root = graphFactory.createRoot({ id: 'viewport', type: 'viewport', children: [node0] }) as ViewportRootElementImpl;
        root.canvasBounds = { x: 0, y: 0, width: 100, height: 100 };
        return { root, node: root.index.getById('node0')! };
    }

    function mouseEvent(props: Partial<MouseEvent> = {}): MouseEvent {
        return { button: 0, buttons: 1, pageX: 0, pageY: 0, ...props } as MouseEvent;
    }

    it('pans the viewport on background drag', () => {
        const { root } = createModel();
        const listener = createListener();
        listener.mouseDown(root, mouseEvent({ pageX: 0, pageY: 0 }));
        const actions = listener.mouseMove(root, mouseEvent({ buttons: 1, pageX: 10, pageY: 0 }));
        expect(actions.map(a => a.kind)).to.contain(SetViewportAction.KIND);
    });

    it('keeps panning when the cursor moves far outside the canvas', () => {
        const { root } = createModel();
        const listener = createListener();
        listener.mouseDown(root, mouseEvent({ pageX: 0, pageY: 0 }));
        listener.mouseMove(root, mouseEvent({ buttons: 1, pageX: 10, pageY: 0 }));
        const actions = listener.mouseMove(root, mouseEvent({ buttons: 1, pageX: 9999, pageY: 9999 }));
        expect(actions.map(a => a.kind)).to.contain(SetViewportAction.KIND);
    });

    it('ends the gesture on mouseUp, even off-canvas', () => {
        const { root } = createModel();
        const listener = createListener();
        listener.mouseDown(root, mouseEvent({ pageX: 0, pageY: 0 }));
        listener.mouseMove(root, mouseEvent({ buttons: 1, pageX: 10, pageY: 0 }));
        listener.mouseUp(root, mouseEvent({ pageX: 9999, pageY: 9999, buttons: 0 }));
        const afterUp = listener.mouseMove(root, mouseEvent({ buttons: 1, pageX: 20, pageY: 0 }));
        expect(afterUp).to.be.empty;
    });

    it('does not pan when the drag starts on a moveable element', () => {
        const { node } = createModel();
        const listener = createListener();
        listener.mouseDown(node, mouseEvent({ pageX: 0, pageY: 0 }));
        const actions = listener.mouseMove(node, mouseEvent({ buttons: 1, pageX: 10, pageY: 0 }));
        expect(actions).to.be.empty;
    });
});
