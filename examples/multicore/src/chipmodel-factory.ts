/********************************************************************************
 * Copyright (c) 2017-2023 TypeFox and others.
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

import {
    SGraphFactory, SChildElementImpl, SModelRootImpl, SParentElementImpl, PreRenderedElementImpl, HtmlRootImpl,
    createFeatureSet, Direction
} from 'sprotty';
import {
    SModelElement, SModelRoot, HtmlRoot as HtmlRootSchema,
    PreRenderedElement, getBasicType
} from 'sprotty-protocol';
import {
    Channel, ChannelSchema, Core, CoreSchema, Crossbar, CrossbarSchema, Processor, ProcessorSchema
} from './chipmodel';
import { CORE_WIDTH, CORE_DISTANCE } from './views';


export class ChipModelFactory extends SGraphFactory {

    override createElement(schema: SModelElement, parent?: SParentElementImpl): SChildElementImpl {
        try {
            if (this.isCoreSchema(schema)) {
                this.validate(schema, parent);
                const core = this.initializeChild(new Core(), schema, parent) as Core;
                core.features = createFeatureSet(Core.DEFAULT_FEATURES);
                core.bounds = {
                    x: core.column * (CORE_WIDTH + CORE_DISTANCE),
                    y: core.row * (CORE_WIDTH + CORE_DISTANCE),
                    width: CORE_WIDTH,
                    height: CORE_WIDTH
                };
                return core;
            } else if (this.isChannelSchema(schema)) {
                this.validate(schema, parent);
                const channel = this.initializeChild(new Channel(), schema, parent);
                channel.features = createFeatureSet(Channel.DEFAULT_FEATURES);
                return channel;
            } else if (this.isCrossbarSchema(schema)) {
                return this.initializeChild(new Crossbar(), schema, parent);
            } else if (this.isPreRenderedSchema(schema)) {
                return this.initializeChild(new PreRenderedElementImpl(), schema, parent);
            }
        } catch (e) {
            console.error(e.message);
        }
        return super.createElement(schema, parent);
    }

    override createRoot(schema: SModelRoot): SModelRootImpl {
        if (this.isProcessorSchema(schema)) {
            const processor = this.initializeRoot(new Processor(), schema);
            processor.features = createFeatureSet(Processor.DEFAULT_FEATURES);
            return processor;
        } else if (this.isHtmlRootSchema(schema)) {
            return this.initializeRoot(new HtmlRootImpl(), schema);
        } else {
            return super.createRoot(schema);
        }
    }

    private validate(coreOrChannel: CoreSchema | ChannelSchema, processor?: SParentElementImpl) {
        if (processor) {
            if (!(processor instanceof Processor))
                throw new Error('Parent model element must be a Processor');
            let rowDelta = 0;
            let columnDelta = 0;
            if (this.isChannelSchema(coreOrChannel)) {
                switch (coreOrChannel.direction) {
                    case Direction.down:
                    case Direction.up:
                        rowDelta = 1;
                        break;
                    default:
                        columnDelta = 1;
                        break;
                }
            }
            if (coreOrChannel.row < 0 || coreOrChannel.row >= processor.rows + rowDelta
                || coreOrChannel.column < 0 && coreOrChannel.column >= processor.columns + columnDelta)
                throw Error('Element coordinates are out of bounds ' + coreOrChannel);
        }
    }

    isProcessorSchema(schema: SModelElement): schema is ProcessorSchema {
        return getBasicType(schema) === 'processor';
    }

    isCoreSchema(schema: SModelElement): schema is CoreSchema {
        const basicType = getBasicType(schema);
        return basicType === 'core' || basicType === 'simplecore';
    }

    isChannelSchema(schema: SModelElement): schema is ChannelSchema {
        return getBasicType(schema) === 'channel';
    }

    isCrossbarSchema(schema: SModelElement): schema is CrossbarSchema {
        return getBasicType(schema) === 'crossbar';
    }

    isHtmlRootSchema(schema: SModelElement): schema is HtmlRootSchema {
        return getBasicType(schema) === 'html';
    }

    isPreRenderedSchema(schema: SModelElement): schema is PreRenderedElement {
        return getBasicType(schema) === 'pre-rendered';
    }
}
