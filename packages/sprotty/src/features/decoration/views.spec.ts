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

import toHTML from 'snabbdom-to-html';
import { SIssueSeverity } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { RenderingContext } from '../../base/views/view.js';
import { SIssueMarkerImpl } from './model.js';
import { IssueMarkerView } from './views.js';

describe('IssueMarkerView', () => {
    const view = new IssueMarkerView();

    function render(severities: SIssueSeverity[]): string {
        const marker = new SIssueMarkerImpl();
        marker.issues = severities.map(severity => ({ message: severity, severity }));
        return toHTML(view.render(marker, {} as RenderingContext));
    }

    it('marks the icon with the highest severity among the issues', () => {
        expect(render(['info'])).toContain('class="sprotty-issue sprotty-info"');
        expect(render(['info', 'warning'])).toContain('class="sprotty-issue sprotty-warning"');
        expect(render(['warning', 'error', 'info'])).toContain('class="sprotty-issue sprotty-error"');
    });

    it('renders a different icon for problems than for information', () => {
        expect(render(['error'])).not.toEqual(render(['info']));
        expect(render(['error'])).toEqual(render(['warning']).replace('sprotty-warning', 'sprotty-error'));
    });
});
