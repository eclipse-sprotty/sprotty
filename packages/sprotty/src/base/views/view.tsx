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

/** @jsx svg */
import { svg } from '../../lib/jsx';

import { injectable, multiInject, optional, interfaces } from 'inversify';
import { VNode } from 'snabbdom';
import { TYPES } from '../types';
import { InstanceRegistry } from '../../utils/registry';
import { isInjectable } from '../../utils/inversify';
import { SModelElementImpl, SModelRootImpl, SParentElementImpl } from '../model/smodel';
import { EMPTY_ROOT, CustomFeatures } from '../model/smodel-factory';
import { registerModelElement } from '../model/smodel-utils';
import { Point } from 'sprotty-protocol';

/**
 * Arguments for `IView` rendering.
 */
export interface IViewArgs {
    parentArgs?: IViewArgs;
    [key: string]: any;
}

/**
 * Searches for the property specified in `key` in the specified `args`,
 * including its direct or indirect `IRenderingArgs#parentArgs`.
 *
 * @param arg the rendering arguments.
 * @param key the key to search for.
 * @returns the found value or `undefined.
 */
export function findArgValue<T>(arg: IViewArgs | undefined, key: string): T | undefined {
    while (arg !== undefined && !(key in arg) && arg.parentArgs) {
        arg = arg.parentArgs;
    }
    return arg ? arg[key] : undefined;
}

/**
 * Base interface for the components that turn GModelElements into virtual DOM elements.
 */
export interface IView<A extends IViewArgs = {}> {
    render(model: Readonly<SModelElementImpl>, context: RenderingContext, args?: A): VNode | undefined
}

/**
 * Indicates the target of the view rendering. `main` is the actually visible diagram,
 * `popup` is the mouse hover popup, and `hidden` is for computing element bounds prior
 * to the main rendering.
 */
export type RenderingTargetKind = 'main' | 'popup' | 'hidden';

/**
 * Bundles additional data that is passed to views for VNode creation.
 */
export interface RenderingContext {
    readonly viewRegistry: ViewRegistry
    readonly targetKind: RenderingTargetKind;
    readonly parentArgs?: IViewArgs;

    decorate(vnode: VNode, element: Readonly<SModelElementImpl>): VNode

    renderElement(element: Readonly<SModelElementImpl>): VNode | undefined

    renderChildren(element: Readonly<SParentElementImpl>, args?: IViewArgs): VNode[]
}

/**
 * Used to bind a model element type to a view factory in the ViewRegistry.
 */
export interface ViewRegistration {
    type: string
    factory: () => IView
}

export type ViewRegistrationFactory = () => ViewRegistration;

/**
 * Allows to look up the IView for a given SModelElement based on its type.
 */
@injectable()
export class ViewRegistry extends InstanceRegistry<IView> {
    constructor(@multiInject(TYPES.ViewRegistration) @optional() registrations: ViewRegistration[]) {
        super();
        this.registerDefaults();
        registrations.forEach(registration =>
            this.register(registration.type, registration.factory())
        );
    }

    protected registerDefaults() {
        this.register(EMPTY_ROOT.type, new EmptyView());
    }

    override missing(key: string): IView {
        return new MissingView();
    }
}

/**
 * Combines `registerModelElement` and `configureView`.
 */
export function configureModelElement(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
        type: string, modelConstr: new () => SModelElementImpl, viewConstr: interfaces.ServiceIdentifier<IView>,
        features?: CustomFeatures): void {
    registerModelElement(context, type, modelConstr, features);
    configureView(context, type, viewConstr);
}

/**
 * Utility function to register a view for a model element type.
 */
export function configureView(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
        type: string, constr: interfaces.ServiceIdentifier<IView>): void {
    if (typeof constr === 'function') {
        if (!isInjectable(constr)) {
            throw new Error(`Views should be @injectable: ${constr.name}`);
        }
        if (!context.isBound(constr)) {
            context.bind(constr).toSelf();
        }
    }
    context.bind(TYPES.ViewRegistration).toDynamicValue(ctx => ({
        type,
        factory: () => ctx.container.get(constr)
    }));
}

/**
 * This view is used when the model is the EMPTY_ROOT.
 */
@injectable()
export class EmptyView implements IView {
    render(model: SModelRootImpl, context: RenderingContext): VNode {
        return <svg class-sprotty-empty={true} />;
    }
}

/**
 * This view is used when no view has been registered for a model element type.
 */
@injectable()
export class MissingView implements IView {
    render(model: Readonly<SModelElementImpl>, context: RenderingContext): VNode {
        const position: Point = (model as any).position || Point.ORIGIN;
        return <text class-sprotty-missing={true} x={position.x} y={position.y}>?{model.id}?</text>;
    }
}
