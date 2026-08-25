# Edge routing architecture

*Written 2026-08-25 as a design-history rescue from the original threads ([#51](https://github.com/eclipse-sprotty/sprotty/pull/51), [#208](https://github.com/eclipse-sprotty/sprotty/issues/208), [#226](https://github.com/eclipse-sprotty/sprotty/pull/226), [#246](https://github.com/eclipse-sprotty/sprotty/issues/246), [#247](https://github.com/eclipse-sprotty/sprotty/pull/247), [#245](https://github.com/eclipse-sprotty/sprotty/pull/245)); key mechanics verified against the code on that date. The current behaviour contract is `../product-specs/edge-routing.md`; this file keeps the why.*

## The 2019 redesign

PR [#51](https://github.com/eclipse-sprotty/sprotty/pull/51) (merged 2019-02-11) introduced the shape that still stands: routers behind an `EdgeRouterRegistry` keyed by the edge's `routerKind`, anchor computers behind an `AnchorComputerRegistry` keyed by `{router kind}:{anchor kind}`, routing state on `SRoutableElement`, and interactive routing handles as child elements of the edge. One judgment from the review survives as a behaviour rule: on *reconnecting* an edge, keeping the existing route makes no sense for manhattan routing (Jan Köhnlein) — as opposed to *moving* a node, where routes are deliberately preserved (see the product spec).

## Route pre-computation via view args ([#208](https://github.com/eclipse-sprotty/sprotty/issues/208) → [#226](https://github.com/eclipse-sprotty/sprotty/pull/226), v0.10.0)

The driving feature was line jumps at edge intersections, which need every edge's route *during* the rendering of each single edge — but views rendered edges one at a time, each running its router in isolation, with no route visible to any other view.

Alternatives weighed in #208:

1. **A per-pass rendering context** collecting routes as views produce them — routes only become available in render order, so an edge can't see the routes of edges rendered after it.
2. **An `IVNodePostprocessor` computing intersections after the fact** — rejected: "it would have to run the registered routers again ... which is inefficient, and then it would have to fiddle around with the path on SVG level, which seems a bit off."
3. **Parent-view pre-computation** — the parent view (e.g. `SGraphView`) computes all routes once via `EdgeRouterRegistry.routeAllChildren()` and passes them down to child views through view `args` (`IViewArgs`, `edgeRouting`). Chosen.

Consequences: custom graph root views **must** call `routeAllChildren` and pass the result via args, or edge views fall back to routing in isolation; analysis over the complete route set became possible through `IEdgeRoutePostprocessor`, which is where intersection detection (`IntersectionFinder`, #226) and junction dots (`JunctionFinder`, [#434](https://github.com/eclipse-sprotty/sprotty/pull/434)) plug in. Both ship as modules that are deliberately **not** in `loadDefaultModules` — opt-in by maintainer decision (2026-08-25).

## Multi-edge routers ([#246](https://github.com/eclipse-sprotty/sprotty/issues/246) → [#247](https://github.com/eclipse-sprotty/sprotty/pull/247))

The per-edge router interface cannot express routers that need the whole graph — the motivating case was obstacle-avoiding routing (a libavoid port). `IMultipleEdgesRouter` lets a router receive all its edges plus the root context; edges are grouped per router kind and routed as a group. The single-edge interface remains the default.

## Bezier support ([#245](https://github.com/eclipse-sprotty/sprotty/pull/245), v0.11.0)

Contributed as "preliminary support for cubic Bézier curve edges" with interactive add/remove of curve segments via +/− handles. Known accepted limitation: the intersection finder treats routes as straight segments, so bezier edges are excluded from line jumps (commit `9241c35`, issue [#287](https://github.com/eclipse-sprotty/sprotty/issues/287) — left open for future support).
