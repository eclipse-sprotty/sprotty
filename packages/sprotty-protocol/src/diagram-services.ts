/********************************************************************************
 * Copyright (c) 2021 TypeFox and others.
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

import { ServerActionHandlerRegistry } from './action-handler';
import { SModelRoot } from './model';
import { JsonMap } from './utils/json';
import { SModelIndex } from './utils/model-utils';

export type DiagramOptions = JsonMap;

/**
 * The current state captured by a `DiagramServer`.
 */
export interface DiagramState {
    options?: DiagramOptions;
    currentRoot: SModelRoot;
    revision: number;
}

/**
 * The set of services required by a `DiagramServer`.
 */
export interface DiagramServices {
    readonly DiagramGenerator: IDiagramGenerator
    readonly ModelLayoutEngine?: IModelLayoutEngine
    readonly ServerActionHandlerRegistry?: ServerActionHandlerRegistry
}

/**
 * A diagram generator is responsible for creating a diagram model from some source.
 * This process is controlled by the `DiagramOptions`, which for example may contain
 * a URI to the source document from which the diagram shall be created.
 */
export interface IDiagramGenerator {
    generate(args: GeneratorArguments): SModelRoot | Promise<SModelRoot>
}

export interface GeneratorArguments {
    options: DiagramOptions
    state: DiagramState
}

/**
 * This service is responsible for the "macro layout" of a model, that is the positioning
 * and sizing of the main structural elements of a model. In a graph, macro layout affects
 * positions of nodes and routings of edges, but not necessarily the layout of labels and
 * compartments inside a node, which are often arranged on the client side ("micro layout").
 */
export interface IModelLayoutEngine {
    layout(model: SModelRoot, index?: SModelIndex): SModelRoot | Promise<SModelRoot>;
}
