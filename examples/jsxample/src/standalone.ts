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

import { LocalModelSource, RequestExportSvgAction, TYPES } from 'sprotty';
import createContainer from './di.config';

export default async function runJsxample() {
    const container = createContainer('sprotty');
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);

    document.addEventListener('export', (event: CustomEvent) => {
        modelSource.actionDispatcher.dispatch(RequestExportSvgAction.create(event.detail.fileName));
    });

    const graph = {
        id: 'root',
        type: 'graph',
        children: [
            {
                id: 'node1',
                type: 'node',
                position: { x: 100, y: 100 },
                layout: 'stack',
                layoutOptions: {
                    hAlign: 'center',
                    vAlign: 'center',
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 10,
                    paddingRight: 10,
                    minWidth: 300,
                    minHeight: 100
                 },
                children: [
                    {
                        id: 'label1',
                        type: 'label',
                        text: 'View enhanced with JSX function components.',
                        position: { x: 150, y: 50 }
                    }
                ]
            }
        ]
    };
    modelSource.setModel(graph);
}
