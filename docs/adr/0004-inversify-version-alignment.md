---
status: accepted
date: 2024-12-17
superseded-by:
---

# ADR-0004: Inversify as a regular dependency with a Theia-aligned caret range

*Recorded retroactively on 2026-08-25 from [#292](https://github.com/eclipse-sprotty/sprotty/pull/292), [#296](https://github.com/eclipse-sprotty/sprotty/issues/296), [#357](https://github.com/eclipse-sprotty/sprotty/pull/357), [#429](https://github.com/eclipse-sprotty/sprotty/pull/429), commit `bad4c45`, and [#477](https://github.com/eclipse-sprotty/sprotty/pull/477) (merged 2024-12-17, v1.4.0).*

## Context

InversifyJS dependency injection breaks if an application resolves more than one inversify version — "it is important that all dependent packages resolve the exact same version of inversify" (tortmayr in [#292](https://github.com/eclipse-sprotty/sprotty/pull/292), enumerating the integration matrix: standalone, Theia, VS Code webviews, Eclipse RCP, Angular/React apps, GLSP). Sprotty's version constraint therefore directly determines whether downstream stacks can compose.

## Options considered

1. **Exact-pinned regular dependency** — deterministic, but a hardlock "might block downstream projects" (it blocked a GLSP release, [#477](https://github.com/eclipse-sprotty/sprotty/pull/477)).
2. **`peerDependencies`** — delegates version resolution to the adopter; tried in [#357](https://github.com/eclipse-sprotty/sprotty/pull/357) (May 2023, together with the inversify 6 upgrade needed for TypeScript 5).
3. **Regular dependency with a caret range aligned to Theia's minimum** — floats within a compatible range, coordinated with the largest downstream constraint-setter.

## Decision

Option 3. The peer-dependency experiment was reverted in commit `bad4c45` (2024-02-16) because "yarn does not automatically install peerDependencies ... npm and pnpm are ok with that when using a lib. yarn is not!" (kaisalmen in the [#429](https://github.com/eclipse-sprotty/sprotty/pull/429) review; spoenemann: "then I would remove the peerDependency and just keep it as a dependency"). Since v1.4.0 the range is `^6.1.3`, "same as in Theia" ([#477](https://github.com/eclipse-sprotty/sprotty/pull/477)). In `sprotty-elk`, inversify is an `optionalDependencies` entry because the core layout code is inversify-free (see `docs/ARCHITECTURE.md`).

## Consequences

- Changing the inversify range is a downstream-coordination decision (Theia, GLSP), never a routine dependency bump — agents and Dependabot must not touch it in isolation.
- A major inversify upgrade (v7) happens only at a Sprotty major (position recorded in discussion [#489](https://github.com/eclipse-sprotty/sprotty/discussions/489)).
- Applications that end up with duplicated inversify (or duplicated sprotty) instances still break in subtle ways — see the open `Symbol` identity issue [#559](https://github.com/eclipse-sprotty/sprotty/issues/559).
