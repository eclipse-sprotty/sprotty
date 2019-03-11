/********************************************************************************
 * Copyright (c) 2019 TypeFox and others.
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

import { injectable } from "inversify";
import { Action } from "./action";

/**
 * Allows to lock the diagram by preventing certain actions from being
 * dispatched.
 *
 * This could for example be used to prevent the diagram from being modified
 * when the underlying model is broken or the server is unavailable.
 */
export interface IDiagramLocker {
    isAllowed(action: Action): boolean
}

@injectable()
export class DefaultDiagramLocker implements IDiagramLocker {
    isAllowed(action: Action): boolean {
        return true;
    }
}
