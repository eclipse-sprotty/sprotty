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

import 'reflect-metadata';
import 'mocha';
import { expect } from "chai";
import { Container } from 'inversify';
import { TYPES } from '../types';
import { SModelElementSchema, SModelIndex, SChildElement } from './smodel';
import { SModelFactory } from "./smodel-factory";
import { registerModelElement } from './smodel-utils';
import { selectFeature, Selectable } from '../../features/select/model';
import { boundsFeature } from '../../features/bounds/model';
import defaultModule from "../di.config";

describe('model factory', () => {

    class FooElement extends SChildElement implements Selectable {
        static readonly DEFAULT_FEATURES = [selectFeature]
        selected: boolean;
    }

    it('creates a single element from a schema', () => {
        const container = new Container();
        container.load(defaultModule);

        const factory = container.get<SModelFactory>(TYPES.IModelFactory);
        const element = factory.createElement({
            type: 'foo',
            id: 'element1'
        });
        expect(element.id).to.equal('element1');
    });

    it('creates a root element and its chilren from a schema', () => {
        const container = new Container();
        container.load(defaultModule);

        const factory = container.get<SModelFactory>(TYPES.IModelFactory);
        const root = factory.createRoot({
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'element',
                    id: 'element1'
                },
                {
                    type: 'element',
                    id: 'element2',
                    children: [
                        {
                            type: 'element',
                            id: 'element3'
                        }
                    ]
                } as SModelElementSchema
            ]
        });
        const element1 = root.children[0];
        expect(element1.id).to.equal('element1');
        expect(element1.parent.id).to.equal('root');
        const element3 = root.children[1].children[0];
        expect(element3.id).to.equal('element3');
        expect(element3.parent.id).to.equal('element2');
    });

    it('detects duplicate ids and throws an error', () => {
        const container = new Container();
        container.load(defaultModule);

        const factory = container.get<SModelFactory>(TYPES.IModelFactory);
        const test = () => factory.createRoot({
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'element',
                    id: 'element1'
                },
                {
                    type: 'element',
                    id: 'element1',
                }
            ]
        });
        expect(test).to.throw(Error);
    });

    it('does not overwrite reserved properties', () => {
        const container = new Container();
        container.load(defaultModule);

        const factory = container.get<SModelFactory>(TYPES.IModelFactory);
        const root = factory.createRoot({
            type: 'root',
            id: 'root',
            index: 'qwertz',
            children: [
                {
                    type: 'element',
                    id: 'element1',
                    parent: 'foo',
                    children: 'bar',
                    root: 'schnuff'
                }
            ]
        } as any);
        const element1 = root.children[0];
        expect(element1.parent).to.equal(root);
        expect(element1.children).to.deep.equal([]);
        expect(element1.root).to.equal(root);
        expect(root.index).to.be.instanceOf(SModelIndex);
    });

    it('gets default features for registered element', () => {
        const container = new Container();
        container.load(defaultModule);
        registerModelElement(container, 'foo', FooElement);

        const factory = container.get<SModelFactory>(TYPES.IModelFactory);
        const element = factory.createElement({
            type: 'foo',
            id: 'element1'
        });
        expect(Array.from(element.features as any)).to.deep.equal([selectFeature]);
    });

    it('applies custom features for registered element', () => {
        const container = new Container();
        container.load(defaultModule);
        registerModelElement(container, 'foo', FooElement, {
            enable: [boundsFeature],
            disable: [selectFeature]
        });

        const factory = container.get<SModelFactory>(TYPES.IModelFactory);
        const element = factory.createElement({
            type: 'foo',
            id: 'element1'
        });
        expect(Array.from(element.features as any)).to.deep.equal([boundsFeature]);
    });
});
