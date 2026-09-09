/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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

import { describe, expect, it } from 'vitest';
import { CommandExecutionContext } from '../commands/command.js';
import { SModelRootImpl } from '../model/smodel.js';
import { IUIExtension } from './ui-extension.js';
import { SetUIExtensionVisibilityAction, SetUIExtensionVisibilityCommand, UIExtensionRegistry } from './ui-extension-registry.js';

class RecordingExtension implements IUIExtension {
    calls: string[] = [];

    constructor(private readonly extensionId: string) {}

    id(): string {
        return this.extensionId;
    }

    show(root: Readonly<SModelRootImpl>, ...contextElementIds: string[]): void {
        this.calls.push(`show:${contextElementIds.join(',')}`);
    }

    hide(): void {
        this.calls.push('hide');
    }
}

describe('UIExtensionRegistry', () => {
    it('registers the extensions under their ids', () => {
        const extension = new RecordingExtension('ext');
        const registry = new UIExtensionRegistry([extension]);
        expect(registry.get('ext')).toBe(extension);
        expect(registry.hasKey('other')).toBe(false);
    });

    it('is empty without extensions', () => {
        expect(new UIExtensionRegistry().hasKey('ext')).toBe(false);
    });
});

describe('SetUIExtensionVisibilityCommand', () => {
    const extension = new RecordingExtension('ext');
    const registry = new UIExtensionRegistry([extension]);
    const root = new SModelRootImpl();
    const context = { root } as CommandExecutionContext;

    function execute(options: { visible: boolean, contextElementsId?: string[] }) {
        const command = new SetUIExtensionVisibilityCommand(SetUIExtensionVisibilityAction.create({ extensionId: 'ext', ...options }));
        Object.assign(command, { registry });
        return command.execute(context);
    }

    it('shows the extension with the context elements without changing the model', () => {
        extension.calls = [];
        expect(execute({ visible: true, contextElementsId: ['n1', 'n2'] })).toEqual({ model: root, modelChanged: false });
        expect(extension.calls).toEqual(['show:n1,n2']);
    });

    it('hides the extension', () => {
        extension.calls = [];
        execute({ visible: false });
        expect(extension.calls).toEqual(['hide']);
    });
});
