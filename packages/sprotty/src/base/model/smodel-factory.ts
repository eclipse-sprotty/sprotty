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

import { injectable, multiInject, optional, inject } from 'inversify';
import { SModelElement, SModelRoot } from 'sprotty-protocol/lib/model';
import { TYPES } from "../types";
import { FactoryRegistry } from '../../utils/registry';
import { SChildElementImpl, SModelElementImpl, SModelRootImpl, SParentElementImpl, isParent, FeatureSet } from './smodel';

/**
 * Model element classes registered here are considered automatically when constructring a model from its schema.
 */
@injectable()
export class SModelRegistry extends FactoryRegistry<SModelElementImpl, void> {
    constructor(@multiInject(TYPES.SModelElementRegistration) @optional() registrations: SModelElementRegistration[]) {
        super();

        registrations.forEach(registration => {
            let defaultFeatures = this.getDefaultFeatures(registration.constr);
            if (!defaultFeatures && registration.features && registration.features.enable)
                defaultFeatures = [];
            if (defaultFeatures) {
                const featureSet = createFeatureSet(defaultFeatures, registration.features);
                this.register(registration.type, () => {
                    const element = new registration.constr();
                    element.features = featureSet;
                    return element;
                });
            } else {
                this.register(registration.type, () => new registration.constr());
            }
        });
    }

    protected getDefaultFeatures(constr: SModelElementConstructor): ReadonlyArray<symbol> | undefined {
        let obj = constr;
        do {
            const defaultFeatures = obj.DEFAULT_FEATURES;
            if (defaultFeatures)
                return defaultFeatures;
            obj = Object.getPrototypeOf(obj);
        } while (obj);
        return undefined;
    }
}

/**
 * A model factory transforms a serializable model schema into the model representation that is used
 * internally by sprotty.
 */
export interface IModelFactory {
    createElement(schema: SModelElement | SModelElementImpl, parent?: SParentElementImpl): SChildElementImpl

    createRoot(schema: SModelRoot | SModelRootImpl): SModelRootImpl

    createSchema(element: SModelElementImpl): SModelElement
}

/**
 * The default model factory creates SModelRoot for the root element and SChildElement for all other
 * model elements.
 */
@injectable()
export class SModelFactory implements IModelFactory {

    @inject(TYPES.SModelRegistry) protected readonly registry: SModelRegistry;

    createElement(schema: SModelElement | SModelElementImpl, parent?: SParentElementImpl): SChildElementImpl {
        let child: SChildElementImpl;
        if (this.registry.hasKey(schema.type)) {
            const regElement = this.registry.get(schema.type, undefined);
            if (!(regElement instanceof SChildElementImpl))
                throw new Error(`Element with type ${schema.type} was expected to be an SChildElement.`);
            child = regElement;
        } else {
            child = new SChildElementImpl();
        }
        return this.initializeChild(child, schema, parent);
    }

    createRoot(schema: SModelRoot | SModelRootImpl): SModelRootImpl {
        let root: SModelRootImpl;
        if (this.registry.hasKey(schema.type)) {
            const regElement = this.registry.get(schema.type, undefined);
            if (!(regElement instanceof SModelRootImpl))
                throw new Error(`Element with type ${schema.type} was expected to be an SModelRoot.`);
            root = regElement;
        } else {
            root = new SModelRootImpl();
        }
        return this.initializeRoot(root, schema);
    }

    createSchema(element: SModelElementImpl): SModelElement {
        const schema = {};
        for (const key in element) {
             if (!this.isReserved(element, key)) {
                const value: any = (element as any)[key];
                if (typeof value !== 'function')
                    (schema as any)[key] = value;
            }
        }
        if (element instanceof SParentElementImpl)
            (schema as any)['children'] = element.children.map(child => this.createSchema(child));
        return schema as SModelElement;
    }

    protected initializeElement(element: SModelElementImpl, schema: SModelElement | SModelElementImpl): SModelElementImpl {
        for (const key in schema) {
            if (!this.isReserved(element, key)) {
                const value: any = (schema as any)[key];
                if (typeof value !== 'function')
                    (element as any)[key] = value;
            }
        }
        return element;
    }

    protected isReserved(element: SModelElementImpl, propertyName: string) {
        if (['children', 'parent', 'index'].indexOf(propertyName) >= 0)
            return true;
        let obj = element;
        do {
            const descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
            if (descriptor !== undefined)
                return descriptor.get !== undefined;
            obj = Object.getPrototypeOf(obj);
        } while (obj);
        return false;
    }

    protected initializeParent(parent: SParentElementImpl, schema: SModelElement | SParentElementImpl): SParentElementImpl {
        this.initializeElement(parent, schema);
        if (isParent(schema)) {
            (parent as any).children = schema.children.map(childSchema => this.createElement(childSchema, parent));
        }
        return parent;
    }

    protected initializeChild(child: SChildElementImpl, schema: SModelElement, parent?: SParentElementImpl): SChildElementImpl {
        this.initializeParent(child, schema);
        if (parent !== undefined) {
            (child as any).parent = parent;
        }
        return child;
    }

    protected initializeRoot(root: SModelRootImpl, schema: SModelRoot | SModelRootImpl): SModelRootImpl {
        this.initializeParent(root, schema);
        root.index.add(root);
        return root;
    }
}

export const EMPTY_ROOT: Readonly<SModelRoot> = Object.freeze({
    type: 'NONE',
    id: 'EMPTY'
});

/**
 * Used to bind a model element type to a class constructor in the SModelRegistry.
 */
export interface SModelElementRegistration {
    type: string
    constr: SModelElementConstructor
    features?: CustomFeatures
}

export interface SModelElementConstructor {
    DEFAULT_FEATURES?: ReadonlyArray<symbol>
    new (): SModelElementImpl
}

export interface CustomFeatures {
    enable?: symbol[]
    disable?: symbol[]
}

export function createFeatureSet(defaults: ReadonlyArray<symbol>, custom?: CustomFeatures): FeatureSet {
    const featureSet = new Set<symbol>(defaults);
    if (custom && custom.enable) {
        for (const f of custom.enable) {
            featureSet.add(f);
        }
    }
    if (custom && custom.disable) {
        for (const f of custom.disable) {
            featureSet.delete(f);
        }
    }
    return featureSet;
}
