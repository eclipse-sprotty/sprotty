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

import { describe, expect, it, vi } from 'vitest';
import { ILogger, LogLevel } from '../../utils/logging.js';
import { SModelRootImpl } from '../model/smodel.js';
import { defaultViewerOptions } from '../views/viewer-options.js';
import { AbstractUIExtension } from './ui-extension.js';

// inject-from-base: exempt — constructed with `new`, never resolved by a container
class TestExtension extends AbstractUIExtension {
    initializations = 0;
    shownWith: string[][] = [];
    input: HTMLInputElement;

    constructor(logger: ILogger) {
        super();
        this.options = defaultViewerOptions();
        this.logger = logger;
    }

    id(): string {
        return 'test-extension';
    }

    containerClass(): string {
        return 'test-extension-class';
    }

    protected initializeContents(containerElement: HTMLElement): void {
        this.initializations++;
        this.input = document.createElement('input');
        containerElement.appendChild(this.input);
    }

    protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRootImpl>, ...contextElementIds: string[]): void {
        this.shownWith.push(contextElementIds);
        this.input.focus();
    }
}

describe('AbstractUIExtension', () => {
    const root = new SModelRootImpl();

    function createExtension() {
        const logger = { logLevel: LogLevel.warn, error: vi.fn(), warn: vi.fn(), info: vi.fn(), log: vi.fn() } satisfies ILogger;
        return { extension: new TestExtension(logger), logger };
    }

    it('creates its container in front of the base div contents on the first show and reuses it afterwards', () => {
        document.body.innerHTML = '<div id="sprotty"><svg></svg></div>';
        const { extension } = createExtension();
        extension.show(root, 'a');
        const container = document.getElementById('sprotty_test-extension')!;
        expect(container.parentElement?.id).toBe('sprotty');
        expect(container.parentElement?.firstChild).toBe(container);
        expect(container.classList.contains('test-extension-class')).toBe(true);
        expect(container.style.visibility).toBe('visible');

        extension.show(root, 'b', 'c');
        expect(extension.initializations).toBe(1);
        expect(extension.shownWith).toEqual([['a'], ['b', 'c']]);
    });

    it('hides the container and restores the focus on hide()', () => {
        document.body.innerHTML = '<div id="sprotty"></div><button id="button"></button>';
        const button = document.getElementById('button')!;
        button.focus();
        const { extension } = createExtension();
        extension.show(root);
        expect(document.activeElement).toBe(extension.input);

        extension.hide();
        expect(document.getElementById('sprotty_test-extension')!.style.visibility).toBe('hidden');
        expect(document.activeElement).toBe(button);
    });

    it('warns and stays invisible when the base div is missing', () => {
        document.body.innerHTML = '';
        const { extension, logger } = createExtension();
        extension.show(root);
        expect(extension.initializations).toBe(0);
        expect(logger.warn).toHaveBeenCalledOnce();
    });
});
