/********************************************************************************
 * Copyright (c) 2017-2021 TypeFox and others.
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

import runCircleGraph from "./circlegraph/src/standalone";
import runClassDiagram from "./classdiagram/src/standalone";
import runRandomGraph from "./random-graph/src/standalone";
import runRandomGraphDistributed from "./random-graph-distributed/src/standalone";
import runSvgPreRendered from "./svg/src/standalone";
import runMulticore from "./multicore/src/multicore";
import runFlowchart from "./flowchart/src/standalone";
import runJsxample from "./jsxample/src/standalone";
import runStylingShowcase from "./styling-showcase/src/standalone";
import runMicroLayoutShowcase from "./micro-layout-showcase/src/standalone";
import runCustomViewsShowcase from "./custom-views-showcase/src/standalone";

const appDiv = document.getElementById('sprotty-app');
if (appDiv) {
    const appMode = appDiv.getAttribute('data-app');
    if (appMode === 'circlegraph')
        runCircleGraph();
    else if (appMode === 'class-diagram')
        runClassDiagram();
    else if (appMode === 'random-graph')
        runRandomGraph();
    else if (appMode === 'random-graph-distributed')
        runRandomGraphDistributed();
    else if (appMode === 'svg')
        runSvgPreRendered();
    else if (appMode === 'multicore')
        runMulticore();
    else if (appMode === 'flowchart')
        runFlowchart();
    else if (appMode === 'jsxample')
        runJsxample();
    else if (appMode === 'styling-showcase')
        runStylingShowcase();
    else if (appMode === 'micro-layout-showcase')
        runMicroLayoutShowcase();
    else if (appMode === 'custom-views-showcase')
        runCustomViewsShowcase();
    else
        throw new Error('Dunno what to do :-(');
}
