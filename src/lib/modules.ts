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

import { Container, ContainerModule } from 'inversify';
import defaultModule from '../base/di.config';
import modelSourceModule from '../model-source/di.config';
import boundsModule from '../features/bounds/di.config';
import buttonModule from '../features/button/di.config';
import commandPaletteModule from '../features/command-palette/di.config';
import contextMenuModule from '../features/context-menu/di.config';
import decorationModule from '../features/decoration/di.config';
import edgeLayoutModule from '../features/edge-layout/di.config';
import { edgeEditModule, labelEditModule, labelEditUiModule } from '../features/edit/di.config';
import expandModule from '../features/expand/di.config';
import exportModule from '../features/export/di.config';
import fadeModule from '../features/fade/di.config';
import hoverModule from '../features/hover/di.config';
import moveModule from '../features/move/di.config';
import openModule from '../features/open/di.config';
import routingModule from '../features/routing/di.config';
import selectModule from '../features/select/di.config';
import undoRedoModule from '../features/undo-redo/di.config';
import updateModule from '../features/update/di.config';
import viewportModule from '../features/viewport/di.config';
import zorderModule from '../features/zorder/di.config';

export interface LoadModuleOptions {
    exclude?: ContainerModule[]
}

/**
 * Load the default set of container modules provided by Sprotty.
 */
export function loadDefaultModules(container: Container, options?: LoadModuleOptions) {
    const modules = [
        defaultModule, modelSourceModule, boundsModule, buttonModule,
        commandPaletteModule, contextMenuModule, decorationModule, edgeEditModule,
        edgeLayoutModule, expandModule, exportModule, fadeModule,
        hoverModule, labelEditModule, labelEditUiModule, moveModule,
        openModule, routingModule, selectModule, undoRedoModule,
        updateModule, viewportModule, zorderModule
    ];
    if (options && options.exclude) {
        for (const mod of options.exclude) {
            const index = modules.indexOf(mod);
            if (index >= 0)
                modules.splice(index, 1);
        }
    }
    container.load(...modules);
}
