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
import { SModelFactory, createFeatureSet } from "../base/model/smodel-factory";
import {
    SChildElement, SModelElementSchema, SModelRoot, SModelRootSchema, SParentElement
} from "../base/model/smodel";
import { getBasicType } from "../base/model/smodel-utils";
import {
    SCompartment, SEdge, SEdgeSchema, SGraph, SGraphSchema, SLabel, SLabelSchema, SNode,
    SNodeSchema, SPortSchema, SPort, SCompartmentSchema
} from "./sgraph";
import { SButton, SButtonSchema } from '../features/button/model';

/**
 * @deprecated
 * Subclassing SModelFactory is discouraged. Use `registerModelElement`
 * or `configureModelElement` instead.
 */
@injectable()
export class SGraphFactory extends SModelFactory {

    protected readonly defaultGraphFeatures = createFeatureSet(SGraph.DEFAULT_FEATURES);
    protected readonly defaultNodeFeatures = createFeatureSet(SNode.DEFAULT_FEATURES);
    protected readonly defaultPortFeatures = createFeatureSet(SPort.DEFAULT_FEATURES);
    protected readonly defaultEdgeFeatures = createFeatureSet(SEdge.DEFAULT_FEATURES);
    protected readonly defaultLabelFeatures = createFeatureSet(SLabel.DEFAULT_FEATURES);
    protected readonly defaultCompartmentFeatures = createFeatureSet(SCompartment.DEFAULT_FEATURES);
    protected readonly defaultButtonFeatures = createFeatureSet(SButton.DEFAULT_FEATURES);

    createElement(schema: SModelElementSchema, parent?: SParentElement): SChildElement {
        let child: SChildElement;
        if (this.registry.hasKey(schema.type)) {
            const regElement = this.registry.get(schema.type, undefined);
            if (!(regElement instanceof SChildElement))
                throw new Error(`Element with type ${schema.type} was expected to be an SChildElement.`);
            child = regElement;
        } else if (this.isNodeSchema(schema)) {
            child = new SNode();
            child.features = this.defaultNodeFeatures;
        } else if (this.isPortSchema(schema)) {
            child = new SPort();
            child.features = this.defaultPortFeatures;
        } else if (this.isEdgeSchema(schema)) {
            child = new SEdge();
            child.features = this.defaultEdgeFeatures;
        } else if (this.isLabelSchema(schema)) {
            child = new SLabel();
            child.features = this.defaultLabelFeatures;
        } else if (this.isCompartmentSchema(schema)) {
            child = new SCompartment();
            child.features = this.defaultCompartmentFeatures;
        } else if (this.isButtonSchema(schema)) {
            child = new SButton();
            child.features = this.defaultButtonFeatures;
        } else {
            child = new SChildElement();
        }
        return this.initializeChild(child, schema, parent);
    }

    createRoot(schema: SModelRootSchema): SModelRoot {
        let root: SModelRoot;
        if (this.registry.hasKey(schema.type)) {
            const regElement = this.registry.get(schema.type, undefined);
            if (!(regElement instanceof SModelRoot))
                throw new Error(`Element with type ${schema.type} was expected to be an SModelRoot.`);
            root = regElement;
        } else if (this.isGraphSchema(schema)) {
            root = new SGraph();
            root.features = this.defaultGraphFeatures;
        } else {
            root = new SModelRoot();
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
