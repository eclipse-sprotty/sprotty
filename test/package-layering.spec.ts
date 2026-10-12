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
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Structural sensor for the two package-layering invariants stated in AGENTS.md ("Why and where"):
 * `sprotty-protocol` has no runtime dependencies, and in `sprotty-elk` the optional `inversify`
 * dependency is confined to `src/inversify.ts` so that the plain layout engine works without it.
 */

const repoRoot = join(import.meta.dirname, '..');

function collectSourceFiles(directory: string, result: string[] = []): string[] {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'lib') {
                collectSourceFiles(join(directory, entry.name), result);
            }
        } else if (/\.tsx?$/.test(entry.name) && !/\.spec\.tsx?$/.test(entry.name)) {
            result.push(join(directory, entry.name));
        }
    }
    return result;
}

/** Module specifiers a file loads at runtime: value imports, re-exports, and dynamic `import()` calls. */
function runtimeImports(file: string): string[] {
    const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
    const modules: string[] = [];
    const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
            modules.push(node.moduleSpecifier.text);
        } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && !node.isTypeOnly) {
            modules.push(node.moduleSpecifier.text);
        } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) {
            modules.push(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return modules;
}

describe('package layering', () => {
    it('sprotty-protocol has no runtime dependencies', () => {
        const manifest = JSON.parse(readFileSync(join(repoRoot, 'packages/sprotty-protocol/package.json'), 'utf8'));
        expect(manifest.dependencies, 'packages/sprotty-protocol/package.json declares "dependencies"; the package must have none').toBeUndefined();
        const offenders = collectSourceFiles(join(repoRoot, 'packages/sprotty-protocol/src'))
            .flatMap(file => runtimeImports(file).filter(module => !module.startsWith('.')).map(module => `  - ${relative(repoRoot, file)} imports '${module}'`));
        const guidance = [
            `${offenders.length} import(s) of external modules in sprotty-protocol:`,
            ...offenders,
            'sprotty-protocol runs in browsers and in Node and must stay free of runtime dependencies (AGENTS.md, "Why and where").',
            'Keep the code self-contained here or move it to the sprotty package. Type-only imports (`import type`) are fine.'
        ].join('\n');
        expect(offenders, guidance).toEqual([]);
    });

    it('sprotty-elk confines inversify to src/inversify.ts', () => {
        const offenders = collectSourceFiles(join(repoRoot, 'packages/sprotty-elk/src'))
            .filter(file => relative(repoRoot, file) !== 'packages/sprotty-elk/src/inversify.ts')
            .filter(file => runtimeImports(file).some(module => module === 'inversify' || module.startsWith('inversify/')))
            .map(file => `  - ${relative(repoRoot, file)}`);
        const guidance = [
            `${offenders.length} file(s) in sprotty-elk import inversify outside src/inversify.ts:`,
            ...offenders,
            'In sprotty-elk, inversify is an optional dependency wrapped only by src/inversify.ts; the plain layout engine',
            '(src/elk-layout.ts, used by adopters as `sprotty-elk/lib/elk-layout`) must work without it (AGENTS.md, "Why and where").',
            'Move the inversify-dependent code into src/inversify.ts.'
        ].join('\n');
        expect(offenders, guidance).toEqual([]);
    });
});
