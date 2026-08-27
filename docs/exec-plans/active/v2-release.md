# Exec plan: Sprotty 2.0 release

- **Status**: active (in `docs/exec-plans/active/`; move the file to `completed/` when done)
- **Goal**: ship Sprotty 2.0.0 with the breaking changes collected in discussion [#489](https://github.com/eclipse-sprotty/sprotty/discussions/489) and milestone 12; done when the milestone items below are shipped or explicitly rejected and the packages are published.

## Decomposition

- [x] ESM migration (#515, merged 2026-08-24 — recorded as ADR-0006).
- [ ] Pointer-capture listener switch, so dragging survives leaving the canvas (#485): groundwork `PointerTool` landed in #488; the mouse→pointer listener switch itself was deferred to 2.0 as a breaking interaction change.
- [x] Inversify major upgrade (commit `313ad56`) — landed on **8**, not the 7 named in #489, which was superseded before this window; recorded as ADR-0007.
- [ ] Widen the inversify range from `~8.2` to `^8` once the 8.x line settles — the tighter pin is deliberate and temporary (ADR-0007).
- [ ] Re-evaluate the snabbdom `~3.5.1` pin — its rationale (pure-ESM snabbdom vs. CommonJS sprotty, #418) lapsed with the ESM migration (ADR-0006).
- [ ] Post-ESM dependency upgrades explicitly deferred in #515 ("Upgrading dependencies will come in a future PR").
- [ ] Remove the API deprecated since 1.0 in one sweep, per ADR-0003.

## Progress log

- 2026-08-25: Plan created by rescuing the decisions parked in discussion #489, milestone 12, and the #488/#515 threads (AX design-history work).
- 2026-08-27: Inversify item closed as done-on-8 and the range-widening follow-up split out, after the ADR-0007 record.

## Decision log

- 2026-08 (`313ad56`): inversify 8 (skipping the superseded 7), range `~8.2`, and downstream alignment no longer gates the range at a major — ADR-0007, superseding ADR-0004.
- 2026-08 (#515): ESM-only, no dual CJS/ESM build — ADR-0006.
- 2025-06 (#489): `SetModelCommand` stays in the base module; the extension mechanism is `rebind(SetModelCommand).to(...)` — a `features/set-model` module split was declined.
- 2025-05 (#488): the mouse→pointer listener switch is a breaking change and waits for 2.0.

## Open questions

- Which further milestone-12 items make the cut is maintainer-driven; this plan tracks only the decisions already recorded in threads.
