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
import defaultModule from '../base/di.config.js';
import modelSourceModule from '../model-source/di.config.js';
import boundsModule from '../features/bounds/di.config.js';
import buttonModule from '../features/button/di.config.js';
import commandPaletteModule from '../features/command-palette/di.config.js';
import contextMenuModule from '../features/context-menu/di.config.js';
import decorationModule from '../features/decoration/di.config.js';
import edgeLayoutModule from '../features/edge-layout/di.config.js';
import { edgeEditModule, labelEditModule, labelEditUiModule } from '../features/edit/di.config.js';
import expandModule from '../features/expand/di.config.js';
import exportModule from '../features/export/di.config.js';
import fadeModule from '../features/fade/di.config.js';
import hoverModule from '../features/hover/di.config.js';
import moveModule from '../features/move/di.config.js';
import openModule from '../features/open/di.config.js';
import routingModule from '../features/routing/di.config.js';
import selectModule from '../features/select/di.config.js';
import undoRedoModule from '../features/undo-redo/di.config.js';
import updateModule from '../features/update/di.config.js';
import viewportModule from '../features/viewport/di.config.js';
import zorderModule from '../features/zorder/di.config.js';

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
