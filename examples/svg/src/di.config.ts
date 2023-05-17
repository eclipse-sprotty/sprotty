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

import { Container, ContainerModule } from 'inversify';
import {
    TYPES, ConsoleLogger, LogLevel, loadDefaultModules, LocalModelSource, PreRenderedView,
    ProjectedViewportView, ViewportRootElement, ShapedPreRenderedElementImpl, configureModelElement,
    ForeignObjectElementImpl, ForeignObjectView, RectangularNode, RectangularNodeView, moveFeature,
    selectFeature, EditableLabel, editLabelFeature, WithEditableLabel, withEditLabelFeature,
    isEditableLabel, configureViewerOptions
} from 'sprotty';

export default () => {
    require('sprotty/css/sprotty.css');
    require('sprotty/css/edit-label.css');
    require('../css/diagram.css');

    const svgModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        const context = { bind, unbind, isBound, rebind };

        configureModelElement(context, 'svg', ViewportRootElement, ProjectedViewportView);
        configureModelElement(context, 'pre-rendered', ShapedPreRenderedElementImpl, PreRenderedView);
        configureModelElement(context, 'foreign-object', ForeignObjectElementImpl, ForeignObjectView);
        configureModelElement(context, 'node', RectangleWithEditableLabel, RectangularNodeView, {
            enable: [withEditLabelFeature]
        });
        configureModelElement(context, 'child-foreign-object', EditableForeignObjectElement, ForeignObjectView, {
            disable: [moveFeature, selectFeature], // disable move/select as we want the parent node to react to select/move
            enable: [editLabelFeature] // enable editing -- see also EditableForeignObjectElement below
        });

        configureViewerOptions(context, {
            zoomLimits: { min: 0.4, max: 5 },
            horizontalScrollLimits: { min: -500, max: 2000 },
            verticalScrollLimits: { min: -500, max: 1500 }
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(svgModule);
    return container;
};

export class RectangleWithEditableLabel extends RectangularNode implements WithEditableLabel {
    get editableLabel() {
        if (this.children.length > 0 && isEditableLabel(this.children[0])) {
            return this.children[0] as EditableForeignObjectElement;
        }
        return undefined;
    }
}

export class EditableForeignObjectElement extends ForeignObjectElementImpl implements EditableLabel {
    readonly isMultiLine = true;
    get editControlDimension() { return { width: this.bounds.width, height: this.bounds.height }; }

    get text(): string {
        return this.code;
    }
    set text(newText: string) {
        this.code = newText.replace('\n', '<br/>');
    }
}
