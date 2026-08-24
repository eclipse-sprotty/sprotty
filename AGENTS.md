# Sprotty

Sprotty is a web-based diagramming framework: TypeScript, SVG rendering through a snabbdom virtual DOM, InversifyJS dependency injection. This repo is an npm-workspaces monorepo (npm — the repo migrated off yarn) targeting Node 24 (CI) with TypeScript ~5.9, ESM with explicit `.js` extensions on relative imports. Published packages: `sprotty` (client framework), `sprotty-protocol` (shared actions/model, zero runtime deps), `sprotty-elk` (ELK layout integration), `sprotty-library` (prebuilt diagram elements), `generator-sprotty` (Yeoman scaffolding, CommonJS).

## Commands

```sh
npm install                       # ~10 s warm, longer on first clone
npm run build                     # tsc project build + webpack examples, ~7 s
npm run lint                      # eslint, ~3 s — errors gate, warnings don't
npm test                          # full vitest suite, 237 tests, ~2-5 s
npm run test -w sprotty           # tests of one package (any of the four lib packages)
npx vitest run --config vite.config.mts packages/sprotty/src/base/model/smodel.spec.ts   # single spec, <1 s
npm run coverage                  # v8 coverage report, ~2 s
npm run watch                     # tsc --watch (packages) + webpack --watch (examples)
npm run start -w examples         # examples at http://localhost:8080 (Express + WebSocket)
```

The suite is fast — run `npm test` after every change, not just at the end.

## Why and where

- `packages/sprotty-protocol/` — the wire format: serializable actions + model schema + server-side `DiagramServer`. Runs in browser and Node; **must stay free of runtime dependencies**.
- `packages/sprotty/` — the client framework. `src/base/` is the kernel (action dispatcher, command stack, viewers, DI `types.ts` + `di.config.ts`); `src/features/<feature>/` are optional feature modules; `src/graph/` the SGraph element classes and views; `src/lib/` opt-in helpers (JSX factories, `loadDefaultModules`); `src/model-source/` the client-server glue (`LocalModelSource`, `DiagramServerProxy`).
- `packages/sprotty-elk/` — ELK layout; `src/elk-layout.ts` is Inversify-free, `src/inversify.ts` wraps it (inversify is an *optional* dependency here).
- `examples/` — demo apps bundled by a single webpack build; see `examples/AGENTS.md` before touching them.
- Architecture, runtime model, and extension idioms: `docs/ARCHITECTURE.md`. Public docs (tutorials, concepts, API): https://sprotty.org/docs/ — topic→URL map at the end of `docs/ARCHITECTURE.md`.

## Conventions

- **Two parallel type systems.** `SNode`, `BoundsAware`, `SModelIndex`, … exist in *both* `sprotty-protocol` (serializable interfaces) and `sprotty` (runtime classes, `Impl` suffix: `SNodeImpl`). Data that crosses the wire or lives in a model source uses protocol types; command/view code uses `*Impl`. Auto-import picks the wrong one — check every import of a name that exists in both.
- Feature folders follow a fixed template: `di.config.ts` (ContainerModule), `model.ts` (feature symbol, interfaces, type guards, element classes), `<feature>.ts` (commands/listeners), `views.tsx`, co-located `*.spec.ts`. New public API is re-exported from `packages/sprotty/src/index.ts`; new DI symbols go into `TYPES` in `src/base/types.ts`.
- Actions are plain data: `interface XAction extends Action` + namespace with `KIND` and `create()` — never classes.
- Views: `.tsx` files start with `/** @jsx svg */` and import `svg` from the JSX lib; subclass `ShapeView` (or a more specific base) and early-return on `!this.isVisible(...)`.
- Every source file carries the full 15-line EPL-2.0/GPL-2.0 header including the `SPDX-License-Identifier` line — copy it from a neighboring file and set the current year. Lint only checks the copyright line; the rest of the block is required anyway. In the copyright line, name the contributing organization.
- Public API is never removed directly: mark `@deprecated` with a pointer to the replacement and keep an alias; removals happen only at the next major release.
- Tests build real Inversify containers (no mocks of the framework), assert views via `snabbdom-to-html`, use `happy-dom` for DOM. Helpers stay local to the spec file.

## Boundaries and definition of done

- Never edit generated output: `packages/*/lib/`, `packages/generator-sprotty/app/`, `examples/lib/`, `examples/resources/`, `*.tsbuildinfo`.
- Never bump version numbers or touch `.github/workflows/publish.yml` — releases are maintainer-driven.
- Do not edit `CHANGELOG.md` files per change; they are batched by maintainers at release time.
- Done means: `npm run build`, `npm run lint` (0 errors), and `npm test` all pass locally, output shown.
- A bugfix includes a co-located regression spec (`*.spec.ts` next to the fixed file).
- If reality contradicts this file or `docs/`, fix the doc as part of the change — never silently work around it.

## PR conventions

- Commit subjects: imperative sentence case, no `feat:`/`fix:` prefixes (squash-merge appends the `(#NNN)` PR number).
- External contributors need an Eclipse ECA and `Signed-off-by` (see `CONTRIBUTING.md`); committers omit the sign-off.

## Pointers

- `docs/ARCHITECTURE.md` — package topology, runtime cycle, extension points, gotchas.
- `examples/AGENTS.md` — how examples are built, run, and added.
- `docs/adr/` — decision records; do not contradict accepted ADRs.
- `docs/exec-plans/` — multi-session work gets a plan in `active/`; move it to `completed/` when done.
- https://sprotty.org/docs/ — the public documentation (concepts live there, not in this repo).
