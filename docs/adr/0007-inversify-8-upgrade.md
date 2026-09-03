---
status: accepted
date: 2026-08-26
superseded-by:
---

# ADR-0007: Upgrade to InversifyJS 8 with a tilde range; downstream alignment no longer gates it

*Replaces [ADR-0004](0004-inversify-version-alignment.md), which recorded the 6.x-era policy.*

## Context

ADR-0004 settled three things for the 6.x era: inversify stays a regular dependency (not `peerDependencies`), on a caret range aligned to Theia's minimum, and a major upgrade waits for a Sprotty major — named there as v7, the current major at the time (discussion [#489](https://github.com/eclipse-sprotty/sprotty/discussions/489)). Two of those premises expired before Sprotty 2.0 opened.

**v7 is no longer the current line.** InversifyJS 7.0.0 shipped 2025-02-26 and ran to 7.11.0; 8.0.0 shipped 2026-03-14, and 8.2.3 (2026-07-23) is what Sprotty now resolves. Upgrading 2.0 to 7 would have adopted an already-superseded major and forced downstream through a second breaking migration soon after.

**InversifyJS 8 is a rewrite, not a bump.** The `interfaces` namespace, `toProvider`, `Container.createChild()`, the `Container.parent` setter, and `ctx.container` inside dynamic-value and factory bindings are all gone, and injection metadata is no longer inherited by subclasses. The migration touched 82 files (commit `313ad56`). Per-package migration notes are in the package CHANGELOGs; the resulting in-repo idioms are in `docs/ARCHITECTURE.md`.

What has *not* changed is the constraint that drove ADR-0004 in the first place: an application must resolve exactly one inversify instance, so Sprotty's range still determines whether downstream stacks can compose.

## Options considered

1. **Upgrade to inversify 7 at Sprotty 2.0** — honours the letter of ADR-0004 and #489, but adopts a superseded major and buys a second migration.
2. **Stay on inversify 6 through 2.0** — defers the rewrite, but strands Sprotty on an unmaintained line while downstreams move to 8, where the single-instance rule then makes them incompatible anyway.
3. **Upgrade to inversify 8 at Sprotty 2.0** — absorbs the rewrite inside the major that already carries breaking changes.

## Decision

Option 3, with two amendments to ADR-0004's policy.

**The range is `~8.2`, not a caret range.** InversifyJS 8 is roughly five months old and still moving (8.0.0 → 8.2.3 in four months). A tilde range keeps minor-version churn from propagating across the single-instance boundary while the line settles. This is a deliberate temporary tightening rather than a new standing rule — the revisit is a consequence below. Tilde has precedent here: v0.14.0 shipped `~6.0.1` before v1.4.0 widened to `^6.1.3`.

**Downstream alignment no longer gates the range.** ADR-0004 made the range a coordination decision with Theia and GLSP. At 2.0 Sprotty moves first and downstreams follow; the lockstep is deliberately broken at this major rather than holding the framework on a superseded DI container.

## Consequences

- ADR-0004's consequence that "a major inversify upgrade (v7) happens only at a Sprotty major" is discharged: the major upgrade landed at 2.0, on 8.
- ADR-0004's consequence that changing the range is "a downstream-coordination decision … never a routine dependency bump" no longer gates a *major* upgrade at a Sprotty major. It still holds within a major: Dependabot and agents must not widen, float, or bump `~8.2` on their own.
- Downstream stacks (Theia, GLSP, sprotty-vscode) cannot compose with Sprotty 2.0 until they are themselves on inversify 8. The single-instance rule makes this a hard cutover, not a gradual one — that cost is accepted, not avoided.
- Widening `~8.2` to `^8` once the 8.x line settles is a deliberate decision, tracked in `docs/exec-plans/active/v2-release.md`.
- Subclassing a Sprotty class now requires `@injectFromBase()` alongside `@injectable()`, and a missing decorator resolves the inherited dependencies to `undefined` **without raising** — no build, lint, or test sensor detects it. See the gotcha in `docs/ARCHITECTURE.md` and the lint-rule item in `docs/exec-plans/active/ax-remediation-roadmap.md`.
- `isInjectable` was removed from the public API without the deprecation cycle ADR-0003 otherwise requires. It read `Reflect.getMetadata('inversify:paramtypes')`, which InversifyJS 8 never populates, so no alias could have kept working. ADR-0003 does not currently carve out removals forced by a dependency; until it does, this is a precedent to cite narrowly, not to generalise from.
