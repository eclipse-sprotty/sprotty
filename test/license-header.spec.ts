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

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Structural sensor: every TypeScript source file in the repository starts with the full
 * EPL-2.0 / GPL-2.0 license header, including the `SPDX-License-Identifier` line.
 * The rule itself is stated in AGENTS.md (Conventions).
 */

const repoRoot = join(import.meta.dirname, '..');
const scannedRoots = ['packages', 'examples', 'test'];
// Generated output, third-party code, and the Yeoman scaffold for user projects (which must not carry Sprotty's header).
const skippedDirectories = new Set(['node_modules', 'lib', 'app', 'resources', 'sprotty-local-template']);
const referenceFile = 'packages/sprotty/src/index.ts';

const expectedHeader: (string | RegExp)[] = [
    '/********************************************************************************',
    /^ \* Copyright \(c\) \d{4}(-\d{4})? .+ and others\.$/,
    ' *',
    ' * This program and the accompanying materials are made available under the',
    ' * terms of the Eclipse Public License v. 2.0 which is available at',
    ' * http://www.eclipse.org/legal/epl-2.0.',
    ' *',
    ' * This Source Code may also be made available under the following Secondary',
    ' * Licenses when the conditions for such availability set forth in the Eclipse',
    ' * Public License v. 2.0 are satisfied: GNU General Public License, version 2',
    ' * with the GNU Classpath Exception which is available at',
    ' * https://www.gnu.org/software/classpath/license.html.',
    ' *',
    ' * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0',
    ' ********************************************************************************/'
];

function collectSourceFiles(directory: string, result: string[] = []): string[] {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!skippedDirectories.has(entry.name)) {
                collectSourceFiles(join(directory, entry.name), result);
            }
        } else if (/\.tsx?$/.test(entry.name)) {
            result.push(join(directory, entry.name));
        }
    }
    return result;
}

function headerProblem(file: string): string | undefined {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    for (let i = 0; i < expectedHeader.length; i++) {
        const expected = expectedHeader[i];
        const actual = lines[i] ?? '<end of file>';
        const matches = typeof expected === 'string' ? actual === expected : expected.test(actual);
        if (!matches) {
            return `line ${i + 1}: expected ${typeof expected === 'string' ? JSON.stringify(expected) : expected}, found ${JSON.stringify(actual)}`;
        }
    }
    return undefined;
}

describe('license header', () => {
    it('is the full EPL-2.0 / GPL-2.0 block, including the SPDX line, in every source file', () => {
        const files = scannedRoots.flatMap(root => collectSourceFiles(join(repoRoot, root)));
        expect(files.length).toBeGreaterThan(0);
        const problems = files
            .map(file => ({ file: relative(repoRoot, file), problem: headerProblem(file) }))
            .filter(entry => entry.problem !== undefined)
            .map(entry => `  - ${entry.file}: ${entry.problem}`);
        const guidance = [
            `${problems.length} file(s) do not carry the full license header:`,
            ...problems,
            'Every source file starts with the 15-line EPL-2.0 / GPL-2.0 header including the SPDX-License-Identifier line',
            `(AGENTS.md, Conventions). Copy the block from ${referenceFile}, then set the current year and the`,
            'contributing organization in the copyright line.'
        ].join('\n');
        expect(problems, guidance).toEqual([]);
    });
});
