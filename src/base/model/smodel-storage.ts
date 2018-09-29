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
import { TYPES } from '../types';
import { ViewerOptions } from "../views/viewer-options";
import { SModelRootSchema } from './smodel';
import { EMPTY_ROOT } from './smodel-factory';

@injectable()
export class SModelStorage {

    @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;

    protected localCache: Map<string, string> = new Map;

    store(root: SModelRootSchema) {
        if (this.isLocalStorageAvailable())
            localStorage.setItem(this.key, JSON.stringify(root));
        else
            this.localCache.set(this.key, JSON.stringify(root));
    }

    load(): SModelRootSchema  {
        const schema = (this.isLocalStorageAvailable())
            ? localStorage.getItem(this.key)
            : this.localCache.get(this.key);
        if (schema)
            return JSON.parse(schema) as SModelRootSchema;
        else
            return EMPTY_ROOT;
    }

    protected isLocalStorageAvailable(): boolean {
        try {
            return typeof localStorage === 'object' && localStorage !== null;
        } catch (e) {
            return false;
        }
    }

    protected get key(): string {
        return this.viewerOptions.baseDiv;
    }
}

