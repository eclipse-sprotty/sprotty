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

import { Action } from "sprotty-protocol/lib/actions";

/**
 * Action to enable the tools of the specified `toolIds`.
 * @deprecated `deprecated since 0.14.0 - the Tool/Toolmanager API is no longer supported
 */
export interface EnableToolsAction extends Action {
    kind: typeof EnableToolsAction.KIND
    toolIds: string[]
}
export namespace EnableToolsAction {
    export const KIND = "enable-tools";

    export function create(toolIds: string[]): EnableToolsAction {
        return {
            kind: KIND,
            toolIds
        };
    }
}

/**
 * Action to disable the currently active tools and enable the default tools instead.
 * @deprecated `deprecated since 0.14.0 - the Tool/Toolmanager API is no longer supported
 */
export interface EnableDefaultToolsAction extends Action {
    kind: typeof EnableDefaultToolsAction.KIND;
}
export namespace EnableDefaultToolsAction {
    export const KIND = "enable-default-tools";

    export function create(): EnableDefaultToolsAction {
        return {
            kind: KIND
        };
    }
}

/** A tool that can be managed by a `ToolManager`.
 * @deprecated `deprecated since 0.14.0 - the Tool/Toolmanager API is no longer supported
 */
export interface Tool {
    readonly id: string;
    /* Notifies the tool to become active. */
    enable(): void;
    /* Notifies the tool to become inactive. */
    disable(): void;
}
