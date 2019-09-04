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
import { SModelElement, SParentElement } from '../../base/model/smodel';
import { createFeatureSet } from '../../base/model/smodel-factory';
import { SNode, SLabel } from '../../graph/sgraph';
import { StatefulLayouter, LayoutRegistry } from './layout';
import { BoundsData } from './hidden-bounds-updater';
import { EMPTY_DIMENSION } from '../../utils/geometry';
import { ConsoleLogger } from '../../utils/logging';
import { Dimension } from '../../utils/geometry';
import { layoutableChildFeature } from './model';

describe('HBoxLayouter', () => {

    const log = new ConsoleLogger();

    const map = new Map<SModelElement, BoundsData>();

    function snode(size: Dimension): SNode {
        const node = new SNode();
        node.features = createFeatureSet(SNode.DEFAULT_FEATURES, { enable: [layoutableChildFeature] })
        node.bounds = {
            x: 0, y: 0, width: size.width, height: size.height
        };
        return node;
    }

    function slabel(size: Dimension): SLabel {
        const label = new SLabel();
        label.features = createFeatureSet(SLabel.DEFAULT_FEATURES);
        label.bounds = {
            x: 0, y: 0, width: size.width, height: size.height
        };
        return label;
    }

    function addToMap(element: SModelElement) {
        map.set(element, {
            bounds: (element as any).bounds,
            boundsChanged: false,
            alignmentChanged: false
        });
        if (element instanceof SParentElement)
            element.children.forEach(c => addToMap(c));
    }

    function layout(model: SNode) {
        map.clear();
        addToMap(model);
        const layouter = new StatefulLayouter(map, new LayoutRegistry(), log);
        layouter.layout();
    }

    function createModel(): SNode {
        const model = snode(EMPTY_DIMENSION);
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
        const model = snode(EMPTY_DIMENSION);
        model.layout = 'vbox';
        const comp0 = snode(EMPTY_DIMENSION);
        comp0.layout = 'hbox';
        model.children = [
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10}),
            comp0
        ];
        const compLeft = snode(EMPTY_DIMENSION);
        compLeft.layout = 'vbox';
        compLeft.layoutOptions = {
            vGap: 15
        };
        compLeft.children = [
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10}),
            slabel({width: 50, height: 10})
        ];
        const compRight = snode(EMPTY_DIMENSION);
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


