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

import toHTML from 'snabbdom-to-html';
import { Projectable } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { RenderingContext } from '../../base/views/view.js';
import { SNodeImpl } from '../../graph/sgraph.js';
import { ViewportRootElementImpl } from '../viewport/viewport-root.js';
import { ProjectedViewportView } from './views.js';

class ProjectableNode extends SNodeImpl implements Projectable {
    projectionCssClasses = ['foo'];
}

describe('ProjectedViewportView', () => {
    const view = new ProjectedViewportView();
    const context = { renderChildren: () => [] } as unknown as RenderingContext;

    /** A 200x200 model shown on a 100x100 canvas, so every model unit maps to half a pixel on the bars. */
    function createModel(nodeX: number) {
        const root = new ViewportRootElementImpl();
        root.id = 'root';
        root.bounds = { x: 0, y: 0, width: 200, height: 200 };
        root.canvasBounds = { x: 0, y: 0, width: 100, height: 100 };
        const node = new ProjectableNode();
        node.id = 'node';
        node.bounds = { x: nodeX, y: 100, width: 50, height: 50 };
        root.add(node);
        return root;
    }

    it('renders the viewport and the projections on a vertical and a horizontal bar', () => {
        const html = toHTML(view.render(createModel(100), context));
        expect(html).toContain('<div class="sprotty-root" tabindex="0"><svg><g transform="scale(1) translate(0,0)"></g></svg>');
        expect(html).toContain('<div class="sprotty-projection-bar vertical">'
            + '<div class="sprotty-viewport" style="top: 0px; height: 50px"></div>'
            + '<div id="vertical-projection:node" class="sprotty-projection foo" style="top: 50px; height: 25px"></div></div>');
        expect(html).toContain('<div class="sprotty-projection-bar horizontal">'
            + '<div class="sprotty-viewport" style="left: 0px; width: 50px"></div>'
            + '<div id="horizontal-projection:node" class="sprotty-projection foo" style="left: 50px; width: 25px"></div></div>');
    });

    it('clips projections that extend beyond the model bounds', () => {
        const html = toHTML(view.render(createModel(180), context));
        expect(html).toContain('<div id="horizontal-projection:node" class="sprotty-projection foo" style="left: 90px; width: 10px"></div>');
    });

    it('renders no bars for an invalid zoom', () => {
        const model = createModel(100);
        model.zoom = 0;
        expect(toHTML(view.render(model, context))).not.toContain('sprotty-projection-bar');
    });
});
