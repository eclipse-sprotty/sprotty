/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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

import "mocha";
import { expect } from "chai";
import { SModelRoot } from './model';
import { SModelIndex } from './utils/model-utils';

describe('SModelIndex', () => {
    it('returns the parent element for an external model', () => {
        const index = new SModelIndex();
        const root: SModelRoot = {
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'parent',
                    children: [
                        {
                            type: 'node',
                            id: 'child'
                        }
                    ]
                }
            ]
        };
        index.add(root);
        expect(index.getParent('child')!.id).to.equal('parent');
    });

    it('returns the root element for an external model', () => {
        const index = new SModelIndex();
        const root: SModelRoot = {
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'parent',
                    children: [
                        {
                            type: 'node',
                            id: 'child'
                        }
                    ]
                }
            ]
        };
        index.add(root);
        const child = root.children![0].children![0];
        expect(index.getRoot(child).id).to.equal('root');
    });
});
