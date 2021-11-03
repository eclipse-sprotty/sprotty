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
import { Action } from "../actions/action";

/**
 * Action to enable the tools of the specified `toolIds`.
 */
export class EnableToolsAction implements Action {
    static KIND = "enable-tools";
    readonly kind = EnableToolsAction.KIND;
    constructor(public readonly toolIds: string[]) { }
}

/**
 * Action to disable the currently active tools and enable the default tools instead.
 */
export class EnableDefaultToolsAction implements Action {
    static KIND = "enable-default-tools";
    readonly kind = EnableDefaultToolsAction.KIND;
}

/** A tool that can be managed by a `ToolManager`. */
export interface Tool {
    readonly id: string;
    /* Notifies the tool to become active. */
    enable(): void;
    /* Notifies the tool to become inactive. */
    disable(): void;
}
