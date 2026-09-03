# Sprotty architecture

A map for working on the framework itself. The public documentation at https://sprotty.org/docs/ explains the concepts for *users* of Sprotty; this file records what you need to change the framework safely. Paths are repo-relative.

## Packages

```
sprotty-protocol   (leaf — zero runtime deps; browser + Node)
      ▲        ▲          ▲
      │        │          │
   sprotty  sprotty-elk   │
      ▲          │        │
      │          └────────┘
 sprotty-library (depends on sprotty + sprotty-protocol)

 generator-sprotty (isolated Yeoman generator, CommonJS, no sprotty deps)
 examples          (private workspace; depends on sprotty, sprotty-elk, sprotty-library)
```

Build order is fixed by TypeScript project references in `tsconfig.build.json`. The four library packages have `tsconfig.src.json` (emits to `lib/`, excludes specs) and — except `sprotty-library`, which has no tests — `tsconfig.test.json` (`noEmit`, specs only); `generator-sprotty` has neither. Every package's plain `tsconfig.json` exists for editor support.

## The runtime cycle

Everything is driven by **actions** (plain serializable data). The cycle, all in `packages/sprotty/src/base/`:

1. An event (user input, model source message) produces an `Action`.
2. `ActionDispatcher` (`actions/action-dispatcher.ts`) looks up handlers in the `ActionHandlerRegistry`. Command-backed handlers create an `ICommand`.
3. `CommandStack` (`commands/command-stack.ts`) executes commands strictly sequentially (each chained on `currentPromise`), maintains `undoStack`/`redoStack`/`offStack`, and holds **three model slots**: main, hidden, popup.
4. Each slot is pushed to its viewer: `ModelViewer` (patches `#sprotty` via snabbdom), `HiddenModelViewer` (`#sprotty-hidden`, invisible, used for measuring), `PopupModelViewer` (`#sprotty-popup`). Viewers render by looking up each element's `IView` in the `ViewRegistry` by `element.type`, then run the `IVNodePostprocessor` chain.
5. Rendering and listeners produce new actions; the cycle repeats.

*Why a unidirectional cycle*: MVC was deliberately rejected — direct component wiring produces micro-events and feedback loops ("you zoom in and it zooms in to infinity"); the Flux/React-inspired circular flow keeps the components near-stateless and unit-testable without a browser (EclipseCon France 2018 talk). Flicker-free animated transitions are a founding promise — undo even replays a recorded motion backwards (`MoveCommand.undo`) — which is why command execution is asynchronous everywhere, and why snabbdom was chosen over React: every animation frame pushes a freshly interpolated model through the whole viewer cycle, so views and postprocessors run per frame and must stay cheap. Design history: `docs/design-docs/rendering-and-performance.md`.

Command base classes in `commands/command.ts` encode the semantics: `Command` (undoable), `MergeableCommand` (consecutive commands collapse into one undo step), `HiddenCommand` (renders to the hidden viewer only), `PopupCommand`, `SystemCommand` (transparent to user undo/redo), `ResetCommand` (clears all stacks), `ModelRequestCommand` (responds without changing the model).

**The bounds round-trip** is the most distinctive flow: `RequestBoundsAction` → `RequestBoundsCommand` (a `HiddenCommand` with `blockUntil: ComputedBoundsAction`) → hidden render → `HiddenBoundsUpdater` reads `getBBox()` from the live hidden SVG, runs micro-layout (`Layouter`), dispatches `ComputedBoundsAction`. Client/server layout negotiation happens via `needsClientLayout` / `needsServerLayout`, which are set in `ViewerOptions` but travel to the server inside `RequestModelAction.options`.

