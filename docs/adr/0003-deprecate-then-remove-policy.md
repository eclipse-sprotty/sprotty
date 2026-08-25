---
status: accepted
date: 2023-05-17
superseded-by:
---

# ADR-0003: Deprecate in a minor release, remove in one sweep at the next major

*Recorded retroactively on 2026-08-25 from the v1.0 preparation threads ([#231](https://github.com/eclipse-sprotty/sprotty/issues/231), [#355](https://github.com/eclipse-sprotty/sprotty/pull/355), [#374](https://github.com/eclipse-sprotty/sprotty/pull/374)).*

## Context

Graduating from Eclipse incubation to v1.0 ([#231](https://github.com/eclipse-sprotty/sprotty/issues/231)) required breaking API cleanups (the `Impl` renaming, removal of legacy aliases), but Sprotty's downstream ecosystem (Theia, VS Code integrations, GLSP) needs migration windows — hard breaks in arbitrary releases would fracture it.

## Options considered

1. **Break directly** when a cleanup is ready — fastest for the framework, forces lockstep upgrades downstream.
2. **Deprecate first, remove at the major** — mark old API `@deprecated` with a pointer to the replacement in a minor release; remove all deprecated API in one sweep at the next major.

## Decision

Option 2. From [#355](https://github.com/eclipse-sprotty/sprotty/pull/355): "I would release v0.14.0 with this change ... so users can migrate gracefully with the deprecation notices. Then I'd remove all deprecated code when we shift to v1.0.0." Practiced at v1.0.0 ([#374](https://github.com/eclipse-sprotty/sprotty/pull/374): "we want to remove all API that has been deprecated in the past") and repeated for v2.0 (milestone 12, discussion [#489](https://github.com/eclipse-sprotty/sprotty/discussions/489)).

## Consequences

- Public API is never removed directly (the standing rule in `AGENTS.md`); every removal is a two-step spanning at least one minor and the next major.
- Deprecated aliases linger between majors — parallel names for the same concept are a standing cost (see ADR-0002's `SNode` vs `SNodeImpl` era).
- Breaking *interaction* changes follow the same rhythm: they wait for the major (e.g. the pointer-capture listener switch deferred to v2.0 in [#488](https://github.com/eclipse-sprotty/sprotty/pull/488)).
