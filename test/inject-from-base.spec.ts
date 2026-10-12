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

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Structural sensor for the InversifyJS 8 subclassing rule: a class that extends a class with
 * injected members (`@inject()` / `@multiInject()` on properties or constructor parameters,
 * directly or further up the chain) must carry `@injectFromBase()`. InversifyJS 8 does not pass
 * injection metadata down to subclasses; without the decorator the inherited dependencies resolve
 * to `undefined` and nothing throws (ADR-0007, gotcha in docs/ARCHITECTURE.md).
 *
 * The analysis is syntactic: it parses every source file, records classes, their decorators and
 * their `extends` clause, and resolves base classes through relative imports and the workspace
 * package names. A base it cannot resolve (external library, computed expression) imposes no
 * requirement. A class that is never resolved by a container can opt out with a comment directly
 * above it: `// inject-from-base: exempt — <reason>`.
 */

const repoRoot = join(import.meta.dirname, '..');
const scannedRoots = ['packages', 'examples'];
const skippedDirectories = new Set(['node_modules', 'lib', 'app', 'resources', 'sprotty-local-template']);
const injectDecorators = new Set(['inject', 'multiInject']);
const exemptionMarker = 'inject-from-base: exempt';
const referenceFile = 'packages/sprotty/src/features/viewport/center-fit.ts';

interface ClassInfo {
    name: string;
    file: string;
    line: number;
    pkg: string;
    hasInjectFromBase: boolean;
    hasInjectedMembers: boolean;
    exempt: boolean;
    base?: { name: string; module?: string };
}

function collectSourceFiles(directory: string, result: string[] = []): string[] {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!skippedDirectories.has(entry.name)) {
                collectSourceFiles(join(directory, entry.name), result);
            }
        } else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
            result.push(join(directory, entry.name));
        }
    }
    return result;
}

/** The workspace package or example an absolute file belongs to, e.g. `packages/sprotty`. */
function packageOf(file: string): string {
    return relative(repoRoot, file).split(sep).slice(0, 2).join('/');
}

function decoratorNames(node: ts.HasDecorators): string[] {
    return (ts.getDecorators(node) ?? []).map(decorator => {
        const expression = ts.isCallExpression(decorator.expression) ? decorator.expression.expression : decorator.expression;
        return ts.isIdentifier(expression) ? expression.text : '';
    });
}

function hasInjectDecorator(node: ts.HasDecorators): boolean {
    return decoratorNames(node).some(name => injectDecorators.has(name));
}

function analyzeFile(file: string): ClassInfo[] {
    const text = readFileSync(file, 'utf8');
    const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, kind);
    const imports = new Map<string, { module: string; name: string }>();
    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
            const bindings = statement.importClause?.namedBindings;
            if (bindings && ts.isNamedImports(bindings)) {
                for (const element of bindings.elements) {
                    imports.set(element.name.text, { module: statement.moduleSpecifier.text, name: (element.propertyName ?? element.name).text });
                }
            }
        }
    }
    const classes: ClassInfo[] = [];
    const visit = (node: ts.Node) => {
        if (ts.isClassDeclaration(node) && node.name) {
            const extendsClause = node.heritageClauses?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword);
            const baseExpression = extendsClause?.types[0]?.expression;
            let base: ClassInfo['base'];
            if (baseExpression && ts.isIdentifier(baseExpression)) {
                const imported = imports.get(baseExpression.text);
                base = imported ? { name: imported.name, module: imported.module } : { name: baseExpression.text };
            }
            const leadingComments = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
            classes.push({
                name: node.name.text,
                file,
                line: sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile)).line + 1,
                pkg: packageOf(file),
                hasInjectFromBase: decoratorNames(node).includes('injectFromBase'),
                hasInjectedMembers: node.members.some(member =>
                    (ts.isPropertyDeclaration(member) && hasInjectDecorator(member))
                    || (ts.isConstructorDeclaration(member) && member.parameters.some(hasInjectDecorator))),
                exempt: leadingComments.some(range => text.slice(range.pos, range.end).includes(exemptionMarker)),
                base
            });
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return classes;
}

function unique<T>(candidates: T[] | undefined): T | undefined {
    return candidates?.length === 1 ? candidates[0] : undefined;
}

