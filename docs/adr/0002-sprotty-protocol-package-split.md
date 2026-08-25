---
status: accepted
date: 2021-11-10
superseded-by:
---

# ADR-0002: Extract the client-server contract into `sprotty-protocol` with plain-object actions

*Recorded retroactively on 2026-08-25 from the original discussions ([#243](https://github.com/eclipse-sprotty/sprotty/issues/243), [#233](https://github.com/eclipse-sprotty/sprotty/issues/233)) as part of the design-history rescue; the decision itself dates from the 2021 monorepo restructuring (commit `da2b66e`).*

## Context

Demand grew for Node.js diagram backends, but all shared data structures lived in the `sprotty` package, which contains browser code — a server depending on it drags the DOM stack into Node ([#243](https://github.com/eclipse-sprotty/sprotty/issues/243)). Independently, actions were classes: `instanceof` checks fail on actions received over the wire from LSP/GLSP servers or VS Code extensions, because those arrive as plain objects ([#233](https://github.com/eclipse-sprotty/sprotty/issues/233)).

## Options considered

1. **Keep one package** — servers depend on `sprotty` and tolerate the browser code; actions stay classes with `isXyzAction()` guards.
2. **Extract a shared package** — move the serializable model schema and the actions into a new dependency-free `sprotty-protocol`, redefine actions as `interface` + namespace (plain objects), keep runtime behavior in `sprotty`.

## Decision

Option 2: `sprotty-protocol` was created in the monorepo restructuring (commit `da2b66e`, 2021-11-10) holding the external SModel interfaces, the actions, and the server-side `DiagramServer`. The `sprotty` package keeps the runtime classes, renamed with the `Impl` suffix. To minimize breakage, the original declarations in `sprotty` were deprecated in place and removed only at v1.0.0 ([#374](https://github.com/eclipse-sprotty/sprotty/pull/374)).

## Consequences

- Node servers (and any backend) consume `sprotty-protocol` without browser code; the package must stay free of runtime dependencies.
- The parallel type hierarchies (`SNode` vs `SNodeImpl`, duplicated mixin interfaces) are the standing cost — the biggest newcomer/agent confusion in the codebase (see `docs/ARCHITECTURE.md`, "External vs internal model").
- Actions are plain data forever: `interface` + namespace with `KIND`/`create()`, never classes; wire consumers must not use `instanceof`.
- The deprecate-in-place → remove-at-major migration pattern established here became the repo's general API-evolution policy.
- Request-id collisions between client and server contexts later required namespacing (`setRequestContext`, [#385](https://github.com/eclipse-sprotty/sprotty/pull/385)).
