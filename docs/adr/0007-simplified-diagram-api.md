---
status: accepted
date: 2026-10-16
superseded-by:
---

# ADR-0007: The simplified diagram API

## Context

Rendering a Sprotty diagram has meant writing a `ContainerModule` by hand: bind a model source,
register every element type with its view, set the viewer options, load the default modules, and then
resolve services back out of the container with `container.get` and the `TYPES` symbol table.
`createSprottyDiagram` (`packages/sprotty/src/lib/create-diagram.ts`) is a one-call alternative for
the common case. While it was being designed, a variant that returned the raw Inversify `Container`
was prototyped; it was never committed, and neither was any other variant recorded below, so no
deprecation cycle under ADR-0003 applies to anything this record rejects.

Three decisions shape the API, and they are recorded together because they constrain each other:
what the factory returns, who registers the base element types, and the shape of the options object.

What application code needs from the result can be counted rather than guessed. Across the 12
example applications, code outside a `di.config.ts` resolves exactly two services from the
container: `TYPES.ModelSource` (11 lookups) and `TYPES.IActionDispatcher` (7 lookups, in 6 files).
Every other `container.get` in the examples sits inside a `di.config.ts`, resolving that example's
own bindings. Both lookups need a load-bearing type argument: `TYPES.ModelSource` is bound to the
abstract `ModelSource`, which declares only `model`, `handle` and `commitModel` — **`setModel` and
`updateModel` exist on `LocalModelSource` alone** — so without the cast the model cannot be set.

## Decision 1: the factory returns a diagram handle, not a container

### Options considered

1. **Container only** — return the Inversify `Container`. Leaves the application reaching back into
   the DI framework (`TYPES`, `container.get`, a cast) before its first line of logic, which is the
   very thing the API exists to spare it.
2. **Accessors only** — return `{ container, modelSource, actionDispatcher }` with the model source
   precisely typed, and no verbs. Adds no vocabulary, but still makes every call site go through a
   service.
3. **A behavioural facade** — the object owns the verbs and the services stay hidden. Shortest call
   sites, but every verb duplicates an existing method, and `setModel` cannot be given an honest
   signature when the model source is a `DiagramServerProxy`.
4. **Hybrid** — accessor fields *and* a bounded set of verbs.

### Decision

Option 4. `createSprottyDiagram` returns a `SprottyDiagram<S>`: the `container`, the `modelSource`
typed as the caller's own `modelSource` option gave it, the `actionDispatcher`, the dispatcher's
verbs, the model verbs, and the three `addX` registration methods. Five properties bound it:

- **The model verbs are conditional on the model source type.** `SprottyDiagram<S>` intersects its
  base with `LocalModelVerbs<S>`, which resolves to `setModel`/`updateModel` when `S extends
  LocalModelSource` and to `unknown` otherwise. The abstract `ModelSource` omits model mutation
  deliberately: with a `DiagramServerProxy` the client is not the author of the model and asks for
  one with `RequestModelAction` instead. A verb that is absent teaches that boundary at the call
  site; one that throws teaches it at run time. Rejected: declaring `setModel` unconditionally and
  rejecting at run time when the bound source cannot honour it.
- **The dispatcher is mirrored by `extends IActionDispatcher`, and no further.** The diagram carries
  `dispatch`, `dispatchAll` and `request` because it *is* an `IActionDispatcher` and can be passed
  wherever one is expected; the compiler then keeps the mirror complete if that interface grows.
  Rejected: named verbs for common actions (`fitToScreen`, `center`, `undo`). `sprotty-protocol`
  alone declares 34 action namespaces, so any subset is arbitrary and permanently behind, and it
  would set up a second, partial vocabulary beside the actions.
- **`addModelElement`, `addCommand` and `addActionHandler` are methods, not free functions.** Free
  functions taking a container would put the container back into the ordinary path for anyone
  registering a type after construction, and they would have no second audience: a hand-written
  `ContainerModule` calls `configureModelElement`, `configureCommand` and `configureActionHandler`.
- **A late registration warns.** Registrations are read once, when the registries are built, and a
  later one is otherwise silently ignored — the diagram paints a `MissingView` for a type the author
  did register. Because the verbs pass *through* the diagram, it can flag the moment registration is
  sealed and log a warning naming the call. Rejected: throwing. Sealing is asynchronous —
  `ActionDispatcher.initialize` builds the action handler registry inside a `.then`, and the viewer
  (and with it the view registry) is resolved through `IViewerProvider` only when the command stack
  first renders — so a registration made in the same tick as the first dispatch may still land, and
  throwing would reject a call that would have worked. The warning is logged at `warn`, which is this
  API's default log level precisely so that registration mistakes are visible.
- **Services resolve lazily.** `modelSource` and `actionDispatcher` are getters over
  `container.get`. Both bindings are singletons, so a getter is identity-stable, and the factory
  stays pure: it instantiates nothing, needs no DOM, and leaves the container open to a later `load`
  or `rebind`. Rejected: resolving both in the factory and storing them as fields, which would build
  the dispatcher, command stack and model source at construction and silently miss any binding
  changed afterwards. The laziness ends at the first read: either getter reaches the command stack,
  whose `@postConstruct` builds `SModelRegistry`, so reading one closes element registration, and
  the getters flag that for `addModelElement`.

`SprottyDiagram` is exported as a type; the implementing class is not. Under ADR-0003 an exported
class freezes its constructor signature and protected members as public API, and there is no
legitimate reason to construct one around anything but a container this factory built.

