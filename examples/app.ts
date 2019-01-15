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

import "reflect-metadata";

import runStandalone from "./circlegraph/src/standalone";
import runClassDiagram from "./classdiagram/src/standalone";
import runMindmap from "./mindmap/src/standalone";
import runSvgPreRendered from "./svg/src/standalone";
import runMulticore from "./multicore/src/multicore";

const appDiv = document.getElementById('sprotty-app')
if(appDiv) {
    const appMode = appDiv.getAttribute('data-app');
    if (appMode === 'circlegraph')
        runStandalone();
    else if (appMode === 'class-diagram')
        runClassDiagram();
    else if (appMode === 'mindmap')
        runMindmap();
    else if (appMode === 'svg')
        runSvgPreRendered();
    else if (appMode === 'multicore')
        runMulticore();
    else
        throw new Error('Dunno what to do :-(');
}
