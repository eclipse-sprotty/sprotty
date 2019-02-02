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
import { SwitchEditModeCommand } from "./edit-routing";
import { ReconnectCommand } from "./reconnect";
import { configureModelElement } from "../../base/views/view";
import { SDanglingAnchor } from "../../features/routing/model";
import { EmptyGroupView } from "../../lib/svg-views";
import { DeleteElementCommand } from "./delete";
import { EditLabelMouseListener } from "./edit-label";
import { configureCommand } from "../../base/commands/command-registration";

export const edgeEditModule = new ContainerModule((bind, _unbind, isBound)  => {
    configureCommand({ bind, isBound }, SwitchEditModeCommand);
    configureCommand({ bind, isBound }, ReconnectCommand);
    configureCommand({ bind, isBound }, DeleteElementCommand);
    configureModelElement({ bind, isBound }, 'dangling-anchor', SDanglingAnchor, EmptyGroupView);
});

export const labelEditModule = new ContainerModule(bind => {
    bind(TYPES.MouseListener).to(EditLabelMouseListener);
});
