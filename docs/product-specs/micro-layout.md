# Micro-layout

**Intent** — Micro-layout arranges the *contents* of a node or compartment — labels, icons, buttons — on the client, because SVG has no layout primitives of its own. Placing the nodes and routing the edges ("macro" layout) is deliberately left to graph layout engines such as ELK (see the layout rationale in `docs/ARCHITECTURE.md`). Downstream projects subclass `Layouter`, `StatefulLayouter`, and `HiddenBoundsUpdater`, and sprotty.org promises the semantics, so this is a compatibility contract.

## Behaviour contract

- A container element's `layout` property selects the algorithm (`stack`, `hbox`, or `vbox`; no micro-layout runs when it is unset); per-element `layoutOptions` control alignment, padding, gaps, and `paddingFactor` — enforced by `packages/sprotty/src/features/bounds/hbox-layout.spec.ts`, `packages/sprotty/src/features/bounds/vbox-layout.spec.ts`, `packages/sprotty/src/features/bounds/stack-layout.spec.ts`.
- Child positions are relative to their parent (documented at sprotty.org, micro-layout recipe) — (unverified)
- Children that are nodes (`SNodeImpl`) do not participate in the parent's micro-layout by default (documented at sprotty.org) — (unverified)
- Element bounds are measured from a live hidden rendering; only bounds belonging to the current `RequestBoundsAction` are dispatched, and results from hidden renderings with a different cause (e.g. SVG export) are discarded — enforced by `packages/sprotty/src/features/bounds/hidden-bounds-updater.spec.ts`.
- Micro-layout runs during the bounds round-trip, before macro layout; the negotiation between client and server is specified in `docs/product-specs/client-server-protocol.md` (single source — not repeated here).

## Deliberately not promised

- Micro-layout is **not re-run** after macro layout resizes an element — a known, accepted inconsistency: "centered" content can be off-center after server layout ([#27](https://github.com/eclipse-sprotty/sprotty/issues/27), maintainer-acknowledged, open since 2018).
- Pixel-exact measurement results across browsers and fonts — bounds come from the live DOM (`getBBox()`).
- Where **label layout** happens is the application's choice: either in the graph layout engine (via its layout options) or in client micro-layout. Node sizes, port positions, and label positions sit on the configurable boundary between engine and client, and Sprotty does not prescribe one side (maintainer statement, 2026-08-25).

## Surface

- Model: `layout`, `layoutOptions`, `SShapeElementImpl`, `InternalLayoutContainer`
- Layouters: `Layouter`, `StatefulLayouter`, `VBoxLayouter`, `HBoxLayouter`, `StackLayouter`, `AbstractLayout`
- Measurement: `HiddenBoundsUpdater`, `RequestBoundsAction` / `ComputedBoundsAction` (contract in the client-server spec)

## Pointers

- https://sprotty.org/docs/recipes/micro-layout/ — the user-facing semantics (contract source)
- https://sprotty.org/docs/recipes/layout-strategies/ — client vs. server vs. hybrid layout
- `docs/product-specs/client-server-protocol.md` — the bounds round-trip and layout negotiation
- `docs/ARCHITECTURE.md` — why the micro/macro split exists
