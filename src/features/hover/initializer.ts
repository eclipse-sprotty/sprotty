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

import { injectable } from "inversify";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer } from "../../base/actions/action-handler";
import { Action } from "../../base/actions/action";
import { ICommand } from "../../base/commands/command";
import { SetPopupModelAction, SetPopupModelCommand } from "./hover";
import { EMPTY_ROOT } from "../../base/model/smodel-factory";
import { CenterCommand, FitToScreenCommand } from "../viewport/center-fit";
import { ViewportCommand } from "../viewport/viewport";
import { MoveCommand } from "../move/move";

class ClosePopupActionHandler implements IActionHandler {
    protected popupOpen: boolean = false;

    handle(action: Action): void | ICommand | Action {
        if (action.kind === SetPopupModelCommand.KIND) {
            this.popupOpen = (action as SetPopupModelAction).newRoot.type !== EMPTY_ROOT.type;
        } else if (this.popupOpen) {
            return new SetPopupModelAction({id: EMPTY_ROOT.id, type: EMPTY_ROOT.type});
        }
    }
}

@injectable()
export class PopupActionHandlerInitializer implements IActionHandlerInitializer {
    initialize(registry: ActionHandlerRegistry): void {
        const closePopupActionHandler = new ClosePopupActionHandler();
        registry.register(FitToScreenCommand.KIND, closePopupActionHandler);
        registry.register(CenterCommand.KIND, closePopupActionHandler);
        registry.register(ViewportCommand.KIND, closePopupActionHandler);
        registry.register(SetPopupModelCommand.KIND, closePopupActionHandler);
        registry.register(MoveCommand.KIND, closePopupActionHandler);
    }

}
