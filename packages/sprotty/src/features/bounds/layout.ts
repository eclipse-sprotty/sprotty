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

import { inject, injectable, interfaces, multiInject, optional } from "inversify";
import { Bounds } from "sprotty-protocol/lib/utils/geometry";
import { TYPES } from "../../base/types";
import { ILogger } from '../../utils/logging';
import { InstanceRegistry } from "../../utils/registry";
import { SParentElementImpl, SModelElementImpl } from "../../base/model/smodel";
import { isLayoutContainer, LayoutContainer } from "./model";
import { BoundsData } from "./hidden-bounds-updater";
import { isInjectable } from "../../utils/inversify";

@injectable()
export class LayoutRegistry extends InstanceRegistry<ILayout> {

    @inject(TYPES.ILogger) logger: ILogger;

    constructor(@multiInject(TYPES.LayoutRegistration) @optional() layouts: (LayoutRegistration)[] = []) {
        super();
        layouts.forEach(layout => {
            if (this.hasKey(layout.layoutKind)) {
                this.logger.warn('Layout kind is already defined: ', layout.layoutKind);
            } else {
                this.register(layout.layoutKind, layout.factory());
            }
        });
    }
}

export interface LayoutRegistration {
    layoutKind: string;
    factory: () => ILayout;
}

@injectable()
export class Layouter {

    @inject(TYPES.LayoutRegistry) protected layoutRegistry: LayoutRegistry;
    @inject(TYPES.ILogger) protected logger: ILogger;

    layout(element2boundsData: Map<SModelElementImpl​​ , BoundsData>) {
        new StatefulLayouter(element2boundsData, this.layoutRegistry, this.logger).layout();
    }
}

export class StatefulLayouter {

    private toBeLayouted: (SParentElementImpl & LayoutContainer)[];

    constructor(private readonly element2boundsData: Map<SModelElementImpl​​ , BoundsData>,
                private readonly layoutRegistry: LayoutRegistry,
                public readonly log: ILogger) {
        this.toBeLayouted = [];
        element2boundsData.forEach(
            (data, element) => {
                if (isLayoutContainer(element))
                    this.toBeLayouted.push(element);
            });
    }

    getBoundsData(element: SModelElementImpl): BoundsData {
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

    protected doLayout(element: SParentElementImpl & LayoutContainer): Bounds {
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
            return Bounds.EMPTY;
        }
    }
}

export interface ILayout {
    layout(container: SParentElementImpl & LayoutContainer,
           layouter: StatefulLayouter): void
}


export function configureLayout(context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
    kind: string, constr: interfaces.ServiceIdentifier<ILayout>) {

    if (typeof constr === 'function') {
        if (!isInjectable(constr)) {
            throw new Error(`Layouts be @injectable: ${constr.name}`);
        }
        if (!context.isBound(constr)) {
            context.bind(constr).toSelf();
        }
    }
    context.bind(TYPES.LayoutRegistration).toDynamicValue(ctx => ({
        layoutKind: kind,
        factory: () => ctx.container.get(constr)
    }));
}
