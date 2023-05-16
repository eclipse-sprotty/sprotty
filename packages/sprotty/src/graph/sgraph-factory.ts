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

import { injectable } from "inversify";
import {
    SCompartment as SCompartmentSchema, SEdge as SEdgeSchema, SGraph as SGraphSchema, SLabel as SLabelSchema,
    SModelElement as SModelElementSchema, SModelRoot as SModelRootSchema, SNode as SNodeSchema, SPort as SPortSchema
} from 'sprotty-protocol/lib/model';
import { getBasicType } from 'sprotty-protocol/lib/utils/model-utils';
import { SModelFactory, createFeatureSet } from "../base/model/smodel-factory";
import { SChildElementImpl, SModelRootImpl, SParentElementImpl } from "../base/model/smodel";
import { SCompartmentImpl, SEdgeImpl, SGraphImpl, SLabelImpl, SNodeImpl, SPortImpl } from "./sgraph";
import { SButtonImpl, SButtonSchema } from '../features/button/model';

/**
 * @deprecated
 * Subclassing SModelFactory is discouraged. Use `registerModelElement`
 * or `configureModelElement` instead.
 */
@injectable()
export class SGraphFactory extends SModelFactory {

    protected readonly defaultGraphFeatures = createFeatureSet(SGraphImpl.DEFAULT_FEATURES);
    protected readonly defaultNodeFeatures = createFeatureSet(SNodeImpl.DEFAULT_FEATURES);
    protected readonly defaultPortFeatures = createFeatureSet(SPortImpl.DEFAULT_FEATURES);
    protected readonly defaultEdgeFeatures = createFeatureSet(SEdgeImpl.DEFAULT_FEATURES);
    protected readonly defaultLabelFeatures = createFeatureSet(SLabelImpl.DEFAULT_FEATURES);
    protected readonly defaultCompartmentFeatures = createFeatureSet(SCompartmentImpl.DEFAULT_FEATURES);
    protected readonly defaultButtonFeatures = createFeatureSet(SButtonImpl.DEFAULT_FEATURES);

    override createElement(schema: SModelElementSchema, parent?: SParentElementImpl): SChildElementImpl {
        let child: SChildElementImpl;
        if (this.registry.hasKey(schema.type)) {
            const regElement = this.registry.get(schema.type, undefined);
            if (!(regElement instanceof SChildElementImpl))
                throw new Error(`Element with type ${schema.type} was expected to be an SChildElement.`);
            child = regElement;
        } else if (this.isNodeSchema(schema)) {
            child = new SNodeImpl();
            child.features = this.defaultNodeFeatures;
        } else if (this.isPortSchema(schema)) {
            child = new SPortImpl();
            child.features = this.defaultPortFeatures;
        } else if (this.isEdgeSchema(schema)) {
            child = new SEdgeImpl();
            child.features = this.defaultEdgeFeatures;
        } else if (this.isLabelSchema(schema)) {
            child = new SLabelImpl();
            child.features = this.defaultLabelFeatures;
        } else if (this.isCompartmentSchema(schema)) {
            child = new SCompartmentImpl();
            child.features = this.defaultCompartmentFeatures;
        } else if (this.isButtonSchema(schema)) {
            child = new SButtonImpl();
            child.features = this.defaultButtonFeatures;
        } else {
            child = new SChildElementImpl();
        }
        return this.initializeChild(child, schema, parent);
    }

    override createRoot(schema: SModelRootSchema): SModelRootImpl {
        let root: SModelRootImpl;
        if (this.registry.hasKey(schema.type)) {
            const regElement = this.registry.get(schema.type, undefined);
            if (!(regElement instanceof SModelRootImpl))
                throw new Error(`Element with type ${schema.type} was expected to be an SModelRoot.`);
            root = regElement;
        } else if (this.isGraphSchema(schema)) {
            root = new SGraphImpl();
            root.features = this.defaultGraphFeatures;
        } else {
            root = new SModelRootImpl();
        }
        return this.initializeRoot(root, schema);
    }

    isGraphSchema(schema: SModelElementSchema): schema is SGraphSchema {
        return getBasicType(schema) === 'graph';
    }

    isNodeSchema(schema: SModelElementSchema): schema is SNodeSchema {
        return getBasicType(schema) === 'node';
    }

    isPortSchema(schema: SModelElementSchema): schema is SPortSchema {
        return getBasicType(schema) === 'port';
    }

    isEdgeSchema(schema: SModelElementSchema): schema is SEdgeSchema {
        return getBasicType(schema) === 'edge';
    }

    isLabelSchema(schema: SModelElementSchema): schema is SLabelSchema {
        return getBasicType(schema) === 'label';
    }

    isCompartmentSchema(schema: SModelElementSchema): schema is SCompartmentSchema {
        return getBasicType(schema) === 'comp';
    }

    isButtonSchema(schema: SModelElementSchema): schema is SButtonSchema {
        return getBasicType(schema) === 'button';
    }
}
