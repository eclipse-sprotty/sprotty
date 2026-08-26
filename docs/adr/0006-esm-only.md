---
status: accepted
date: 2026-08-24
superseded-by:
---

# ADR-0006: ESM-only packages for Sprotty 2.0

## Context

The published packages were CommonJS while the ecosystem moved to ESM: snabbdom went pure-ESM at 3.6 and broke consumers, forcing a pin to `~3.5.1` ([#418](https://github.com/eclipse-sprotty/sprotty/issues/418)); users asked for browser-native/CDN consumption (discussion [#508](https://github.com/eclipse-sprotty/sprotty/discussions/508)); the v2.0 planning discussion collected the migration as a headline item ([#489](https://github.com/eclipse-sprotty/sprotty/discussions/489): "I think we should migrate the codebase to ESM").

## Options considered

1. **Stay CommonJS** — keeps old consumers working, locks the project out of ESM-only dependencies.
2. **Dual CJS/ESM build** — not taken up; no debate about it is recorded in [#515](https://github.com/eclipse-sprotty/sprotty/pull/515).
3. **ESM-only** — `"type": "module"` in the four library packages, TypeScript `module: Node20` / `moduleResolution: NodeNext`.

## Decision

Option 3, implemented in [#515](https://github.com/eclipse-sprotty/sprotty/pull/515) (merged 2026-08-24, targeted at 2.0.0): `sprotty`, `sprotty-protocol`, `sprotty-elk`, and `sprotty-library` are ESM-only; `generator-sprotty` stays CommonJS (Yeoman). Explicit `.js` extensions on relative imports are a mechanical consequence of `NodeNext` resolution, not a separate choice. Dependency upgrades were explicitly deferred: "Upgrading dependencies will come in a future PR" (#515).

## Consequences

- CommonJS consumers must migrate to import Sprotty ≥ 2.0; this is part of the 2.0 breaking-change sweep (see ADR-0003).
- The snabbdom `~3.5.1` pin's reason has lapsed — unpinning is re-evaluated in `docs/exec-plans/active/v2-release.md`.
- The build now emits ES2022, where class fields declared without initializer exist with value `undefined` — `'prop' in element` feature checks became unreliable (found in the #515 review; see the gotcha in `docs/ARCHITECTURE.md`).
