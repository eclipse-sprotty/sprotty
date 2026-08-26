# Rendering stack & performance strategy

*Written 2026-08-25 as a design-history rescue from the founders' public communication (sources at the end); mechanics verified against the code on that date. The performance principle's one-paragraph summary lives in `../ARCHITECTURE.md`; this file keeps the decisions, rejected alternatives, and the sanctioned application-level toolkit.*

## SVG over canvas/WebGL

SVG rendering is a founding decision, not a default: with a DOM-based renderer, user interaction (hit testing, event handling, CSS styling) comes from the browser for free, and "it's very easy to export a snapshot of such a diagram" (the `export` feature is exactly that). A canvas or WebGL renderer would be faster to paint but "you would need something else that helps you manage the user interaction". The accepted cost: the DOM gets big, and "it's really the browser that is the bottleneck here in practice" — DOM size and DOM patching, not virtual-DOM computation. The consequence is that performance work happens by *reducing what is rendered* (the toolkit below), never by swapping the renderer.

## snabbdom over React

The virtual-DOM library was chosen for raw patching speed: "we choose that one and not React because it's really lightning [fast]" (EclipseCon France 2018). The load profile that demands it: animations run through the browser's rendering loop and set a freshly interpolated model through the *whole* viewer cycle on every frame (`packages/sprotty/src/base/animations/animation.ts`) — so view `render` implementations and `IVNodePostprocessor`s execute per animation frame, not just per model change, and must stay cheap. Flicker-free animated transitions are a founding product value ("this is very important to us that we don't flicker"), including undo replaying the recorded motion backwards (`MoveCommand.undo` starts the move/morph animations in reverse) — which is why command execution is asynchronous everywhere.

## The application-level performance toolkit

Framework-built-in level-of-detail was deliberately scoped out ([#182](https://github.com/eclipse-sprotty/sprotty/pull/182)), and generalized filtering machinery likewise stayed out of core ("currently there's not much to generalize there", EclipseCon 2023). What the framework provides are the primitives; the techniques are applied in application code:

1. **Viewport culling** — views return early for elements outside the viewport (`ShapeView.isVisible` / `RoutableView.isVisible`). Edge culling deliberately tests only the whole route's bounding box against the canvas (`packages/sprotty/src/features/routing/views.ts`): visibility checks run per element per frame, so they "have to be fast … it's an approximation" — false positives are accepted by design; do not "fix" it to exact segment intersection. Culling is skipped for hidden (measurement/export) rendering — `targetKind === 'hidden'` must render everything.
2. **Zoom-dependent (level-of-detail) rendering** — the recommended idiom is plain case distinctions inside an application view's `render`: return `undefined` when not visible, then branch on the viewport zoom to render simplified representations below thresholds — or entirely different ones (merged shapes, placeholder text). Cheap by design; no framework machinery involved.
3. **Smart filtering** — run graph analysis as an app-side pre-processing pass *before* diagram generation, annotating elements with a CSS-like `display` property ("values like highlight, normal, faded-out or none — none means don't render this at all", EclipseCon 2023), possibly in multiple passes. Reference implementation: [TypeFox/sprotty-view-filtering](https://github.com/TypeFox/sprotty-view-filtering).
4. **Hierarchy + lazy loading** — for large models, represent hierarchy as nested (containment) nodes, collapse by default, and load/unload subgraph data on expand/collapse (the `expand` feature is designed for this — the whole model need not exist client-side). Hierarchy-crossing edges: "we recommend to use ports to split these connections" — collapsed containers keep their external connections visible, and layout engines handle port-split edges better. Reference implementation: [TypeFox/sprotty-nested-demo](https://github.com/TypeFox/sprotty-nested-demo).

## Layout engine choice

ELK was chosen for concrete capabilities the alternatives lacked: ports with position constraints ("crucial for … block diagrams where it's really important to see exactly from which port a connection is going out"), nested graphs, and hyperedges (EclipseCon 2023). Its sprawling configuration options are an acknowledged cost, not a Sprotty API problem. For large graphs, layout can run out of process — [TypeFox/elk-server](https://github.com/TypeFox/elk-server) via `SocketElkServer`/`StdioElkServer` (`packages/sprotty-elk/src/node/`) — which "can yield better performance for large graphs" than in-process elkjs (2022 post); the Node backends are a deliberate option, not dead code.

## Sources

- [sprotty — Graphical Views For Web Applications](https://www.youtube.com/watch?v=xv_Nn2wP9fE) (Köhnlein/Spönemann, EclipseCon France 2018) — snabbdom choice, animation values
- [High-performance graphical view filtering with Sprotty](https://www.youtube.com/watch?v=AH7K2N8-X0Q) (Bicker/Spönemann, EclipseCon 2023) — SVG rationale, culling, LOD, filtering, nesting, ELK capabilities
- [Textual and graphical languages for the cloud era](https://www.typefox.io/blog/textual-graphical-languages-cloud-era/) (Spönemann, 2022) — out-of-process ELK
- [Visualizing large hierarchical data](https://www.typefox.io/blog/visualizing-large-hierarchical-data/) (Fontorbe, 2023) — nesting + lazy loading pattern
