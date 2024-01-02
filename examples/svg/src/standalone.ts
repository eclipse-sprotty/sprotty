/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
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

import { TYPES, LocalModelSource } from 'sprotty';
import createContainer from './di.config';
import {
    ForeignObjectElement, SShapeElement, ShapedPreRenderedElement, ViewportRootElement, Projectable
} from 'sprotty-protocol';

function loadFile(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', path);
        request.addEventListener('load', () => {
            resolve(request.responseText);
        });
        request.addEventListener('error', (event) => {
            reject(event);
        });
        request.send();
    });
}

export default async function runSVG() {
    const svgLogo = await loadFile('images/SVG_logo.svg');
    const tiger = await loadFile('images/Ghostscript_Tiger.svg');
    const container = createContainer();

    // Initialize model
    const model: ViewportRootElement = {
        type: 'svg',
        id: 'root',
        children: [
            {
                type: 'pre-rendered',
                id: 'logo',
                position: { x: 200, y: 200 },
                code: svgLogo,
                projectionCssClasses: ['logo-projection']
            } as ShapedPreRenderedElement & Projectable,
            {
                type: 'pre-rendered',
                id: 'tiger',
                position: { x: 400, y: 50 },
                code: tiger,
                projectionCssClasses: ['tiger-projection']
            } as ShapedPreRenderedElement & Projectable,
            {
                type: 'foreign-object',
                id: 'direct-html',
                position: { x: 50, y: 350 },
                size: { height: 50, width: 190 },
                code: '<p>This is a free-floating HTML paragraph!</p>'
            } as ForeignObjectElement,
            {
                id: 'foreign-object-in-shape',
                type: 'node',
                position: {
                    x: 50,
                    y: 90
                },
                size: {
                    height: 60,
                    width: 160
                },
                children: [
                    {
                        type: 'child-foreign-object',
                        id: 'foreign-object-in-shape-contents',
                        code: '<div>This is <em>HTML</em> within <u>an SVG rectangle</u>!</div>'
                    } as ForeignObjectElement
                ],
                projectionCssClasses: ['node-projection']
            } as SShapeElement & Projectable
        ]
    };

    // Run
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    await modelSource.setModel(model);
}
