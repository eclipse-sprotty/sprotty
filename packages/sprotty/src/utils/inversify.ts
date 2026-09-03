/********************************************************************************
 * Copyright (c) 2019-2021 TypeFox and others.
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

import { Bind, IsBound, ServiceIdentifier } from "inversify";

/**
 * Bind `constr` to itself unless it is already bound, translating InversifyJS' binding failure into
 * a message that names the sprotty concept and the decorators it expects. Service identifiers that
 * are not constructors are left alone, as are constructors that are already bound.
 *
 * InversifyJS only rejects a missing `@injectable()` when the constructor takes arguments; a class
 * whose dependencies are all injected into properties binds without complaint and resolves them to
 * `undefined`. There is no public API to detect that case.
 */
export function bindInjectable(context: { bind: Bind, isBound: IsBound },
        constr: ServiceIdentifier<unknown>, role: string): void {
    if (typeof constr !== 'function' || context.isBound(constr)) {
        return;
    }
    try {
        context.bind(constr).toSelf();
    } catch (error) {
        throw new Error(
            `${role} must be decorated with @injectable(): ${constr.name}. `
            + 'InversifyJS does not inherit injection metadata, so a subclass needs its own '
            + '@injectable() and @injectFromBase({ extendConstructorArguments: true, extendProperties: true }).',
            { cause: error });
    }
}
