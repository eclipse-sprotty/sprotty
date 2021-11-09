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

import { injectable, inject } from "inversify";
import {
    TYPES, IModelFactory, IPopupModelProvider
} from 'sprotty';
import { PreRenderedElement, RequestPopupModelAction, SModelElement, SModelRoot } from "sprotty-protocol";
import { ClassNode } from "./model";

@injectable()
export class PopupModelProvider implements IPopupModelProvider {

    @inject(TYPES.IModelFactory) modelFactory: IModelFactory;

    getPopupModel(request: RequestPopupModelAction, element?: SModelElement): SModelRoot | undefined {
        if (element !== undefined && element.type === 'node:class') {
            const node = this.modelFactory.createElement(element) as ClassNode;
            return {
                type: 'html',
                id: 'popup',
                children: [
                    <PreRenderedElement> {
                        type: 'pre-rendered',
                        id: 'popup-title',
                        code: `<div class="sprotty-popup-title"><span class="fa fa-info-circle"/> Class ${node.name}</div>`
                    },
                    <PreRenderedElement> {
                        type: 'pre-rendered',
                        id: 'popup-body',
                        code: '<div class="sprotty-popup-body">But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.</div>'
                    }
                ]
            };
        }
        return undefined;
    }

}
