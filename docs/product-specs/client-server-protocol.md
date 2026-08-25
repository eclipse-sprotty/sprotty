# Client–server protocol & layout negotiation

**Intent** — Sprotty diagrams can be driven by a remote server (Java or Node.js) that generates the model and optionally computes macro layout, with the browser client rendering and interacting. `sprotty-protocol` defines the wire contract both halves share so that servers never depend on browser code; one `DiagramServer` instance serves one client connection. Downstream projects (sprotty-vscode, sprotty-theia, GLSP, the Java server) build on this contract, so its behaviour is semver-relevant.

## Behaviour contract

Layout responsibility is negotiated by two flags — `needsClientLayout` (default `true`) and `needsServerLayout` (default `false`) — set in the client's `ViewerOptions` and transmitted to the server inside `RequestModelAction.options`:

- Neither flag: the server answers `RequestModelAction` with `SetModelAction` carrying final coordinates — enforced by `packages/sprotty-protocol/src/diagram-server.spec.ts` ("sets the model without client or server layout").
- Server layout only: the server runs its `ModelLayoutEngine` before sending `SetModelAction`/`UpdateModelAction` — enforced by `packages/sprotty-protocol/src/diagram-server.spec.ts` ("sets the model with server layout, but without client layout").
- Client layout only: the server sends `RequestBoundsAction` in place of a set/update, and the resulting `ComputedBoundsAction` is **not** sent back to the server (round-trip avoidance) — enforced by `packages/sprotty-protocol/src/diagram-server.spec.ts` ("requests bounds with client layout, but without server layout").
- Both flags: the client answers `RequestBoundsAction` with `ComputedBoundsAction`; the server applies the bounds, runs macro layout, and submits `UpdateModelAction` — enforced by `packages/sprotty-protocol/src/diagram-server.spec.ts` ("requests bounds with client and server layout, then processes the bounds").

Further promises:

- On the client, bounds requests are answered by measuring a hidden rendering — enforced by `packages/sprotty/src/features/bounds/hidden-bounds-updater.spec.ts`.
- `LocalModelSource` honours the same negotiation without a server (fixed vs. dynamic bounds mode) — enforced by `packages/sprotty/src/model-source/local-model-source.spec.ts`.
- Custom server behaviour registers through `ServerActionHandlerRegistry`; action kinds without a registered handler fall back to the built-in handling — enforced by `packages/sprotty-protocol/src/diagram-server.spec.ts` ("calls a registered action handler" / "does not call an unregistered action handler").
- Actions crossing the wire are plain JSON objects discriminated by `kind`; consumers never need `instanceof` (see ADR-0002) — (unverified)
- Request/response actions correlate via `requestId`, namespaced per context (`setRequestContext`) so client- and server-generated ids cannot collide (see ADR-0001) — (unverified)
- A server discards stale layout results by comparing the model `revision` — (unverified)
- Only action kinds registered for forwarding are sent to the server; applications with custom server-bound actions must register them (adjudicated in [#289](https://github.com/eclipse-sprotty/sprotty/issues/289); the how-to is in `docs/ARCHITECTURE.md`) — (unverified)
- `CommitModelAction` (fired e.g. when a move ends) replaces the external model held by the model source with a reduced copy of the internal model — the external model is not preserved by identity (adjudicated intended in [#177](https://github.com/eclipse-sprotty/sprotty/issues/177), which also lists the sanctioned workarounds) — (unverified)
- When the server regenerates the model (e.g. after a text edit), client-side manual changes such as user-moved positions are erased; persisting them is the application's responsibility (adjudicated intended in [#306](https://github.com/eclipse-sprotty/sprotty/issues/306)) — (unverified)
- Responses to *server-initiated* requests are forwarded back to the server — intended behaviour per the maintainer statement in [#445](https://github.com/eclipse-sprotty/sprotty/issues/445), currently not reliably implemented (open)

## Deliberately not promised

- Internals of the exchange: the `__receivedFromServer` marker, the request-id string format, and `DiagramServer`'s internal dispatch order may change in any release.
- Delivery of oversized messages: WebSocket transports may silently drop large messages (e.g. bounds payloads of big diagrams); chunking is the application's concern — tolerated limitation, [#102](https://github.com/eclipse-sprotty/sprotty/issues/102) (open since 2019).
- Behaviour not described in the sprotty.org documentation (actions-and-protocols recipe, API reference) or in this spec is not part of the compatibility contract and may change in minor releases (maintainer decision, 2026-08-25).

## Surface

- Server side: `DiagramServer`, `DiagramServices`, `IDiagramGenerator`, `IModelLayoutEngine`, `ServerActionHandlerRegistry`
- Wire: `ActionMessage`, `RequestModelAction`, `SetModelAction`, `UpdateModelAction`, `RequestBoundsAction`, `ComputedBoundsAction`
- Client side: `DiagramServerProxy`, `WebSocketDiagramServerProxy`, `LocalModelSource`
- Config: `needsClientLayout`, `needsServerLayout` (in `ViewerOptions` / `DiagramOptions`)

## Pointers

- https://sprotty.org/docs/recipes/actions-and-protocols/ — the user-facing narrative with sequence diagrams
- https://sprotty.org/docs/ref/sprotty-protocol/ — generated API reference
- `docs/adr/0002-sprotty-protocol-package-split.md` — why the contract lives in its own package
- Working reference: `examples/random-graph-distributed/` + `examples/server/`