function resolveRelativeModule(fromFile: string, module: string): string | undefined {
    const target = resolve(dirname(fromFile), module);
    const candidates = [target.replace(/\.js$/, '.ts'), target.replace(/\.js$/, '.tsx'), `${target}.ts`, `${target}.tsx`, join(target, 'index.ts')];
    return candidates.find(candidate => existsSync(candidate));
}

describe('@injectFromBase()', () => {
    const files = scannedRoots.flatMap(root => collectSourceFiles(join(repoRoot, root)));
    const classes = files.flatMap(analyzeFile);
    const classesByFile = new Map<string, ClassInfo[]>();
    const classesByPackage = new Map<string, Map<string, ClassInfo[]>>();
    for (const cls of classes) {
        classesByFile.set(cls.file, [...(classesByFile.get(cls.file) ?? []), cls]);
        const byName = classesByPackage.get(cls.pkg) ?? new Map<string, ClassInfo[]>();
        byName.set(cls.name, [...(byName.get(cls.name) ?? []), cls]);
        classesByPackage.set(cls.pkg, byName);
    }
    const workspacePackages = new Map<string, string>();
    for (const entry of readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })) {
        const manifest = join(repoRoot, 'packages', entry.name, 'package.json');
        if (entry.isDirectory() && existsSync(manifest)) {
            workspacePackages.set(JSON.parse(readFileSync(manifest, 'utf8')).name, `packages/${entry.name}`);
        }
    }

    const lookupInPackage = (pkg: string, name: string) => unique(classesByPackage.get(pkg)?.get(name));
    const resolveBase = (cls: ClassInfo): ClassInfo | undefined => {
        if (!cls.base) {
            return undefined;
        }
        const { name, module } = cls.base;
        if (module === undefined) {
            return unique(classesByFile.get(cls.file)?.filter(candidate => candidate.name === name));
        }
        if (module.startsWith('.')) {
            const targetFile = resolveRelativeModule(cls.file, module);
            const inTargetFile = targetFile ? unique(classesByFile.get(targetFile)?.filter(candidate => candidate.name === name)) : undefined;
            // A miss in the target file means it re-exports the class from elsewhere in the same package.
            return inTargetFile ?? lookupInPackage(targetFile ? packageOf(targetFile) : cls.pkg, name);
        }
        const packageDir = workspacePackages.get(module);
        return packageDir ? lookupInPackage(packageDir, name) : undefined;
    };
    const inheritsInjectedMembers = (cls: ClassInfo, seen = new Set<ClassInfo>()): boolean => {
        if (seen.has(cls)) {
            return false;
        }
        seen.add(cls);
        if (cls.hasInjectedMembers) {
            return true;
        }
        const base = resolveBase(cls);
        return base !== undefined && inheritsInjectedMembers(base, seen);
    };

    it('resolves base classes across the workspace (guards against a vacuous pass)', () => {
        const resolved = classes.filter(cls => resolveBase(cls) !== undefined);
        expect(resolved.length).toBeGreaterThan(50);
        expect(classes.filter(cls => cls.hasInjectFromBase).length).toBeGreaterThan(10);
        expect(resolved.filter(cls => inheritsInjectedMembers(resolveBase(cls)!)).length).toBeGreaterThan(10);
    });

    it('is present on every class that extends a class with injected members', () => {
        const violations = classes
            .filter(cls => cls.base && !cls.hasInjectFromBase && !cls.exempt)
            .filter(cls => {
                const base = resolveBase(cls);
                return base !== undefined && inheritsInjectedMembers(base);
            })
            .map(cls => `  - ${relative(repoRoot, cls.file)}:${cls.line}: class ${cls.name} extends ${cls.base!.name}`);
        const guidance = [
            `${violations.length} class(es) extend a class with injected members but lack @injectFromBase():`,
            ...violations,
            'InversifyJS 8 does not pass injection metadata down to subclasses: without @injectFromBase(), the inherited',
            '@inject()/@multiInject() members resolve to undefined and nothing throws (ADR-0007; gotcha in docs/ARCHITECTURE.md).',
            `Fix: add \`@injectFromBase()\` next to \`@injectable()\` — see ${referenceFile}. If the base class has`,
            'constructor parameters that are not injected, mark them `@unmanaged()`. A class that is never resolved by a',
            `container (constructed with \`new\`) can opt out with a comment directly above it: \`// ${exemptionMarker} — <reason>\`.`
        ].join('\n');
        expect(violations, guidance).toEqual([]);
    });
});
