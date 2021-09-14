/********************************************************************************
 * Copyright (c) 2017-2020 TypeFox and others.
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
    ProjectedViewportView, ViewportRootElement, ShapedPreRenderedElement, configureModelElement,
    ForeignObjectElement, ForeignObjectView, RectangularNode, RectangularNodeView, moveFeature,
    selectFeature, EditableLabel, editLabelFeature, WithEditableLabel, withEditLabelFeature,
    isEditableLabel, Action, MoveAction, SShapeElementSchema, ViewportRootElementSchema,
    ActionHandlerRegistry, SetBoundsAction
} from '../../../src';

export default () => {
    require('../../../css/sprotty.css');
    require('../../../css/edit-label.css');
    require('../css/diagram.css');

    const svgModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);
        bind(TYPES.ModelSource).to(SVGModelSource).inSingletonScope();
        const context = { bind, unbind, isBound, rebind };
        configureModelElement(context, 'svg', ViewportRootElement, ProjectedViewportView);
        configureModelElement(context, 'pre-rendered', ShapedPreRenderedElement, PreRenderedView);
        configureModelElement(context, 'foreign-object', ForeignObjectElement, ForeignObjectView);
        configureModelElement(context, 'node', RectangleWithEditableLabel, RectangularNodeView, {
            enable: [withEditLabelFeature]
        });
        configureModelElement(context, 'child-foreign-object', EditableForeignObjectElement, ForeignObjectView, {
            disable: [moveFeature, selectFeature], // disable move/select as we want the parent node to react to select/move
            enable: [editLabelFeature] // enable editing -- see also EditableForeignObjectElement below
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(svgModule);
    return container;
};

export class SVGModelSource extends LocalModelSource {
    initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);
        registry.register(MoveAction.KIND, this);
    }
    
    updateModelBounds(): Promise<void> {
        let minX = 10000;
        let minY = 10000;
        let maxX = -10000;
        let maxY = -10000;
        for (const element of this.currentRoot.children!) {
            const position = (element as SShapeElementSchema).position;
            const size = (element as SShapeElementSchema).size;
            if (position && size) {
                minX = Math.min(minX, position.x);
                minY = Math.min(minY, position.y);
                maxX = Math.max(maxX, position.x + size.width);
                maxY = Math.max(maxY, position.y + size.height);
            }
        }
        if (minX < maxX && minY < maxY) {
            const viewportRoot = this.currentRoot as ViewportRootElementSchema;
            viewportRoot.position = { x: minX, y: minY };
            viewportRoot.size = { width: maxX - minX, height: maxY - minY };
            return this.actionDispatcher.dispatch(new SetBoundsAction([{
                elementId: viewportRoot.id,
                newPosition: viewportRoot.position,
                newSize: viewportRoot.size
            }]));
        }
        return Promise.resolve();
    }

    handle(action: Action): void {
        switch (action.kind) {
            case MoveAction.KIND:
                this.handleMove(action as MoveAction);
                break;
            default:
                super.handle(action);
        }
    }

    protected handleMove(action: MoveAction): void {
        for (const move of action.moves) {
            const element = this.currentRoot.children?.find(c => c.id === move.elementId);
            if (element) {
                (element as SShapeElementSchema).position = move.toPosition;
            }
        }
        this.updateModelBounds();
    }
}

export class RectangleWithEditableLabel extends RectangularNode implements WithEditableLabel {
    get editableLabel() {
        if (this.children.length > 0 && isEditableLabel(this.children[0])) {
            return this.children[0] as EditableForeignObjectElement;
        }
        return undefined;
    }
}

export class EditableForeignObjectElement extends ForeignObjectElement implements EditableLabel {
    readonly isMultiLine = true;
    get editControlDimension() { return { width: this.bounds.width, height: this.bounds.height }; }

    get text(): string {
        return this.code;
    }
    set text(newText: string) {
        this.code = newText.replace('\n', '<br/>');
    }
}
