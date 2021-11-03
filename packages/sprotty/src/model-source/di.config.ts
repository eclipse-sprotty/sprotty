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

import { ContainerModule } from "inversify";
import { configureCommand } from "../base/commands/command-registration";
import { TYPES } from "../base/types";
import { CommitModelCommand } from "./commit-model";
import { ComputedBoundsApplicator, ModelSource } from "./model-source";

/**
 * This container module does NOT provide any binding for TYPES.ModelSource because that needs to be
 * done according to the needs of the application. You can choose between a local (LocalModelSource)
 * and a remote (e.g. WebSocketDiagramServer) implementation.
 */
const modelSourceModule = new ContainerModule((bind, _unbind, isBound) => {
    bind(TYPES.ModelSourceProvider).toProvider<ModelSource>((context) => {
        return () => {
            return new Promise<ModelSource>((resolve) => {
                resolve(context.container.get<ModelSource>(TYPES.ModelSource));
            });
        };
    });
    configureCommand({bind, isBound}, CommitModelCommand);
    bind(TYPES.IActionHandlerInitializer).toService(TYPES.ModelSource);
    bind(ComputedBoundsApplicator).toSelf().inSingletonScope();
});

export default modelSourceModule;
