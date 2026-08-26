/********************************************************************************
 * Copyright (c) 2018-2021 TypeFox and others.
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

import { ContainerModule, decorate, injectable } from 'inversify';
import {
    ElkLayoutEngine as ElkLayoutEnginePlain, DefaultElementFilter as DefaultElementFilterPlain,
    DefaultLayoutConfigurator as DefaultLayoutConfiguratorPlain, ElkFactory as ElkFactoryPlain,
    IElementFilter as IElementFilterPlain, ILayoutConfigurator as ILayoutConfiguratorPlain,
    ILayoutPreprocessor as ILayoutPreprocessorPlain, ILayoutPostprocessor as ILayoutPostprocessorPlain
} from './elk-layout.js';

decorate(injectable(), ElkLayoutEnginePlain);
export const ElkLayoutEngine = ElkLayoutEnginePlain;

export type ElkFactory = ElkFactoryPlain;
export const ElkFactory = Symbol('ElkFactory');

export type IElementFilter = IElementFilterPlain;
export const IElementFilter = Symbol('IElementFilter');
decorate(injectable(), DefaultElementFilterPlain);
export const DefaultElementFilter = DefaultElementFilterPlain;

export type ILayoutConfigurator = ILayoutConfiguratorPlain;
export const ILayoutConfigurator = Symbol('ILayoutConfigurator');
decorate(injectable(), DefaultLayoutConfiguratorPlain);
export const DefaultLayoutConfigurator = DefaultLayoutConfiguratorPlain;

export type ILayoutPreprocessor = ILayoutPreprocessorPlain;
export const ILayoutPreprocessor = Symbol('ILayoutPreprocessor');

export type ILayoutPostprocessor = ILayoutPostprocessorPlain;
export const ILayoutPostprocessor = Symbol('ILayoutPostprocessor');

/**
 * This dependency injection module adds the default bindings for the frontend integration of ELK.
 * **Note:** Since this package has no direct dependency to the `sprotty` frontend package,
 * this module does not include a binding for `TYPES.IModelLayoutEngine`. Add it like this:
 * ```
 * bind(TYPES.IModelLayoutEngine).toService(ElkLayoutEngine);
 * ```
 * Furthermore, you need to add a binding for `ElkFactory` and choose between the bundled or the
 * webworker variant of `elkjs`:
 * ```
 * const elkFactory: ElkFactory = () => new ElkConstructor({ ... }); // See elkjs documentation
 * bind(ElkFactory).toConstantValue(elkFactory);
 * ```
 * You can import `ElkConstructor` from `'elkjs/lib/elk.bundled'` for the bundled variant or
 * `'elkjs/lib/elk-api'` for the webworker variant.
 */
export const elkLayoutModule = new ContainerModule(({bind}) => {
    bind(ElkLayoutEngine).toDynamicValue(context => {
        const elkFactory = context.get<ElkFactory>(ElkFactory);
        const elementFilter = context.get<IElementFilter>(IElementFilter);
        const layoutConfigurator = context.get<ILayoutConfigurator>(ILayoutConfigurator);
        const layoutPreprocessor = context.get<ILayoutPreprocessor>(ILayoutPreprocessor, {optional: true});
        const layoutPostprocessor = context.get<ILayoutPostprocessor>(ILayoutPostprocessor, {optional: true});
        return new ElkLayoutEngine(elkFactory, elementFilter, layoutConfigurator, layoutPreprocessor, layoutPostprocessor);
    }).inSingletonScope();
    bind(IElementFilter).to(DefaultElementFilter);
    bind(ILayoutConfigurator).to(DefaultLayoutConfigurator);
});
