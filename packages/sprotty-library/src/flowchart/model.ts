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

import { SNode } from "sprotty-protocol";

export interface Terminal extends SNode {
    type: 'node:terminal'
}

export interface Process extends SNode {
    type: 'node:process'
}

export interface Decision extends SNode {
    type: 'node:decision'
}

export interface Input extends SNode {
    type: 'node:input'
}

export interface Output extends SNode {
    type: 'node:output'
}

export interface Comment extends SNode {
    type: 'node:comment'
}

export interface PredefinedProcess extends SNode {
    type: 'node:predefined-process'
}

export interface OnPageConnector extends SNode {
    type: 'node:on-page-connector'
}

export interface OffPageConnector extends SNode {
    type: 'node:off-page-connector'
}

export interface Delay extends SNode {
    type: 'node:delay'
}

export interface AlternateProcess extends SNode {
    type: 'node:alternate-process'
}

export interface Data extends SNode {
    type: 'node:data'
}

export interface Document extends SNode {
    type: 'node:document'
}

export interface MultiDocument extends SNode {
    type: 'node:multi-document'
}

export interface Preparation extends SNode {
    type: 'node:preparation'
}

export interface Display extends SNode {
    type: 'node:display'
}

export interface ManualInput extends SNode {
    type: 'node:manual-input'
}

export interface ManualOperation extends SNode {
    type: 'node:manual-operation'
}

export interface Database extends SNode {
    type: 'node:database'
}
