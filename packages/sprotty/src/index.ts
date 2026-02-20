/********************************************************************************
 * Copyright (c) 2017-2024 TypeFox and others.
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

// ------------------ Base ------------------

export * from './base/actions/action.js';
export * from './base/actions/action-dispatcher.js';
export * from './base/actions/action-handler.js';
export * from './base/actions/diagram-locker.js';

export * from './base/animations/animation-frame-syncer.js';
export * from './base/animations/animation.js';
export * from './base/animations/easing.js';

export * from './base/commands/command.js';
export * from './base/commands/command-registration.js';
export * from './base/commands/command-stack-options.js';
export * from './base/commands/command-stack.js';

export * from './base/features/initialize-canvas.js';
export * from './base/features/set-model.js';

export * from './base/model/smodel-factory.js';
export * from './base/model/smodel-utils.js';
export * from './base/model/smodel.js';

export * from './base/ui-extensions/ui-extension-registry.js';
export * from './base/ui-extensions/ui-extension.js';

export * from './base/views/key-tool.js';
export * from './base/views/mouse-tool.js';
export * from './base/views/pointer-tool.js';
export * from './base/views/thunk-view.js';
export * from './base/views/touch-tool.js';
export * from './base/views/view.js';
export * from './base/views/viewer-cache.js';
export * from './base/views/viewer-options.js';
export * from './base/views/viewer.js';
export * from './base/views/vnode-postprocessor.js';
export * from './base/views/vnode-utils.js';

export * from './base/types.js';

import defaultModule from './base/di.config.js';
export { defaultModule };


// ------------------ Features ------------------

export * from './features/bounds/bounds-manipulation.js';
export * from './features/bounds/hidden-bounds-updater.js';
export * from './features/bounds/layout.js';
export * from './features/bounds/model.js';
export * from './features/bounds/vbox-layout.js';
export * from './features/bounds/hbox-layout.js';
export * from './features/bounds/stack-layout.js';
export * from './features/bounds/views.js';

export * from './features/button/button-handler.js';
export * from './features/button/model.js';

export * from './features/command-palette/action-providers.js';
export * from './features/command-palette/command-palette.js';

export * from './features/context-menu/context-menu-service.js';
export * from './features/context-menu/menu-providers.js';
export * from './features/context-menu/mouse-listener.js';

export * from './features/edge-layout/di.config.js';
export * from './features/edge-layout/edge-layout.js';
export * from './features/edge-layout/model.js';

export * from './features/edit/create.js';
export * from './features/edit/create-on-drag.js';
export * from './features/edit/di.config.js';
export * from './features/edit/delete.js';
export * from './features/edit/edit-label.js';
export * from './features/edit/edit-label-ui.js';
export * from './features/edit/edit-routing.js';
export * from './features/edit/model.js';
export * from './features/edit/reconnect.js';

export * from './features/expand/expand.js';
export * from './features/expand/model.js';
export * from './features/expand/views.js';

export * from './features/export/export.js';
export * from './features/export/model.js';
export * from './features/export/svg-exporter.js';
export * from './features/export/svg-export-postprocessor.js';

export * from './features/fade/fade.js';
export * from './features/fade/model.js';

export * from './features/hover/hover.js';
export * from './features/hover/model.js';

export * from './features/decoration/model.js';
export * from './features/decoration/views.js';
export * from './features/decoration/decoration-placer.js';

export * from './features/edge-intersection/intersection-finder.js';
export * from './features/edge-intersection/sweepline.js';

export * from './features/edge-junction/junction-finder.js';
export * from './features/edge-junction/junction-postprocessor.js';

export * from './features/move/model.js';
export * from './features/move/move.js';
export * from './features/move/snap.js';

export * from './features/nameable/model.js';

export * from './features/open/open.js';
export * from './features/open/model.js';

export * from './features/projection/model.js';
export * from './features/projection/views.js';

export * from './features/routing/anchor.js';
export * from './features/routing/abstract-edge-router.js';
export * from './features/routing/bezier-anchors.js';
export * from './features/routing/bezier-edge-router.js';
export * from './features/routing/manhattan-anchors.js';
export * from './features/routing/manhattan-edge-router.js';
export * from './features/routing/model.js';
export * from './features/routing/polyline-anchors.js';
export * from './features/routing/polyline-edge-router.js';
export * from './features/routing/routing.js';
export * from './features/routing/views.js';

export * from './features/select/model.js';
export * from './features/select/select.js';

export * from './features/undo-redo/undo-redo.js';

export * from './features/update/model-matching.js';
export * from './features/update/update-model.js';

export * from './features/viewport/center-fit.js';
export * from './features/viewport/model.js';
export * from './features/viewport/scroll.js';
export * from './features/viewport/viewport-root.js';
export * from './features/viewport/viewport.js';
export * from './features/viewport/zoom.js';

export * from './features/zorder/zorder.js';

import boundsModule from './features/bounds/di.config.js';
import buttonModule from './features/button/di.config.js';
import commandPaletteModule from './features/command-palette/di.config.js';
import contextMenuModule from './features/context-menu/di.config.js';
import decorationModule from './features/decoration/di.config.js';
import edgeIntersectionModule from './features/edge-intersection/di.config.js';
import edgeJunctionModule from './features/edge-junction/di.config.js';
import edgeLayoutModule from './features/edge-layout/di.config.js';
import expandModule from './features/expand/di.config.js';
import exportModule from './features/export/di.config.js';
import fadeModule from './features/fade/di.config.js';
import hoverModule from './features/hover/di.config.js';
import moveModule from './features/move/di.config.js';
import openModule from './features/open/di.config.js';
import routingModule from './features/routing/di.config.js';
import selectModule from './features/select/di.config.js';
import undoRedoModule from './features/undo-redo/di.config.js';
import updateModule from './features/update/di.config.js';
import viewportModule from './features/viewport/di.config.js';
import zorderModule from './features/zorder/di.config.js';

export {
    boundsModule, buttonModule, commandPaletteModule, contextMenuModule, decorationModule,
    edgeIntersectionModule, edgeJunctionModule, edgeLayoutModule, expandModule, exportModule, fadeModule, hoverModule, moveModule,
    openModule, routingModule, selectModule, undoRedoModule, updateModule, viewportModule, zorderModule
};

// ------------------ Graph ------------------

export * from './graph/sgraph.js';
export * from './graph/views.js';


// ------------------ Library ------------------

export * from './lib/modules.js';
export * from './lib/generic-views.js';
export * from './lib/html-views.js';
export * from './lib/jsx.js';
export * from './lib/model.js';
export * from './lib/svg-views.js';


// ------------------ Model Source ------------------

export * from './model-source/commit-model.js';
export * from './model-source/diagram-server.js';
export * from './model-source/local-model-source.js';
export * from './model-source/logging.js';
export * from './model-source/model-source.js';
export * from './model-source/websocket.js';

import modelSourceModule from './model-source/di.config.js';
export { modelSourceModule };


// ------------------ Utilities ------------------

export * from './utils/browser.js';
export * from './utils/codicon.js';
export * from './utils/color.js';
export * from './utils/geometry.js';
export * from './utils/inversify.js';
export * from './utils/logging.js';
export * from './utils/registry.js';
