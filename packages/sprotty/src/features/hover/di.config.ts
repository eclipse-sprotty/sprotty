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

import { ContainerModule } from "inversify";
import { TYPES } from "../../base/types";
import {
    HoverMouseListener, PopupHoverMouseListener, HoverFeedbackCommand, SetPopupModelCommand,
    HoverKeyListener, HoverState, ClosePopupActionHandler
} from "./hover";
import { PopupPositionUpdater } from "./popup-position-updater";
import { configureCommand } from "../../base/commands/command-registration";
import { configureActionHandler } from "../../base/actions/action-handler";
import { FitToScreenCommand, CenterCommand } from "../viewport/center-fit";
import { SetViewportCommand } from "../viewport/viewport";
import { MoveCommand } from "../move/move";

const hoverModule = new ContainerModule((bind, _unbind, isBound) => {
    bind(TYPES.PopupVNodePostprocessor).to(PopupPositionUpdater).inSingletonScope();
    bind(TYPES.MouseListener).to(HoverMouseListener);
    bind(TYPES.PopupMouseListener).to(PopupHoverMouseListener);
    bind(TYPES.KeyListener).to(HoverKeyListener);
    bind<HoverState>(TYPES.HoverState).toConstantValue({
        mouseOverTimer: undefined,
        mouseOutTimer: undefined,
        popupOpen: false,
        previousPopupElement: undefined
    });
    bind(ClosePopupActionHandler).toSelf().inSingletonScope();

    const context = { bind, isBound };
    configureCommand(context, HoverFeedbackCommand);
    configureCommand(context, SetPopupModelCommand);
    configureActionHandler(context, SetPopupModelCommand.KIND, ClosePopupActionHandler);
    configureActionHandler(context, FitToScreenCommand.KIND, ClosePopupActionHandler);
    configureActionHandler(context, CenterCommand.KIND, ClosePopupActionHandler);
    configureActionHandler(context, SetViewportCommand.KIND, ClosePopupActionHandler);
    configureActionHandler(context, MoveCommand.KIND, ClosePopupActionHandler);
});

export default hoverModule;
