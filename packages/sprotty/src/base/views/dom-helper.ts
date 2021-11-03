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

import { inject, injectable } from "inversify";
import { ViewerOptions } from "./viewer-options";
import { TYPES } from "../types";
import { SModelElement } from "../model/smodel";

@injectable()
export class DOMHelper {

    @inject(TYPES.ViewerOptions) private viewerOptions: ViewerOptions;

    private getPrefix() {
        const prefix = this.viewerOptions !== undefined && this.viewerOptions.baseDiv !== undefined ?
            this.viewerOptions.baseDiv + "_" : "";
        return prefix;
    }

    createUniqueDOMElementId(element: SModelElement): string {
        return this.getPrefix() + element.id;
    }

    findSModelIdByDOMElement(element: Element): string {
        return element.id.replace(this.getPrefix(), '');
    }

}
