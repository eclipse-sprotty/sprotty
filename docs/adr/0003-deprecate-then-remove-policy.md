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

- Public API is never removed directly (the standing rule in `AGENTS.md`); every removal is a two-step spanning at least one minor and the next major. The one exception is a removal a dependency forces — see the addendum below.
- Deprecated aliases linger between majors — parallel names for the same concept are a standing cost (see ADR-0002's `SNode` vs `SNodeImpl` era).
- Breaking *interaction* changes follow the same rhythm: they wait for the major (e.g. the pointer-capture listener switch deferred to v2.0 in [#488](https://github.com/eclipse-sprotty/sprotty/pull/488)).

## Addendum 2026-09-09: removals forced by a dependency

The decision is unchanged, but it assumes an alias *can* keep working through the deprecation window. Where a dependency change makes that impossible, the API may be removed in the same major release that adopts the dependency, without a preceding deprecation. The triggering case: `isInjectable` read `Reflect.getMetadata('inversify:paramtypes')`, which InversifyJS 8 never populates, so no alias could have kept it functional ([ADR-0007](0007-inversify-8-upgrade.md)); it was removed in 2.0 together with the upgrade.

Conditions, all taken from that case: the removal ships only at a major; the package CHANGELOG names the removed API and its replacement, or states that there is none; and the forcing dependency is cited. A removal that *could* have been aliased still follows the two-step rule.
