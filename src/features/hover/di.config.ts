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
    HoverMouseListener, PopupHoverMouseListener, HoverFeedbackCommand, SetPopupModelCommand, HoverKeyListener, HoverState
} from "./hover";
import { PopupPositionUpdater } from "./popup-position-updater";
import { PopupActionHandlerInitializer } from "./initializer";

const hoverModule = new ContainerModule(bind => {
    bind(TYPES.PopupVNodeDecorator).to(PopupPositionUpdater).inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).to(PopupActionHandlerInitializer);
    bind(TYPES.ICommand).toConstructor(HoverFeedbackCommand);
    bind(TYPES.ICommand).toConstructor(SetPopupModelCommand);
    bind(TYPES.MouseListener).to(HoverMouseListener);
    bind(TYPES.PopupMouseListener).to(PopupHoverMouseListener);
    bind(TYPES.KeyListener).to(HoverKeyListener);
    bind<HoverState>(TYPES.HoverState).toConstantValue({
        mouseOverTimer: undefined,
        mouseOutTimer: undefined,
        popupOpen: false,
        previousPopupElement: undefined
    });
});

export default hoverModule;
