# Edge routing

**Intent** — Edges are routed between connectable elements by pluggable routers (polyline, manhattan, bezier), users can adjust routes interactively via handles, and manual adjustments survive sensible model operations. GLSP subclasses all routers and anchor computers and sprotty-vscode rebinds `ManhattanEdgeRouter`, so routing behaviour — not just signatures — is a compatibility contract. Sources: the tracker adjudications quoted below and the 2026-08-25 maintainer triage.

## Behaviour contract

- Manually set routing points are **preserved** when a connected node is moved; the base framework never clears routes implicitly (adjudicated intended in [#284](https://github.com/eclipse-sprotty/sprotty/issues/284): clearing "might be unexpected behavior … beautifully crafted routes … would be gone") — (unverified)
- When a container element is moved, the routing points of an edge follow only if the edge is a **child of that container** (adjudicated intended in [#193](https://github.com/eclipse-sprotty/sprotty/issues/193)) — (unverified)
- Source and target anchors are **not stored in the model**; they are computed on demand by the anchor computer registered under `{router kind}:{anchor kind}`, selected via the element's `anchorKind` property (adjudicated in [#315](https://github.com/eclipse-sprotty/sprotty/issues/315), explained in [#281](https://github.com/eclipse-sprotty/sprotty/issues/281)) — (unverified)
- Edge views outside the visible viewport are skipped during normal rendering but always rendered in the hidden context — enforced by `packages/sprotty/src/features/routing/views.spec.ts`.
- Connectable elements expose their incoming and outgoing edges via the model index, and route bounds are computable in absolute coordinates — enforced by `packages/sprotty/src/features/routing/model.spec.ts`.
- With `edgeIntersectionModule` loaded, crossings between straight polyline segments are detected (the basis for line jumps/gaps) — enforced by `packages/sprotty/src/features/edge-intersection/intersection-finder.spec.ts`.

## Deliberately not promised

- `edgeIntersectionModule` and `edgeJunctionModule` are **opt-in** and stay out of `loadDefaultModules` — maintainer decision (2026-08-25).
- Bezier edges are excluded from intersection detection/line jumps — accepted limitation ([#287](https://github.com/eclipse-sprotty/sprotty/issues/287), open for future work).
- The exact coordinates of computed routes and the post-processing each router applies may change in minor releases; only the preservation and anchor rules above are stable.
- When automatic (server/ELK) layout supplies bend points, the recommended router is plain polyline — other routers post-process routes and may alter engine output (maintainer guidance in [#298](https://github.com/eclipse-sprotty/sprotty/issues/298)).

## Surface

- Routers: `PolylineEdgeRouter`, `ManhattanEdgeRouter`, `BezierEdgeRouter`, `EdgeRouterRegistry`, `IMultipleEdgesRouter`, `AbstractEdgeRouter`
- Anchors: `AnchorComputerRegistry`, `IAnchorComputer`, `anchorKind`
- Model: `SConnectableElementImpl`, `SRoutableElementImpl`, `SRoutingHandleImpl`
- Analysis: `IEdgeRoutePostprocessor`, `IntersectionFinder`, `JunctionFinder`, `edgeIntersectionModule`, `edgeJunctionModule`

## Pointers

- `docs/design-docs/edge-routing.md` — the design rationale (route pre-computation via view args, rejected alternatives)
- `docs/ARCHITECTURE.md` — feature-module index entries for `routing`, `edge-intersection`, `edge-junction`
- [#368](https://github.com/eclipse-sprotty/sprotty/issues/368) — the routing-handle view registration pitfall and its resolution