## Decision 2: the diagram owns the base vocabulary; modules contribute only subtypes

`createSprottyDiagram` registers a default set of model element types (`graph`, `node`, `edge`,
`label`, `port`, `compartment`, and the two routing handles) so that a diagram built with no options
renders. Sprotty's registries are closed-world — `register` throws on a duplicate key and `override`
throws when the key is absent — so a container module passed through `modules` that registers one
of those types collides with the defaults, and the collision surfaces lazily, at first render,
naming a type the application author never wrote.

This is resolved by contract rather than by mechanism: **a container module passed to the diagram
must register only its own subtypes, and rely on the diagram for the base vocabulary.** The
`elements` option is not bound by this: an entry for a default type is registered as an override
on purpose.

### Options considered

- **Weak `isDefault` registrations.** A flag on `ViewRegistration` and `SModelElementRegistration`
  so the registries process defaults first and let a normal registration silently replace a default
  one, while still throwing on two normal registrations of the same type. Rejected: it changes
  shared registry behaviour to accommodate one convenience layer, and makes "was this replacement
  intended?" unanswerable from the call site.
- **A `defaultElements: false` opt-out on the options object.** Rejected: it pushes the problem onto
  every user who combines a third-party module, and until they discover the flag the failure mode is
  the same lazy throw.
- **No default element registrations at all.** Rejected: it removes the reason for the API to
  exist — a diagram that is wired but draws nothing.

## Decision 3: viewer options stay nested

The options object keeps the viewer options as one value under `viewerOptions` (and the command
stack options under `commandStackOptions`), rather than flattening `Partial<ViewerOptions>` into the
top level:

```ts
// chosen — nested
createSprottyDiagram({ viewerOptions: { baseDiv: 'my-diagram' }, elements: { … } })

// rejected — flat, the options type `extends Partial<ViewerOptions>`
createSprottyDiagram({ baseDiv: 'my-diagram', elements: { … } })
```

Both shapes were implemented side by side while the choice was open and built the identical
container, so the decision was purely about the shape callers write. The flat shape saves one level
of nesting for `baseDiv`, the option nearly every application sets, and derives its fields from
`ViewerOptions` so they cannot drift. The nested shape won on two properties:

- **No shared namespace.** Under the flat shape, a future `ViewerOptions` field named `elements`,
  `modules`, `modelSource` or `logLevel` collides with the diagram options — a list that grows with
  every option added. `extends` makes such a collision a compile error rather than a silent shadow,
  but it is still a permanent naming constraint on two independent interfaces.
- **No migration trap.** The flat shape treats every unrecognised property as a viewer option, so a
  leftover `{ viewerOptions: { baseDiv: 'x' } }` would silently do nothing. TypeScript's
  excess-property check catches that on an object literal but not on an options object assembled
  dynamically.

The nested shape also matches how `ViewerOptions` is handled everywhere else —
`configureViewerOptions`, `overrideViewerOptions` and `TYPES.ViewerOptions` all treat it as one
object — so a caller already holding a `Partial<ViewerOptions>` passes it straight through.

## Consequences

- An application needs neither `TYPES` nor `container.get` for the ordinary path; `container`
  remains on the handle as the escape hatch.
- `Flowchart.flowchartModule` (`sprotty-library`) registers `graph`, `label`, `edge`,
  `routing-point` and `volatile-routing-point`, so `createSprottyDiagram({ modules:
  [Flowchart.flowchartModule] })` throws until that module is brought in line with Decision 2. Four
  of those registrations duplicate the defaults exactly and can be deleted; the fifth is a
  deliberate override (`EdgeWithArrow`) and should become the subtype `edge:flow`.
- The base-vocabulary contract is enforced by convention and documentation, not by the type system.
  Modules written against older Sprotty versions may collide, and the error arrives at first render
  rather than at diagram construction.
- `defaultElements` must keep covering every element type the default modules can create.
  `routing-point` and `volatile-routing-point` are included because `routingModule` is always loaded
  and creates those handles whenever an edge is selected.
- The late-registration warning is **best-effort**. Element registration is caught on every ordinary
  path, because both accessors that close it belong to the diagram; only resolving services straight
  from `diagram.container` escapes it. Command and handler registration is caught less often:
  `diagram.actionDispatcher.dispatch(…)` or `diagram.modelSource.setModel(…)` builds
  `ActionHandlerRegistry` without the diagram seeing a dispatch, and a later `addCommand` or
  `addActionHandler` then falls back to the silent behaviour. Detecting it exactly would require the
  registries to report their own construction — a change to shared framework machinery for one
  convenience layer, the same trade Decision 2 declines.
- `SprottyDiagramOptions` carries a type parameter. It is defaulted, so `createSprottyDiagram({…})`
  never mentions it; a caller who declares an options object separately and passes a non-local model
  source must write `SprottyDiagramOptions<WebSocketDiagramServerProxy>` for the model verbs to
  disappear.
- Because the model verbs are typed away rather than removed, the implementation still carries them
  at run time. That costs two `as unknown as` casts, both inside `create-diagram.ts`: one in the
  factory's return, because TypeScript cannot narrow an unresolved conditional type, and one in the
  private getter the verbs use to reach the model source as a `LocalModelSource`.
- `baseDiv`, the most frequently set option, costs one nesting level. `ViewerOptions` and
  `SprottyDiagramOptions` can each add fields without consulting the other, and a new non-viewer
  option cannot be mistaken for a viewer option at run time.
