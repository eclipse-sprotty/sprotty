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
import { SetBoundsCommand, RequestBoundsCommand } from "./bounds-manipulation";
import { HiddenBoundsUpdater } from './hidden-bounds-updater';
import { configureLayout, Layouter, LayoutRegistry } from "./layout";
import { configureCommand } from "../../base/commands/command-registration";
import { HBoxLayouter } from "./hbox-layout";
import { VBoxLayouter } from "./vbox-layout";
import { StackLayouter} from "./stack-layout";

const boundsModule = new ContainerModule((bind, _unbind, isBound) => {
    configureCommand({ bind, isBound }, SetBoundsCommand);
    configureCommand({ bind, isBound }, RequestBoundsCommand);
    bind(HiddenBoundsUpdater).toSelf().inSingletonScope();
    bind(TYPES.HiddenVNodePostprocessor).toService(HiddenBoundsUpdater);
    bind(TYPES.Layouter).to(Layouter).inSingletonScope();
    bind(TYPES.LayoutRegistry).to(LayoutRegistry).inSingletonScope();

    configureLayout({bind, isBound}, VBoxLayouter.KIND, VBoxLayouter);
    configureLayout({bind, isBound}, HBoxLayouter.KIND, HBoxLayouter);
    configureLayout({bind, isBound}, StackLayouter.KIND, StackLayouter);
});

export default boundsModule;
