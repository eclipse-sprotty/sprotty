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

import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { Action, ExportSvgAction, generateRequestId, RequestAction } from 'sprotty-protocol';
import { CommandExecutionContext, CommandResult, HiddenCommand } from '../../base/commands/command.js';
import { SModelElementImpl, SModelRootImpl } from '../../base/model/smodel.js';
import { TYPES } from '../../base/types.js';
import { KeyListener } from '../../base/views/key-tool.js';
import { IVNodePostprocessor } from '../../base/views/vnode-postprocessor.js';
import { matchesKeystroke } from '../../utils/keyboard.js';
import { isHoverable } from '../hover/model.js';
import { isSelectable } from '../select/model.js';
import { isViewport } from '../viewport/model.js';
import { isExportable } from './model.js';
import { SvgExporter } from './svg-exporter.js';

@injectable()
export class ExportSvgKeyListener extends KeyListener {
    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        if (matchesKeystroke(event, 'KeyE', 'ctrlCmd', 'shift'))
            return [ RequestExportSvgAction.create() ];
        else
            return [];
    }
}

/**
 * @deprecated Use the definition from `sprotty-protocol` instead.
 */
export interface ExportSvgOptions {
    skipCopyStyles?: boolean
}

/**
 * @deprecated Use the definition from `sprotty-protocol` instead.
 */
export interface RequestExportSvgAction extends RequestAction<ExportSvgAction> {
    kind: typeof RequestExportSvgAction.KIND
    options?: ExportSvgOptions
}
export namespace RequestExportSvgAction {
    export const KIND = 'requestExportSvg';

    export function create(options: ExportSvgOptions = {}): RequestExportSvgAction {
        return {
            kind: KIND,
            requestId: generateRequestId(),
            options
        };
    }
}

export class ExportSvgCommand extends HiddenCommand {
    static readonly KIND = RequestExportSvgAction.KIND;

    constructor(@inject(TYPES.Action) protected action: RequestExportSvgAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        if (isExportable(context.root)) {
            const root = context.modelFactory.createRoot(context.root);
            if (isExportable(root)) {
                if (isViewport(root)) {
                    root.zoom = 1;
                    root.scroll = { x: 0, y: 0 };
                }
                root.index.all().forEach(element => {
                    if (isSelectable(element) && element.selected)
                        element.selected = false;
                    if (isHoverable(element) && element.hoverFeedback)
                        element.hoverFeedback = false;
                });
                return {
                    model: root,
                    modelChanged: true,
                    cause: this.action
                };
            }
        }
        return {
            model: context.root,
            modelChanged: false
        };
    }
}

@injectable()
export class ExportSvgPostprocessor implements IVNodePostprocessor {

    root: SModelRootImpl;

    @inject(TYPES.SvgExporter) protected svgExporter: SvgExporter;

    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (element instanceof SModelRootImpl)
            this.root = element;
        return vnode;
    }

    postUpdate(cause?: Action): void {
        if (this.root && cause !== undefined && cause.kind === RequestExportSvgAction.KIND) {
            this.svgExporter.export(this.root, cause as RequestExportSvgAction);
        }
    }
}
