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
import { expect, describe, it } from 'vitest';
import { SModelElementImpl, SParentElementImpl } from '../../base/model/smodel';
import { createFeatureSet } from '../../base/model/smodel-factory';
import { SNodeImpl, SLabelImpl } from '../../graph/sgraph';
import { StatefulLayouter, LayoutRegistry } from './layout';
import { BoundsData } from './hidden-bounds-updater';
import { ConsoleLogger } from '../../utils/logging';
import { Container } from 'inversify';
import boundsModule from './di.config';
import { TYPES } from '../../base/types';
import defaultModule from '../../base/di.config';
import { Dimension } from 'sprotty-protocol';

describe('VBoxLayouter', () => {

    const log = new ConsoleLogger();

    const map = new Map<SModelElementImpl, BoundsData>();

    function snode(size: Dimension): SNodeImpl {
        const node = new SNodeImpl();
        node.features = createFeatureSet(SNodeImpl.DEFAULT_FEATURES);
        node.bounds = {
            x: 0, y: 0, width: size.width, height: size.height
        };
        return node;
    }

    function slabel(size: Dimension): SLabelImpl {
        const label = new SLabelImpl();
        label.features = createFeatureSet(SLabelImpl.DEFAULT_FEATURES);
        label.bounds = {
            x: 0, y: 0, width: size.width, height: size.height
        };
        return label;
    }

    function createModel(): SNodeImpl {
        const model = snode(Dimension.EMPTY);
        model.children = [
            slabel({ width: 1, height: 2 }),
            slabel({ width: 2, height: 1 }),
            slabel({ width: 3, height: 3 })
        ];
        model.layout = 'vbox';
        return model;
    }

    function addToMap(element: SModelElementImpl) {
        map.set(element, {
            bounds: (element as any).bounds,
            boundsChanged: false,
            alignmentChanged: false
        });
        if (element instanceof SParentElementImpl)
            element.children.forEach(c => addToMap(c));
    }

    function layout(model: SNodeImpl) {
        map.clear();
        addToMap(model);
        const container = new Container();
        container.load(defaultModule, boundsModule);
        const layoutRegistry = container.get<LayoutRegistry>(TYPES.LayoutRegistry);
        const layouter = new StatefulLayouter(map, layoutRegistry, log);
        layouter.layout();
    }

    it('defaultParams', () => {
        const model = createModel();
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 13, height: 18});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 6, y: 5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 5.5, y: 8, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 5, y: 10, width: 3, height: 3});
    });

    it('alignLeft', () => {
        const model = createModel();
        model.layoutOptions = {
            hAlign: 'left'
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 13, height: 18});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 5, y: 5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 5, y: 8, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 5, y: 10, width: 3, height: 3});
    });

    it('alignRight', () => {
        const model = createModel();
        model.layoutOptions = {
            hAlign: 'right'
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 13, height: 18});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 7, y: 5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 6, y: 8, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 5, y: 10, width: 3, height: 3});
    });

    it('padding', () => {
        const model = createModel();
        model.layoutOptions = {
            paddingTop: 7,
            paddingBottom: 8,
            paddingLeft: 9,
            paddingRight: 10
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 22, height: 23});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 10, y: 7, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 9.5, y: 10, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 9, y: 12, width: 3, height: 3});
    });

    it('vGap', () => {
        const model = createModel();
        model.layoutOptions = {
            vGap: 4
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 13, height: 24});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 6, y: 5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 5.5, y: 11, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 5, y: 16, width: 3, height: 3});
    });

    it('paddingFactor', () => {
        const model = createModel();
        model.layoutOptions = {
            paddingFactor: 2
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 16, height: 26});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 7.5, y: 9, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 7, y: 12, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 6.5, y: 14, width: 3, height: 3});
    });

});


