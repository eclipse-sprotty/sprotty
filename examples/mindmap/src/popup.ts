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
import {
    TYPES, SModelElementSchema, SModelRootSchema, RequestPopupModelAction, MouseListener,
    SModelElement, Action, LocalModelSource, SNodeSchema, SetPopupModelAction, EMPTY_ROOT,
    Point, Command, CommandExecutionContext, CommandResult, SChildElement, FadeAnimation,
    isFadeable, isLocateable, isBoundsAware, subtract, IPopupModelProvider
} from "../../../src";
import { PopupButtonSchema, PopupButton } from "./model";
import { PopupButtonView } from "./views";

@injectable()
export class PopupModelProvider implements IPopupModelProvider {
    getPopupModel(request: RequestPopupModelAction, element?: SModelElementSchema): SModelRootSchema | undefined {
        if (element === undefined || element.type === 'mindmap') {
            return <PopupButtonSchema> {
                type: 'popup:button',
                id: 'button',
                kind: 'add-node'
            };
        } else if (element !== undefined && element.type === 'node') {
            return <PopupButtonSchema> {
                type: 'popup:button',
                id: 'button',
                kind: 'remove-node',
                target: element.id
            };
        }
        return undefined;
    }
}

@injectable()
export class PopupButtonMouseListener extends MouseListener {

    @inject(TYPES.ModelSource) protected modelSource: LocalModelSource;

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        let actions: Action[] = [
            new SetPopupModelAction({type: EMPTY_ROOT.type, id: EMPTY_ROOT.id})
        ];
        if (target instanceof PopupButton) {
            switch (target.kind) {
                case 'add-node':
                    actions = actions.concat(this.addNode(target));
                    break;
                case 'remove-node':
                    actions = actions.concat(this.removeNode(target));
                    break;
            }
        }
        return actions;
    }

    protected addNode(button: PopupButton): Action[] {
        const newElement: SNodeSchema = {
            type: 'node',
            id: 'node_' + Math.trunc(Math.random() * 0x80000000).toString(16),
            size: { width: 100, height: 60 },
            hoverFeedback: true
        };
        const absolutePos = {
            x: button.canvasBounds.x + PopupButtonView.SIZE / 2,
            y: button.canvasBounds.y + PopupButtonView.SIZE / 2
        };
        const model = this.modelSource.model;
        if (model.children === undefined)
            model.children = [ newElement ];
        else
            model.children.push(newElement);
        return [ new AddElementAction(newElement, absolutePos) ];
    }

    protected removeNode(button: PopupButton): Action[] {
        this.modelSource.removeElements([ button.target ]);
        return [];
    }

}

export class AddElementAction implements Action {
    readonly kind = AddElementCommand.KIND;

    constructor(public readonly newElement: SModelRootSchema, public readonly absolutePos: Point) {
    }
}

@injectable()
export class AddElementCommand extends Command {
    static readonly KIND = 'addElement';

    constructor(@inject(TYPES.Action) public action: AddElementAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        const newElement = context.modelFactory.createElement(this.action.newElement);
        context.root.add(newElement);
        this.initialize(newElement);
        if (isFadeable(newElement)) {
            newElement.opacity = 0;
            const animation = new FadeAnimation(context.root, [{ element: newElement, type: 'in' }], context);
            return animation.start();
        } else {
            return context.root;
        }
    }

    protected initialize(element: SModelElement) {
        if (isLocateable(element)) {
            const root = element.root;
            const centerPos = root.parentToLocal(subtract(this.action.absolutePos, root.canvasBounds));
            const elementBounds = isBoundsAware(element) ? element.bounds : { x: 0, y: 0, width: 0, height: 0 };
            element.position = subtract(centerPos, { x: elementBounds.width / 2, y: elementBounds.height / 2 });
        }
    }

    undo(context: CommandExecutionContext): CommandResult {
        const element = context.root.index.getById(this.action.newElement.id);
        if (element instanceof SChildElement) {
            element.parent.remove(element);
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        return this.execute(context);
    }
}
