/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { SModelElement } from "../../base/model/smodel";
import { SModelExtension } from "../../base/model/smodel-extension";

export const nameFeature = Symbol('nameableFeature');

export interface Nameable extends SModelExtension {
    name: string
}

export function isNameable(element: SModelElement): element is SModelElement & Nameable {
    return element.hasFeature(nameFeature);
}

export function name(element: SModelElement): string|undefined {
    if (isNameable(element)) {
        return element.name;
    } else {
        return undefined;
    }
}
