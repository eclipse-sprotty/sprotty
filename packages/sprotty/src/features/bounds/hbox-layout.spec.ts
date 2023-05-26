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

import 'mocha';
import { expect } from "chai";
import { SModelElementImpl, SParentElementImpl } from '../../base/model/smodel';
import { createFeatureSet } from '../../base/model/smodel-factory';
import { SNodeImpl, SLabelImpl } from '../../graph/sgraph';
import { StatefulLayouter, LayoutRegistry } from './layout';
import { BoundsData } from './hidden-bounds-updater';
import { ConsoleLogger } from '../../utils/logging';
import { layoutableChildFeature } from './model';
import { TYPES } from '../../base/types';
import { Container } from 'inversify';
import boundsModule from './di.config';
import defaultModule from '../../base/di.config';
import { Dimension } from 'sprotty-protocol';

describe('HBoxLayouter', () => {

    const log = new ConsoleLogger();

    const map = new Map<SModelElementImpl, BoundsData>();

    function snode(size: Dimension): SNodeImpl {
        const node = new SNodeImpl();
        node.features = createFeatureSet(SNodeImpl.DEFAULT_FEATURES, { enable: [layoutableChildFeature] });
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

    function createModel(): SNodeImpl {
        const model = snode(Dimension.EMPTY);
        model.children = [
            slabel({ width: 1, height: 2 }),
            slabel({ width: 2, height: 1 }),
            slabel({ width: 3, height: 3 })
        ];
        model.layout = 'hbox';
        return model;
    }

    it('defaultParams', () => {
        const model = createModel();
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 18, height: 13});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 5, y: 5.5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 7, y: 6, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 10, y: 5, width: 3, height: 3});
    });

    it('alignTop', () => {
        const model = createModel();
        model.layoutOptions = {
            vAlign: 'top'
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 18, height: 13});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 5, y: 5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 7, y: 5, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 10, y: 5, width: 3, height: 3});
    });

    it('alignBottom', () => {
        const model = createModel();
        model.layoutOptions = {
            vAlign: 'bottom'
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 18, height: 13});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 5, y: 6, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 7, y: 7, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 10, y: 5, width: 3, height: 3});
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
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 27, height: 18});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 9, y: 7.5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 11, y: 8, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 14, y: 7, width: 3, height: 3});
    });

    it('hGap', () => {
        const model = createModel();
        model.layoutOptions = {
            hGap: 4
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 24, height: 13});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 5, y: 5.5, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 10, y: 6, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 16, y: 5, width: 3, height: 3});
    });

    it('paddingFactor', () => {
        const model = createModel();
        model.layoutOptions = {
            paddingFactor: 2
        };
        layout(model);
        expect(map.get(model)!.bounds).to.deep.equal({x: 0, y: 0, width: 26, height: 16});
        expect(map.get(model.children[0])!.bounds).to.deep.equal({x: 9, y: 7, width: 1, height: 2});
        expect(map.get(model.children[1])!.bounds).to.deep.equal({x: 11, y: 7.5, width: 2, height: 1});
        expect(map.get(model.children[2])!.bounds).to.deep.equal({x: 14, y: 6.5, width: 3, height: 3});
    });

    it('issue-189', () => {
        const model = snode(Dimension.EMPTY);
        model.layout = 'vbox';
        const comp0 = snode(Dimension.EMPTY);
        comp0.layout = 'hbox';
        model.children = [
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10}),
            comp0
        ];
        const compLeft = snode(Dimension.EMPTY);
        compLeft.layout = 'vbox';
        compLeft.layoutOptions = {
            vGap: 15
        };
        compLeft.children = [
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10})
        ];
        const compRight = snode(Dimension.EMPTY);
        compRight.layout = 'vbox';
        model.layoutOptions = {
            vGap: 15
        };
        compRight.children = [
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10})
        ];
        comp0.children = [ compLeft, compRight ];
        layout(model);
        expect(map.get(comp0)!.bounds).to.deep.equal({
            "height": 80,
            "width": 131, // 50 + 50 + 1 [hGap] + 3 * (5 + 5) [padding compLeft, compRight, comp0]
            "x": 5, // padding model left
            "y": 55 // 10 + 10 [labels] + 2 * 15 [ model.vGap ] + 5 [padding model top]
        });
    });
});