*Why measure by rendering*: rendering to the DOM is the only way to get the real bounds of SVG content (text especially), and rendering visibly first causes flicker — hence the dedicated hidden viewer. The hidden div is hidden by zero size, deliberately *not* `display: none` (`.sprotty-hidden` in `css/sprotty.css`): the browser must actually render it or `getBBox()` has nothing to measure; a `revision` on `ComputedBoundsAction` guards against stale bounds from overlapping round-trips (design history: theia-ide/sprotty#48 and #171 — the pre-Eclipse tracker, rescued here because that repo is outside the org's control).

*Why layout is split micro/macro*: micro-layout (the `bounds` feature) arranges contents *within* nodes on the client, because SVG has no layout primitives (historically not even portable vertical text centering). Macro layout — placing nodes, routing edges — is delegated to graph layout engines (`sprotty-elk` → ELK): graph layout is an academic domain of mostly NP-hard optimization problems, which is why few libraries exist (elkjs is cross-compiled from the Java ELK project, rooted in academic work at Kiel University started around 2008). ELK specifically was picked for ports with position constraints, nested graphs, and hyperedges; for large graphs the engine can run out of process (`SocketElkServer`/`StdioElkServer` → [TypeFox/elk-server](https://github.com/TypeFox/elk-server)) — see `docs/design-docs/rendering-and-performance.md`. The engine/client boundary is configurable via layout options but gets complicated at node sizes, port positions, and label positions — label layout in particular is a per-application choice between the engine and client micro-layout (maintainer, 2026-08-25; "We stick with the ELK / client layout separation as is" — theia-ide/sprotty#180). Behaviour contract: `docs/product-specs/micro-layout.md`.

*Performance principle*: SVG rendering is a founding decision (DOM events give interaction for free, snapshot export is trivial; canvas/WebGL rejected), so the bottleneck is DOM size and DOM patching, not virtual-DOM computation. That is why default views return early for elements outside the viewport (`ShapeView`/`RoutableView.isVisible` — the origin of the convention in `AGENTS.md`; edge culling deliberately tests only the route's bounding box, an approximation chosen for speed) and why thunk views exist (skip re-patching unchanged elements); SVG export renders through the hidden context and must **not** skip invisible elements. Level-of-detail rendering was deliberately scoped out of the *framework* (PR #182) — zoom-dependent rendering inside application views is the recommended idiom; the full large-model toolkit (culling, LOD, filtering, nested lazy loading) is in `docs/design-docs/rendering-and-performance.md`.

*Input tools* are deliberately parallel: `MouseTool`, `TouchTool` (PR #475), and `PointerTool` (PR #488), all in `base/views/`. Touch gets its own `ITouchListener` interface so one listener class can implement both `IMouseListener` and `ITouchListener` and register for both; `PointerTool` is groundwork for pointer capture — the actual mouse→pointer listener switch is a breaking change deferred to v2.0 (`docs/exec-plans/active/v2-release.md`).

## External vs internal model

Two deliberate parallel hierarchies — the single biggest source of confusion:

| | External (schema) | Internal (runtime) |
|---|---|---|
| Where | `packages/sprotty-protocol/src/model.ts` | `packages/sprotty/src/base/model/smodel.ts`, `src/graph/sgraph.ts` |
| Shape | plain serializable interfaces: `SNode`, `SEdge`, `SGraph`, … | classes with behavior: `SNodeImpl`, `SEdgeImpl`, `SGraphImpl`, … |
| Used by | model sources, `DiagramServer`, anything crossing the wire | commands, views, everything inside the client |

Conversion is done by `SModelFactory` (`base/model/smodel-factory.ts`) via reflection: properties named `children`/`parent`/`index` and **any property with a getter** are silently skipped in both directions. Several mixin interface names (`BoundsAware`, `Selectable`, `LayoutContainer`, …) exist in both packages with different meanings; the `sprotty`-side legacy aliases are `@deprecated` and the current internal ones are prefixed `Internal` (`features/bounds/model.ts`).

**Features** are `symbol`s in a per-element `FeatureSet` (don't confuse with the framework features in `packages/sprotty/src/features/`). Element classes declare `static readonly DEFAULT_FEATURES`; `configureModelElement(context, type, Impl, View, { enable, disable })` customizes per registration.

## Dependency injection

- The scope of a container is **one diagram instance** — several diagrams on one page mean several containers, so "singleton" always means singleton-per-diagram, and state shared across diagrams must be passed in explicitly.
- All DI symbols live in the single `TYPES` object, `packages/sprotty/src/base/types.ts`.
- Every framework feature exports a `ContainerModule` from its `di.config.ts`. Since inversify 8 the callback takes **one options object**, not positional arguments: `new ContainerModule(({ bind, isBound, rebind }) => …)`. `loadDefaultModules(container)` (`src/lib/modules.ts`) loads the default set — **`edgeIntersectionModule` and `edgeJunctionModule` are deliberately not in it**, and `projection`/`nameable` have no DI module at all.
- Ordering matters: `loadDefaultModules` first, then extra sprotty modules, then the app module last — app modules use `rebind` and `overrideModelElement`, which throw if the default binding isn't there yet. Double registration throws `Key is already registered`. In the options object `rebind` is the **synchronous** one (type `RebindSync`); the promise-returning variant is `rebindAsync` — the bare `Rebind` type name is the async one.
- Composition idiom: `bind(X).toSelf().inSingletonScope()` + `bind(TYPES.SomeRole).toService(X)` so one singleton serves several multi-inject roles.
- There are **no child containers**: inversify 8 removed `Container.createChild()` and the `Container.parent` setter (a parent now goes to the constructor as `new Container({ parent })`), and the resolution context inside `toDynamicValue`/`toFactory` has no `.container`. Use `ctx.get(X)`, and `ctx.get(X, { optional: true })` where v6 code guarded with `ctx.container.isBound(X)`. Providers are `bind<TheProviderType>(TYPES.X).toFactory(…)` — `toProvider` is gone.
- The event cycle (dispatcher ↔ command stack ↔ viewer) is only breakable via providers: `TYPES.IActionDispatcherProvider`, `ICommandStackProvider`, `ActionHandlerRegistryProvider`, `ModelSourceProvider`, `IViewerProvider`. Injecting these directly instead of via provider recreates the cycle.
- Configuration helpers (all take a `context = { bind, unbind, isBound, rebind }`, destructured from the module options object): `configureModelElement`, `overrideModelElement`, `configureView`, `registerModelElement` (`base/views/view.tsx`, `base/model/smodel-utils.ts`), `configureCommand` (`base/commands/command-registration.ts`), `configureActionHandler` / `onAction` (`base/actions/action-handler.ts`), `configureLayout`, `configureButtonHandler`, `configureViewerOptions`.

## Feature module index

One line per module in `packages/sprotty/src/features/` — purpose and the symbols to search for. All are in `loadDefaultModules` unless marked otherwise.

| Module | What it does | Key symbols |
|---|---|---|
| `bounds` | micro-layout + bounds measurement | `SetBoundsCommand`, `RequestBoundsCommand`, `HiddenBoundsUpdater`, `Layouter`, `VBoxLayouter`/`HBoxLayouter`/`StackLayouter`, `SShapeElementImpl`, `ShapeView` |
| `button` | clickable buttons on elements | `SButtonImpl`, `ButtonHandlerRegistry`, `configureButtonHandler` |
| `command-palette` | searchable action UI overlay | `CommandPalette`, `ICommandPaletteActionProvider`, `RevealNamedElementActionProvider` |
| `context-menu` | context menus | `IContextMenuService`, `IContextMenuItemProvider`, `ContextMenuMouseListener` |
| `decoration` | issue markers on elements | `SIssueMarkerImpl`, `IssueMarkerView`, `DecorationPlacer` |
| `edge-intersection` | edge-crossing detection (sweepline) | `IntersectionFinder` — **not in defaults** |
| `edge-junction` | junction dots where edges share segments | `JunctionFinder`, `JunctionPostProcessor` — **not in defaults** |
| `edge-layout` | placing labels on/along edges | `EdgePlacement`, `EdgeLayoutPostprocessor` |
| `edit` | label editing, element create/delete, edge reconnect | three modules: `edgeEditModule`, `labelEditModule`, `labelEditUiModule`; `EditLabelUI`, `ApplyLabelEditCommand`, `DeleteElementCommand`, `ReconnectCommand`, `SwitchEditModeCommand` |
| `expand` | collapse/expand buttons | `ExpandButtonHandler`, `ExpandButtonView` |
| `export` | SVG export via hidden rendering | `SvgExporter`, `ExportSvgCommand`, `ISvgExportPostprocessor` |
| `fade` | fade animations on model updates | `FadeAnimation`, `ElementFader` |
| `hover` | hover feedback + popups | `HoverMouseListener`, `SetPopupModelCommand`, `PopupPositionUpdater` |
| `move` | dragging with snapping + move animations | `MoveCommand` (mergeable), `MoveMouseListener`, `ISnapper`/`CenterGridSnapper`, `MorphEdgesAnimation` |
| `nameable` | the `nameFeature` symbol only | model.ts only — **no DI module** |
| `open` | double-click → `OpenAction` | `OpenMouseListener` |
| `projection` | projection bars (scrollbar-style viewport overview) | `ProjectedViewportView` — **no DI module**, wire manually |
| `routing` | edge routers, anchors, routing handles | `PolylineEdgeRouter`/`ManhattanEdgeRouter`/`BezierEdgeRouter`, `EdgeRouterRegistry`, `AnchorComputerRegistry`, `SConnectableElementImpl`, `SRoutingHandleImpl` |
| `select` | selection state + interaction | `SelectCommand`, `SelectMouseListener`, `GetSelectionCommand` |
| `undo-redo` | keyboard bindings for undo/redo | `UndoRedoKeyListener` (the stacks live in `CommandStack`) |
| `update` | model diffing + animated transitions | `UpdateModelCommand`, `ModelMatcher` |
| `viewport` | scroll, zoom, center, fit-to-screen | `CenterCommand`, `FitToScreenCommand`, `SetViewportCommand`, `ViewportAnimation`, `ViewportRootElementImpl` |
| `zorder` | bring-to-front | `BringToFrontCommand` |

## Client–server

The split is consciously modeled on LSP's smart-server/dumb-client pattern: the client holds only the *view model* of the current diagram, all semantic knowledge (and the bulk of the data) stays behind the model source or server — the SModel is a computed projection, never the source of truth. The doctrine and its consequences (no bidirectional sync, no SModel persistence, manual reconciliation) are in `docs/design-docs/view-model-doctrine.md`.

Both halves are called "diagram server" — keep them apart:

- **Server side**: `DiagramServer` (`packages/sprotty-protocol/src/diagram-server.ts`), one instance per client, constructed with `(dispatch, services)` where `DiagramServices` supplies `DiagramGenerator`, optional `ModelLayoutEngine`, optional `ServerActionHandlerRegistry`.
- **Client side**: `ModelSource` implementations in `packages/sprotty/src/model-source/` — `LocalModelSource` (imperative facade, no server) and `DiagramServerProxy` / `WebSocketDiagramServerProxy` (forwards a fixed set of actions, marks inbound ones with `__receivedFromServer` to avoid echo).
- `modelSourceModule` deliberately does **not** bind `TYPES.ModelSource` — every app must choose one.

## Ecosystem and scope

Sprotty is deliberately *viewer-first*: read-only, generated diagrams are a first-class use case, and the layers around it set its scope boundaries — changes to the protocol or the DI wiring propagate into all of them:

- **Eclipse GLSP** — the graphics-first diagram *editing* framework, built on Sprotty's view model and rendering. Full editing tooling (palettes, edit-operation frameworks) is deliberately GLSP's ground; don't scope-creep it into sprotty core.
- **sprotty-vscode** — the maintained IDE integration: the diagram runs in a webview (an isolated iframe), the extension relays JSON messages between webview and (optional) language server. Over LSP the whole protocol travels through the single notification `diagram/accept` carrying an `ActionMessage` — extension means new action kinds, never new RPC methods. The direct Theia integration (sprotty-theia) died when Theia deprecated `@theia/languages` in v1.4.0 (2020); VS Code extensions run in Theia too, so this is also the Theia path.
- **langium-sprotty** — embeds `DiagramServer` *inside* the language-server process; one reason `sprotty-protocol` must stay dependency-free and Node-safe.
- **Java servers** — the original Sprotty server was Java/Xtend (pre-Eclipse era; Sprotty started at TypeFox in 2017 and moved to the Eclipse Foundation in 2018), and Java peers still speak the wire format — protocol changes must not assume a TypeScript-only counterpart.

For language-server scenarios the editing doctrine is text-first — the diagram is derived from the text, never the reverse: `docs/design-docs/view-model-doctrine.md`.

## How to add things

**A new action, end to end:**
1. `packages/sprotty-protocol/src/actions.ts` — `interface` + namespace with `KIND`/`create()` (only if it crosses the wire; purely client-side actions live next to their command in `sprotty`). Actions model coarse-grained semantic operations (set a model, apply a layout) — not per-property mutations.
2. The command or handler in `packages/sprotty/src/features/<feature>/` — commands need `static readonly KIND`, `@injectable()`, and `@inject(TYPES.Action)` in the constructor. A command that *subclasses* another command also needs `@injectFromBase()`, and any base-class constructor parameter that is not injected needs `@unmanaged()` (`features/viewport/center-fit.ts` shows both).
3. `configureCommand` / `configureActionHandler` in that feature's `di.config.ts`.
4. Re-export from `packages/sprotty/src/index.ts`; add the module to `loadDefaultModules` if it should be on by default.
5. If servers must see it: `ServerActionHandlerRegistry` or a branch in `DiagramServer.handleAction`, plus forwarding registration in `DiagramServerProxy.initialize`.
6. A co-located `*.spec.ts`.

**A new model element type:** class with `DEFAULT_FEATURES` in `<feature>/model.ts` or `graph/sgraph.ts`; view in `views.tsx`; one `configureModelElement` line; protocol-side interface in `sprotty-protocol/src/model.ts` if serializable.

## Gotchas

- `blockUntil` deadlocks silently: `SetModelCommand` waits for `InitializeCanvasBoundsCommand`, `RequestBoundsCommand` waits for `ComputedBoundsAction`. If the DOM div is missing or layout flags are misconfigured, actions queue in `postponedActions` forever and the diagram just freezes.
- A postprocessor bound only to `TYPES.IVNodePostprocessor` does not run during hidden or popup rendering — bounds computation needs `TYPES.HiddenVNodePostprocessor` too.
- Some `TYPES` symbol descriptions don't match their keys (`HiddenVNodePostprocessor: Symbol('HiddenVNodeDecorator')`, `IAnchorComputer: Symbol('IAnchor')`); the four context-menu symbols use `Symbol.for` while everything else uses `Symbol`. Match on the *key*, never the description.
- `CreateElementCommand` (`features/edit/create.ts`) is exported but not registered anywhere — apps must `configureCommand` it themselves or `CreateElementAction` hits "missing handler".
- Subclassing a class that has injected members requires **`@injectFromBase()` in addition to `@injectable()`** — inversify 8 does not pass injection metadata down. Omitting it is **silent**: the inherited dependencies resolve to `undefined`, nothing throws, and no build, lint, or test sensor catches it (ADR-0007). `bindInjectable` (`utils/inversify.ts`) reports only the *missing-`@injectable()`* case, and not even that when every dependency is property-injected — its spec documents the blind spot. Copy the pattern from `features/viewport/viewport.ts`.
- `TYPES.Action` is bound **once per container** to a mutable holder, not per action in a child container. It resolves to `undefined` outside the synchronous `get` that builds a command, so injecting it anywhere other than a command constructor is silently wrong. The holder saves and *restores* the previous action rather than clearing it, so a command constructor that dispatches does not blank the outer one (`base/commands/command-registration.ts`).
- `TYPES.IViewer` is bound in the main container behind `whenParentIs(TYPES.ModelViewer)` / `whenParentIs(TYPES.PopupModelViewer)` constraints, replacing the two child containers that used to supply it. `TYPES.IViewer` therefore only resolves *under* one of those two parents; rebinding a viewer means reproducing the constraint.
- `sprotty-elk`: `src/index.ts` exports the Inversify wrapper, but inversify is only an `optionalDependency` — plain-Node consumers import `sprotty-elk/lib/elk-layout.js`. Node backends (`SocketElkServer`, `StdioElkServer`) live under `sprotty-elk/lib/node/`. The wrapper decorates the plain classes with `decorate(injectable(), Plain)`; the v6 `injectable()(Plain)` call form no longer type-checks, because `injectable()` now returns a `ClassDecorator` whose `void` return makes the assignment fail (TS2322).
- ESLint bans importing `..`/`../index` (barrel back-imports) to prevent cycles; webpack's `CircularDependencyPlugin` (examples build, `failOnError: true`) is the only cycle detector, and it only sees code reachable from `examples/browser-app.ts`.
- CSS ships as source (`packages/sprotty/css/`, exposed via the `./css/*` export); consumers import it through their bundler. `getComputedStyle`-based inlining happens only in `SvgExporter`.
- Feature modules have implicit dependencies with no mechanical check (#50): e.g. excluding the edit modules breaks selection with `Missing handler for action 'switchEditMode'` (#127). When excluding default modules, check which of their handlers other features' listeners dispatch to.
- The JSX layer (`src/lib/jsx.ts`) is a thin in-house wrapper over snabbdom's own JSX that maps attribute prefixes to snabbdom data keys. snabbdom is pinned to `~3.5.1` because 3.6 went pure-ESM while sprotty was CommonJS (#418) — that reason lapsed with the ESM migration (ADR-0006); the pin awaits re-evaluation (v2.0 exec plan).
- ES2022 class-field emission: fields declared without initializer exist with value `undefined`, so `'prop' in element` feature checks are unreliable — check the value, not key presence (this bit `isLayoutContainer` during the ESM migration, PR #515).
- `ProjectedViewportView` wraps the `svg` in a `div`, which has repeatedly broken sibling features assuming the root DOM node is the `svg` (keyboard #299, SVG export #407, selection #302) — when touching root-level DOM behaviour, test both root shapes.

## Public documentation map (sprotty.org)

The concept docs live in the separate `sprotty-website` repo and are published at sprotty.org. Key targets:

| Topic | URL |
|---|---|
| Tutorial (setup → model → views → DI) | https://sprotty.org/docs/learn/getting-started/ |
| Architecture cycle | https://sprotty.org/docs/concepts/architecture-overview/ |
| Core components (model sources, command stack, viewer) | https://sprotty.org/docs/concepts/core-components/ |
| Extension points cookbook | https://sprotty.org/docs/concepts/extension-points/ |
| Custom views and the JSX pragma | https://sprotty.org/docs/recipes/custom-views/ |
| Layout: client vs server vs hybrid | https://sprotty.org/docs/recipes/layout-strategies/ |
| Micro-layout (hbox/vbox/stack) | https://sprotty.org/docs/recipes/micro-layout/ |
| Styling and CSS classes | https://sprotty.org/docs/recipes/styling/ |
| Action protocols (sequence diagrams) | https://sprotty.org/docs/recipes/actions-and-protocols/ |
| ELK integration | https://sprotty.org/docs/sprotty-elk/introduction/ |
| SModel class reference | https://sprotty.org/docs/ref/smodel/ |
| Feature flags reference | https://sprotty.org/docs/ref/features/ |
| Default key/mouse bindings | https://sprotty.org/docs/ref/user-interaction/ |
| API reference (`sprotty` / `sprotty-protocol`) | https://sprotty.org/docs/ref/sprotty-core/ · https://sprotty.org/docs/ref/sprotty-protocol/ |
