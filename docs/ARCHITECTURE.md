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

Build order is fixed by TypeScript project references in `tsconfig.build.json`. Each package has `tsconfig.src.json` (emits to `lib/`, excludes specs) and `tsconfig.test.json` (`noEmit`, specs only); the plain `tsconfig.json` exists for editor support.

## The runtime cycle

Everything is driven by **actions** (plain serializable data). The cycle, all in `packages/sprotty/src/base/`:

1. An event (user input, model source message) produces an `Action`.
2. `ActionDispatcher` (`actions/action-dispatcher.ts`) looks up handlers in the `ActionHandlerRegistry`. Command-backed handlers create an `ICommand`.
3. `CommandStack` (`commands/command-stack.ts`) executes commands strictly sequentially (each chained on `currentPromise`), maintains `undoStack`/`redoStack`/`offStack`, and holds **three model slots**: main, hidden, popup.
4. Each slot is pushed to its viewer: `ModelViewer` (patches `#sprotty` via snabbdom), `HiddenModelViewer` (`#sprotty-hidden`, invisible, used for measuring), `PopupModelViewer` (`#sprotty-popup`). Viewers render by looking up each element's `IView` in the `ViewRegistry` by `element.type`, then run the `IVNodePostprocessor` chain.
5. Rendering and listeners produce new actions; the cycle repeats.

Command base classes in `commands/command.ts` encode the semantics: `Command` (undoable), `MergeableCommand` (consecutive commands collapse into one undo step), `HiddenCommand` (renders to the hidden viewer only), `PopupCommand`, `SystemCommand` (transparent to user undo/redo), `ResetCommand` (clears all stacks), `ModelRequestCommand` (responds without changing the model).

**The bounds round-trip** is the most distinctive flow: `RequestBoundsAction` → `RequestBoundsCommand` (a `HiddenCommand` with `blockUntil: ComputedBoundsAction`) → hidden render → `HiddenBoundsUpdater` reads `getBBox()` from the live hidden SVG, runs micro-layout (`Layouter`), dispatches `ComputedBoundsAction`. Client/server layout negotiation happens via `needsClientLayout` / `needsServerLayout`, which are set in `ViewerOptions` but travel to the server inside `RequestModelAction.options`.

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

- All DI symbols live in the single `TYPES` object, `packages/sprotty/src/base/types.ts`.
- Every framework feature exports a `ContainerModule` from its `di.config.ts`. `loadDefaultModules(container)` (`src/lib/modules.ts`) loads the default set — **`edgeIntersectionModule` and `edgeJunctionModule` are deliberately not in it**, and `projection`/`nameable` have no DI module at all.
- Ordering matters: `loadDefaultModules` first, then extra sprotty modules, then the app module last — app modules use `rebind` and `overrideModelElement`, which throw if the default binding isn't there yet. Double registration throws `Key is already registered`.
- Composition idiom: `bind(X).toSelf().inSingletonScope()` + `bind(TYPES.SomeRole).toService(X)` so one singleton serves several multi-inject roles.
- The event cycle (dispatcher ↔ command stack ↔ viewer) is only breakable via providers: `TYPES.IActionDispatcherProvider`, `ICommandStackProvider`, `ActionHandlerRegistryProvider`, `ModelSourceProvider`, `IViewerProvider`. Injecting these directly instead of via provider recreates the cycle.
- Configuration helpers (all take a `context = { bind, unbind, isBound, rebind }`): `configureModelElement`, `overrideModelElement`, `configureView`, `registerModelElement` (`base/views/view.tsx`, `base/model/smodel-utils.ts`), `configureCommand` (`base/commands/command-registration.ts`), `configureActionHandler` / `onAction` (`base/actions/action-handler.ts`), `configureLayout`, `configureButtonHandler`, `configureViewerOptions`.

## Client–server

Both halves are called "diagram server" — keep them apart:

- **Server side**: `DiagramServer` (`packages/sprotty-protocol/src/diagram-server.ts`), one instance per client, constructed with `(dispatch, services)` where `DiagramServices` supplies `DiagramGenerator`, optional `ModelLayoutEngine`, optional `ServerActionHandlerRegistry`.
- **Client side**: `ModelSource` implementations in `packages/sprotty/src/model-source/` — `LocalModelSource` (imperative facade, no server) and `DiagramServerProxy` / `WebSocketDiagramServerProxy` (forwards a fixed set of actions, marks inbound ones with `__receivedFromServer` to avoid echo).
- `modelSourceModule` deliberately does **not** bind `TYPES.ModelSource` — every app must choose one.

## How to add things

**A new action, end to end:**
1. `packages/sprotty-protocol/src/actions.ts` — `interface` + namespace with `KIND`/`create()` (only if it crosses the wire; purely client-side actions live next to their command in `sprotty`).
2. The command or handler in `packages/sprotty/src/features/<feature>/` — commands need `static readonly KIND`, `@injectable()`, and `@inject(TYPES.Action)` in the constructor.
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
- `sprotty-elk`: `src/index.ts` exports the Inversify wrapper, but inversify is only an `optionalDependency` — plain-Node consumers import `sprotty-elk/lib/elk-layout.js`. Node backends (`SocketElkServer`, `StdioElkServer`) live under `sprotty-elk/lib/node/`.
- ESLint bans importing `..`/`../index` (barrel back-imports) to prevent cycles; webpack's `CircularDependencyPlugin` (examples build, `failOnError: true`) is the only cycle detector, and it only sees code reachable from `examples/browser-app.ts`.
- CSS ships as source (`packages/sprotty/css/`, exposed via the `./css/*` export); consumers import it through their bundler. `getComputedStyle`-based inlining happens only in `SvgExporter`.

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
