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
import { configureActionHandler } from "../../base/actions/action-handler.js";
import { configureCommand } from "../../base/commands/command-registration.js";
import { TYPES } from "../../base/types.js";
import { configureModelElement } from "../../base/views/view.js";
import { SDanglingAnchorImpl } from "../../features/routing/model.js";
import { EmptyGroupView } from "../../lib/svg-views.js";
import { DeleteElementCommand } from "./delete.js";
import { EditLabelActionHandler, EditLabelUI } from "./edit-label-ui.js";
import { ApplyLabelEditCommand, EditLabelAction, EditLabelKeyListener, EditLabelMouseListener } from "./edit-label.js";
import { SwitchEditModeCommand } from "./edit-routing.js";
import { ReconnectCommand } from "./reconnect.js";

export const edgeEditModule = new ContainerModule((bind, _unbind, isBound) => {
    const context = { bind, isBound };
    configureCommand(context, SwitchEditModeCommand);
    configureCommand(context, ReconnectCommand);
    configureCommand(context, DeleteElementCommand);
    configureModelElement(context, 'dangling-anchor', SDanglingAnchorImpl, EmptyGroupView);
});

export const labelEditModule = new ContainerModule((bind, _unbind, isBound) => {
    bind(EditLabelMouseListener).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(EditLabelMouseListener);
    bind(EditLabelKeyListener).toSelf().inSingletonScope();
    bind(TYPES.KeyListener).toService(EditLabelKeyListener);
    configureCommand({ bind, isBound }, ApplyLabelEditCommand);
});

export const labelEditUiModule = new ContainerModule((bind, _unbind, isBound) => {
    const context = { bind, isBound };
    configureActionHandler(context, EditLabelAction.KIND, EditLabelActionHandler);
    bind(EditLabelUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(EditLabelUI);
});
