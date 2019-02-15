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

import { inject, injectable } from "inversify";
import { TYPES } from "../../base/types";
import { ILogger } from '../../utils/logging';
import { InstanceRegistry } from "../../utils/registry";
import { Bounds, EMPTY_BOUNDS } from "../../utils/geometry";
import { SParentElement, SModelElement } from "../../base/model/smodel";
import { isLayoutContainer, LayoutContainer } from "./model";
import { BoundsData } from "./hidden-bounds-updater";
import { VBoxLayouter } from "./vbox-layout";
import { HBoxLayouter } from "./hbox-layout";
import { StackLayouter } from "./stack-layout";

export class LayoutRegistry extends InstanceRegistry<ILayout> {
    constructor() {
        super();
        this.register(VBoxLayouter.KIND, new VBoxLayouter());
        this.register(HBoxLayouter.KIND, new HBoxLayouter());
        this.register(StackLayouter.KIND, new StackLayouter());
    }
}

@injectable()
export class Layouter {

    @inject(TYPES.LayoutRegistry) protected layoutRegistry: LayoutRegistry;
    @inject(TYPES.ILogger) protected logger: ILogger;

    layout(element2boundsData: Map<SModelElement​​ , BoundsData>) {
        new StatefulLayouter(element2boundsData, this.layoutRegistry, this.logger).layout();
    }
}

export class StatefulLayouter {

    private toBeLayouted: (SParentElement & LayoutContainer)[];

    constructor(private readonly element2boundsData: Map<SModelElement​​ , BoundsData>,
                private readonly layoutRegistry: LayoutRegistry,
                public readonly log: ILogger) {
        this.toBeLayouted = [];
        element2boundsData.forEach(
            (data, element) => {
                if (isLayoutContainer(element))
                    this.toBeLayouted.push(element);
            });
    }

    getBoundsData(element: SModelElement): BoundsData {
        let boundsData = this.element2boundsData.get(element);
        let bounds = (element as any).bounds;
        if (isLayoutContainer(element) && this.toBeLayouted.indexOf(element) >= 0) {
            bounds = this.doLayout(element);
        }
        if (!boundsData) {
            boundsData = {
                bounds: bounds,
                boundsChanged: false,
                alignmentChanged: false
            };
            this.element2boundsData.set(element, boundsData);
        }
        return boundsData;
    }

    layout(): void {
        while (this.toBeLayouted.length > 0) {
            const element = this.toBeLayouted[0];
            this.doLayout(element);
        }
    }

    protected doLayout(element: SParentElement & LayoutContainer): Bounds {
        const index = this.toBeLayouted.indexOf(element);
        if (index >= 0)
            this.toBeLayouted.splice(index, 1);
        const layout = this.layoutRegistry.get(element.layout);
        if (layout)
            layout.layout(element, this);
        const boundsData = this.element2boundsData.get(element);
        if (boundsData !== undefined && boundsData.bounds !== undefined) {
            return boundsData.bounds;
        } else {
            this.log.error(element, 'Layout failed');
            return EMPTY_BOUNDS;
        }
    }
}

export interface ILayout {
    layout(container: SParentElement & LayoutContainer,
           layouter: StatefulLayouter): void
}
