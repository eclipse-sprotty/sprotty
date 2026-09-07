/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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

import { Container } from 'inversify';
import { describe, expect, it } from 'vitest';
import { TYPES } from '../base/types.js';
import edgeIntersectionModule from '../features/edge-intersection/di.config.js';
import edgeJunctionModule from '../features/edge-junction/di.config.js';
import { loadDefaultModules } from './modules.js';

describe('loadDefaultModules', () => {

    const OPT_IN_MESSAGE = 'edgeIntersectionModule and edgeJunctionModule are opt-in by maintainer decision '
        + '(docs/product-specs/edge-routing.md, docs/design-docs/edge-routing.md): applications load them '
        + 'explicitly next to loadDefaultModules. Do not add them to the default module list.';

    it('does not load the opt-in edge route postprocessor modules', () => {
        const container = new Container();
        loadDefaultModules(container);
        expect(container.isBound(TYPES.IEdgeRoutePostprocessor), OPT_IN_MESSAGE).to.equal(false);
    });

    it('binds an edge route postprocessor once the opt-in modules are loaded explicitly', () => {
        // Proves that the observable above tracks the modules, i.e. that the check above can fail.
        const container = new Container();
        loadDefaultModules(container);
        container.load(edgeIntersectionModule, edgeJunctionModule);
        expect(container.isBound(TYPES.IEdgeRoutePostprocessor)).to.equal(true);
    });
});
