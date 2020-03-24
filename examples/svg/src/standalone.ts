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

import { LocalModelSource, TYPES, SModelRootSchema, ShapedPreRenderedElementSchema, ForeignObjectElementSchema } from "../../../src";
import createContainer from "./di.config";

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

export default function runMulticore() {
    const p1 = loadFile('images/SVG_logo.svg');
    const p2 = loadFile('images/Ghostscript_Tiger.svg');
    Promise.all([p1, p2]).then(([svgLogo, tiger]) => {
        const container = createContainer();

        // Initialize model
        const model: SModelRootSchema = {
            type: 'svg',
            id: 'root',
            children: [
                {
                    type: 'pre-rendered',
                    id: 'logo',
                    position: { x: 200, y: 200 },
                    code: svgLogo
                } as ShapedPreRenderedElementSchema,
                {
                    type: 'pre-rendered',
                    id: 'tiger',
                    position: { x: 400, y: 0 },
                    code: tiger
                } as ShapedPreRenderedElementSchema,
                {
                    type: 'foreign-object',
                    id: 'direct-html',
                    position: { x: 50, y: 350 },
                    size: { height: 50, width: 190 },
                    code: "<p>This is a free-floating HTML paragraph!</p>"
                } as ForeignObjectElementSchema
            ]
        };

        // Run
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        modelSource.setModel(model);
    });
}
