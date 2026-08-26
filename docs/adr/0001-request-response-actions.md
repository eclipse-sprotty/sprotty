---
status: accepted
date: 2019-09-03
superseded-by:
---

# ADR-0001: Generic request/response actions with `requestId` matching

*Recorded retroactively on 2026-08-25 from the original discussions ([#8](https://github.com/eclipse-sprotty/sprotty/issues/8), [#85](https://github.com/eclipse-sprotty/sprotty/issues/85)); the decision was implemented in [#103](https://github.com/eclipse-sprotty/sprotty/pull/103) (merged 2019-09-03, v0.7.0).*

## Context

Several ad-hoc request/response action pairs had accumulated (`RequestModelAction`/`SetModelAction`, `RequestPopupModelAction`/`SetPopupModelAction`, `RequestBoundsAction`/`SetBoundsAction`, `RequestExportSvgAction`/`ExportSvgAction` — the list in theia-ide/sprotty#218, quoted in #8), with no way to match a response to its request when multiple actions of the same kind are in flight ([#8](https://github.com/eclipse-sprotty/sprotty/issues/8)). Independently, external UI code (Theia keybindings, drag-and-drop) needed to read model state — selection, viewport — without breaking the encapsulation of the action/command cycle ([#85](https://github.com/eclipse-sprotty/sprotty/issues/85)).

## Options considered

1. **Keep ad-hoc pairs** — callers correlate by action kind only; breaks as soon as two same-kind requests overlap.
2. **Generic `RequestAction`/`ResponseAction`** — a `requestId` on every request, echoed by the response, with a promise-returning `IActionDispatcher.request()`; modeled on notifications-vs-requests in JSON-RPC (Jan Köhnlein's design comment in #8).
3. **Expose model state directly** (a queryable model service for external UI) — rejected in #85 in favor of model-inspection requests through the same action mechanism.

## Decision

Option 2: every request carries a generated `requestId`; the dispatcher resolves the matching promise when the response arrives ([#103](https://github.com/eclipse-sprotty/sprotty/pull/103)). `RejectAction` was added later for the failure path ([#184](https://github.com/eclipse-sprotty/sprotty/pull/184), v0.9.0), with its `detail` restricted to JSON-compatible types — "Not `any`, as these messages are likely to be serialized" (Jan Köhnlein).

## Consequences

- External components can inspect model state (selection, viewport) via request actions without new API surface.
- Promise continuations run outside the command transaction that produced the response — request callers must not assume they can still mutate that transaction (warning recorded in #8).
- Everything in the pattern is serializable, so it works unchanged across the wire (see ADR-0002).
- Client- and server-generated request ids can collide; namespacing (`setRequestContext`) was added later ([#385](https://github.com/eclipse-sprotty/sprotty/pull/385)).
- The current intended behaviour of the exchange is specified in `docs/product-specs/client-server-protocol.md`.
