# Exec plan: Sprotty 2.0 release

- **Status**: active (in `docs/exec-plans/active/`; move the file to `completed/` when done)
- **Goal**: ship Sprotty 2.0.0 with the breaking changes collected in discussion [#489](https://github.com/eclipse-sprotty/sprotty/discussions/489) and milestone 12; done when the milestone items below are shipped or explicitly rejected and the packages are published.

## Decomposition

- [x] ESM migration (#515, merged 2026-08-24 — recorded as ADR-0006).
- [ ] Pointer-capture listener switch, so dragging survives leaving the canvas (#485): groundwork `PointerTool` landed in #488; the mouse→pointer listener switch itself was deferred to 2.0 as a breaking interaction change.
- [ ] Evaluate the inversify 7 upgrade — acceptable only at a major (#489); coordinate the range with Theia/GLSP per ADR-0004.
- [ ] Re-evaluate the snabbdom `~3.5.1` pin — its rationale (pure-ESM snabbdom vs. CommonJS sprotty, #418) lapsed with the ESM migration (ADR-0006).
- [ ] Post-ESM dependency upgrades explicitly deferred in #515 ("Upgrading dependencies will come in a future PR").
- [ ] Remove the API deprecated since 1.0 in one sweep, per ADR-0003.

## Progress log

- 2026-08-25: Plan created by rescuing the decisions parked in discussion #489, milestone 12, and the #488/#515 threads (AX design-history work).

## Decision log

- 2026-08 (#515): ESM-only, no dual CJS/ESM build — ADR-0006.
- 2025-06 (#489): `SetModelCommand` stays in the base module; the extension mechanism is `rebind(SetModelCommand).to(...)` — a `features/set-model` module split was declined.
- 2025-05 (#488): the mouse→pointer listener switch is a breaking change and waits for 2.0.

## Open questions

- Which further milestone-12 items make the cut is maintainer-driven; this plan tracks only the decisions already recorded in threads.
