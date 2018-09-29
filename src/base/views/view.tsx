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
import { svg } from 'snabbdom-jsx';

import { injectable, multiInject, optional, interfaces } from "inversify";
import { VNode } from "snabbdom/vnode";
import { TYPES } from "../types";
import { SModelElement, SModelRoot, SParentElement } from "../model/smodel";
import { EMPTY_ROOT, SModelElementRegistration } from "../model/smodel-factory";
import { ProviderRegistry } from "../../utils/registry";
import { Point, ORIGIN_POINT } from "../../utils/geometry";

/**
 * Base interface for the components that turn GModelElements into virtual DOM elements.
 */
export interface IView {
    render(model: Readonly<SModelElement>, context: RenderingContext, args?: object): VNode
}

/**
 * Bundles additional data that is passed to views for VNode creation.
 */
export interface RenderingContext {
    viewRegistry: ViewRegistry

    decorate(vnode: VNode, element: Readonly<SModelElement>): VNode

    renderElement(element: Readonly<SModelElement>, args?: object): VNode

    renderChildren(element: Readonly<SParentElement>, args?: object): VNode[]
}

/**
 * Used to bind a model element type to a view constructor in the ViewRegistry.
 */
export interface ViewRegistration {
    type: string
    constr: new () => IView
}

/**
 * Allows to look up the IView for a given SModelElement based on its type.
 */
@injectable()
export class ViewRegistry extends ProviderRegistry<IView, void> {
    constructor(@multiInject(TYPES.ViewRegistration) @optional() registrations: ViewRegistration[]) {
        super();

        this.registerDefaults();
        registrations.forEach(
            registration => this.register(registration.type, registration.constr)
        );
    }

    protected registerDefaults() {
        this.register(EMPTY_ROOT.type, EmptyView);
    }

    missing(key: string): IView {
        return new MissingView();
    }
}

/**
 * Utility function to register model and view constructors for a model element type.
 */
export function configureModelElement(context: { bind: interfaces.Bind }, type: string,
        modelConstr: new () => SModelElement, viewConstr: new () => IView): void {
    context.bind<SModelElementRegistration>(TYPES.SModelElementRegistration).toConstantValue({
        type,
        constr: modelConstr
    });
    context.bind<ViewRegistration>(TYPES.ViewRegistration).toConstantValue({
        type,
        constr: viewConstr
    });
}

/**
 * This view is used when the model is the EMPTY_ROOT.
 */
export class EmptyView implements IView {
    render(model: SModelRoot, context: RenderingContext): VNode {
        return <svg class-sprotty-empty={true} />;
    }
}

/**
 * This view is used when no view has been registered for a model element type.
 */
export class MissingView implements IView {
    render(model: Readonly<SModelElement>, context: RenderingContext): VNode {
        const position: Point = (model as any).position || ORIGIN_POINT;
        return <text class-sprotty-missing={true} x={position.x} y={position.y}>?{model.id}?</text>;
    }
}
