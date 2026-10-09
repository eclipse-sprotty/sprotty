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

/**
 * @vitest-environment happy-dom
 */

import { Container } from 'inversify';
import { Action, ApplyLabelEditAction, SLabel } from 'sprotty-protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IActionDispatcher } from '../../base/actions/action-dispatcher.js';
import defaultModule from '../../base/di.config.js';
import { IModelFactory } from '../../base/model/smodel-factory.js';
import { registerModelElement } from '../../base/model/smodel-utils.js';
import { TYPES } from '../../base/types.js';
import { SetUIExtensionVisibilityAction } from '../../base/ui-extensions/ui-extension-registry.js';
import { SGraphImpl, SLabelImpl } from '../../graph/sgraph.js';
import { CommitModelAction } from '../../model-source/commit-model.js';
import { labelEditUiModule } from './di.config.js';
import { EditLabelActionHandler, EditLabelUI } from './edit-label-ui.js';
import { EditLabelAction } from './edit-label.js';
import { editLabelFeature } from './model.js';

class MultiLineLabel extends SLabelImpl {
    readonly isMultiLine = true;
}

describe('EditLabelActionHandler', () => {
    it('shows the label editing UI for the requested label', () => {
        const result = new EditLabelActionHandler().handle(EditLabelAction.create('label0'));
        expect(result).toEqual(SetUIExtensionVisibilityAction.create({ extensionId: EditLabelUI.ID, visible: true, contextElementsId: ['label0'] }));
    });

    it('ignores other actions', () => {
        expect(new EditLabelActionHandler().handle({ kind: 'other' })).toBeUndefined();
    });
});

describe('EditLabelUI', () => {
    const dispatched: Action[] = [];
    const container = new Container();
    container.load(defaultModule, labelEditUiModule);
    container.rebind(TYPES.IActionDispatcher).toConstantValue({
        dispatch: (action: Action) => { dispatched.push(action); return Promise.resolve(); },
        dispatchAll: (actions: Action[]) => { dispatched.push(...actions); return Promise.resolve(); }
    } as unknown as IActionDispatcher);
    registerModelElement(container, 'graph', SGraphImpl);
    registerModelElement(container, 'label', SLabelImpl, { enable: [editLabelFeature] });
    registerModelElement(container, 'label:multiline', MultiLineLabel, { enable: [editLabelFeature] });
    const model = container.get<IModelFactory>(TYPES.IModelFactory).createRoot({
        id: 'graph', type: 'graph',
        children: [
            <SLabel>{ id: 'label0', type: 'label', text: 'Hello' },
            <SLabel>{ id: 'label1', type: 'label:multiline', text: 'Multi\nline' }
        ]
    });
    // The base div of the viewer options and the rendered label, as the UI extension looks them up in the DOM.
    document.body.innerHTML = '<div id="sprotty"><svg><text id="sprotty_label0">Hello</text></svg></div>';
    const ui = container.get(EditLabelUI);

    function keyDown(code: string) {
        ui.editControl.dispatchEvent(new KeyboardEvent('keydown', { code }));
    }

    function settle() {
        return new Promise(resolve => setTimeout(resolve, 10));
    }

    afterEach(() => {
        ui.hide();
        ui.labelValidator = undefined!;
        dispatched.length = 0;
    });

    it('shows an input holding the label text inside the sprotty base div', () => {
        ui.show(model, 'label0');
        const element = document.getElementById('sprotty_editLabelUi')!;
        expect(element.parentElement?.id).toBe('sprotty');
        expect(element.classList.contains('label-edit')).toBe(true);
        expect(element.style.visibility).toBe('visible');
        expect(ui.editControl).toBeInstanceOf(HTMLInputElement);
        expect(ui.editControl.value).toBe('Hello');
        expect(ui.editControl.style.visibility).toBe('visible');
    });

    it('uses a text area for multi-line labels', () => {
        ui.show(model, 'label1');
        expect(ui.editControl).toBeInstanceOf(HTMLTextAreaElement);
        expect(ui.editControl.value).toBe('Multi\nline');
    });

    it('does not show for elements that are not editable labels', () => {
        ui.show(model, 'graph');
        expect(document.getElementById('sprotty_editLabelUi')!.style.visibility).toBe('hidden');
    });

    it('applies the edited text and commits the model on Enter', async () => {
        ui.show(model, 'label0');
        ui.editControl.value = 'World';
        keyDown('Enter');
        await vi.waitFor(() => expect(dispatched).toHaveLength(2));
        expect(dispatched).toEqual([ApplyLabelEditAction.create('label0', 'World'), CommitModelAction.create()]);
        expect(document.getElementById('sprotty_editLabelUi')!.style.visibility).toBe('hidden');
    });

    it('closes without applying on Escape', async () => {
        ui.show(model, 'label0');
        ui.editControl.value = 'World';
        keyDown('Escape');
        expect(document.getElementById('sprotty_editLabelUi')!.style.visibility).toBe('hidden');
        await settle();
        expect(dispatched).toEqual([]);
    });

    it('keeps the editor open and applies nothing while the validator reports an error', async () => {
        ui.labelValidator = { validate: () => Promise.resolve({ severity: 'error', message: 'not allowed' }) };
        ui.show(model, 'label0');
        ui.editControl.value = 'World';
        keyDown('Enter');
        await settle();
        expect(dispatched).toEqual([]);
        expect(document.getElementById('sprotty_editLabelUi')!.style.visibility).toBe('visible');
    });
});
