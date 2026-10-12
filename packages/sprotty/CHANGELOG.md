## Eclipse Sprotty Change Log

This change log covers only the client part of Sprotty. See [here](https://github.com/eclipse-sprotty/sprotty/blob/main/CHANGELOG.md) for other packages.

### v2.0.0 (unreleased)

This is a major release with breaking changes: the packages are published as ES modules only, the dependency to InversifyJS was updated to version 8, and all API that was deprecated during the 1.x line has been removed. The migration notes below are grouped by cause.

**ES modules only** ([#515](https://github.com/eclipse-sprotty/sprotty/pull/515))

 * `sprotty`, `sprotty-protocol`, `sprotty-elk` and `sprotty-library` are now ESM-only packages (`"type": "module"` with an `exports` map); there is no CommonJS build. Applications that `require()` Sprotty need to switch to `import`, and TypeScript projects should use a module resolution that honors `exports` (`node16`, `nodenext` or `bundler`).
 * Deep imports into `sprotty` keep working through the `sprotty/lib/*` and `sprotty/css/*` export patterns, but now require the file extension, e.g. `sprotty/lib/features/viewport/viewport.js`. `sprotty-protocol` no longer exposes deep imports; import from the package root instead.
 * The compilation target is now ES2022. Class fields declared without an initializer exist on instances with the value `undefined`, so `'property' in element` checks against optional properties are no longer reliable; compare with `undefined` instead.
 * Updated `tinyqueue` to version 3.

**InversifyJS 8** ([#561](https://github.com/eclipse-sprotty/sprotty/pull/561)): version constraint is now `~8.2` in all sprotty packages. InversifyJS 8 is a rewrite of InversifyJS 6 and requires changes in downstream code.

Breaking changes in Sprotty:

 * Subclasses of Sprotty classes that have injected members now need `@injectFromBase()` in addition to `@injectable()`, because InversifyJS no longer passes injection metadata down to subclasses. A missing decorator leaves the inherited dependencies `undefined` *without* raising an error, so this is worth checking in every subclass. If the base class declares constructor parameters that are not injected, those parameters need `@unmanaged()`, since `@injectFromBase()` validates the metadata of the base class.
 * Removed the `isInjectable` utility. The `configure*` utilities still report a missing `@injectable()` decorator, now by translating the error raised by InversifyJS. Note that InversifyJS cannot detect the case where a class has no constructor arguments and all of its dependencies are injected into properties.
 * `TYPES.Action` is now bound in the container that registers the commands instead of in a child container created for each action. It resolves to `undefined` while no command is being created.
 * `TYPES.IViewer` is now bound in the main container, constrained with `whenParentIs`, instead of in child containers created for `TYPES.ModelViewer` and `TYPES.PopupModelViewer`.

Changes required in dependency injection configurations; these follow from InversifyJS 8 itself and affect every application that configures a Sprotty container:

 * `import 'reflect-metadata'` is no longer needed, as InversifyJS brings its own polyfill.
 * The callback passed to `ContainerModule` receives a single options object instead of positional arguments: `new ContainerModule(({ bind, isBound, rebind }) => ...)`. That object can be passed directly to Sprotty's `configure*` utilities.
 * `Container.createChild()` and the `Container.parent` setter were removed; a parent is now passed to the constructor as `new Container({ parent })`.
 * The `interfaces` namespace was removed in favour of top-level type exports. Note that `Rebind` is asynchronous in InversifyJS 8 and that the synchronous variant is called `RebindSync`.
 * `toProvider` was removed; provider bindings are expressed as `bind<MyProvider>(TYPES.MyProvider).toFactory(...)`, where the type argument is the type of the provider function rather than the type it provides.
 * The object passed to `toDynamicValue` and `toFactory` no longer exposes `container`. Use `ctx.get(...)` instead of `ctx.container.get(...)`, and `ctx.get(..., { optional: true })` instead of guarding with `ctx.container.isBound(...)`.

**Removed deprecated API** ([#566](https://github.com/eclipse-sprotty/sprotty/pull/566)), following the [deprecation policy](https://github.com/eclipse-sprotty/sprotty/blob/main/docs/adr/0003-deprecate-then-remove-policy.md): every definition marked `@deprecated` during the 1.x line is gone.

 * Definitions that had moved to `sprotty-protocol` are no longer exported from `sprotty`; update the import: `ExportSvgOptions`, `RequestExportSvgAction`, `ExportSvgAction`, `EdgeLayoutable`, `EdgeSide`, `EdgePlacement`, `Expandable`, `Fadeable`, `Hoverable`, `Locateable`, `Projectable`, `Selectable`, `SIssue`, `SIssueSeverity`, `HAlignment` and `VAlignment`. `SButtonSchema` is replaced by `SButton` from `sprotty-protocol`.
 * The `SIssueMarker` alias was removed; use `SIssueMarkerImpl`.
 * `ViewportAnimation.zoomFactor` is now a protected getter computed from the old and new viewport instead of a field.

**New features**

 * Touch support ([#475](https://github.com/eclipse-sprotty/sprotty/pull/475)): the new `TouchTool` dispatches touch events to `ITouchListener` implementations bound to `TYPES.ITouchListener`. `ScrollMouseListener` implements it, so the viewport can be panned with one finger and zoomed with a two-finger pinch.
 * Pointer event support ([#488](https://github.com/eclipse-sprotty/sprotty/pull/488)): the new `PointerTool` dispatches pointer events, including `gotpointercapture` and `lostpointercapture`, to `IPointerListener` implementations bound to `TYPES.IPointerListener`; `PointerListener` is a no-op base class. The built-in listeners still react to mouse events; switching them to pointer capture is tracked in [#485](https://github.com/eclipse-sprotty/sprotty/issues/485).
 * Holding Shift while using the mouse wheel scrolls the viewport horizontally ([#502](https://github.com/eclipse-sprotty/sprotty/pull/502)), except on macOS, where the system already maps Shift + wheel to horizontal scrolling.
 * Viewport animations that change the zoom level now interpolate scroll and zoom consistently, so the diagram no longer drifts along a curve while zooming ([#510](https://github.com/eclipse-sprotty/sprotty/pull/510)).
 * New showcase examples for styling ([#496](https://github.com/eclipse-sprotty/sprotty/pull/496)), micro-layout ([#498](https://github.com/eclipse-sprotty/sprotty/pull/498)), custom views ([#499](https://github.com/eclipse-sprotty/sprotty/pull/499)) and layout strategies ([#503](https://github.com/eclipse-sprotty/sprotty/pull/503)).

**Fixed bugs**

 * Edge labels honor the positions assigned by a layout engine instead of snapping to the edge midpoint ([#533](https://github.com/eclipse-sprotty/sprotty/pull/533)).
 * SVG export no longer copies `block-size` from the hidden rendering, which shrank the exported image ([#540](https://github.com/eclipse-sprotty/sprotty/pull/540)).
 * Bounds collected during hidden renderings that were not triggered by a `RequestBoundsAction` (e.g. an SVG export) no longer leak into the next `ComputedBoundsAction` ([#542](https://github.com/eclipse-sprotty/sprotty/pull/542)).
 * The command palette builds its suggestion entries with DOM APIs instead of `innerHTML` ([#548](https://github.com/eclipse-sprotty/sprotty/pull/548)).
 * `TouchTool` and `CommandPaletteActionProviderRegistry` no longer throw when no listener or provider is registered, and `ExpandButtonView` sets the `enabled` class according to `button.enabled` instead of unconditionally.

**Other API changes**

Enabling TypeScript's `strict` mode surfaced a few signatures that were looser than their implementation:

 * `Deferred.resolve` (`sprotty-protocol`) takes a required value, matching the resolver type of `Promise`.
 * Tasks passed to `AnimationFrameSyncer.onNextFrame` and `onEndOfNextFrame` always receive a timestamp; their type is `(time: number) => void`.
 * `on()` from `vnode-utils` has typed overloads for the standard DOM event names, so listeners receive the specific event type.
 * `KeyTool.focus(element, event)` declares the parameters it has always been called with.

**Tooling**

 * The repository moved from Yarn to npm workspaces ([#534](https://github.com/eclipse-sprotty/sprotty/pull/534)) and to Node.js 24, TypeScript 5.9 and Vitest 4; contributors use `npm install` and `npm run build`. Releases are published from GitHub Actions with OIDC trusted publishing ([#549](https://github.com/eclipse-sprotty/sprotty/pull/549)).

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/12?closed=1

-----

### v1.4.0 (Dec. 2024)

 * Updated dependency to `inversify` ([#477](https://github.com/eclipse-sprotty/sprotty/pull/477)):  version constraint is now `^6.1.3` in all sprotty packages.

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/15?closed=1

-----

### v1.3.0 (Jul. 2024)

 * Added a way to inject an SVG export postprocessor to manipulate the produced SVG element during an export ([#454](https://github.com/eclipse-sprotty/sprotty/pull/454)).
 * `LocalModelSource` behavior changed when using `setModel`, which should skip the animation ([#458](https://github.com/eclipse-sprotty/sprotty/pull/458)). Animation is still applied when using `updateModel` instead.

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/14?closed=1

-----

### v1.2.0 (Apr. 2024)

 * New package `sprotty-library` with standard Flowchart views ([#423](https://github.com/eclipse-sprotty/sprotty/pull/423)).
 * New feature to show junction points when multiple edges are connected to the same port with Manhattan (orthogonal) routing ([#434](https://github.com/eclipse-sprotty/sprotty/pull/434)).
 * Enabled to stop animated commands ([#414](https://github.com/eclipse-sprotty/sprotty/pull/414)).
 * Enabled to override model element registrations ([#424](https://github.com/eclipse-sprotty/sprotty/pull/424)).
 * Enabled to use function components in JSX syntax, improved support for attributes ([#430](https://github.com/eclipse-sprotty/sprotty/pull/430)).
 * Added support for shadow DOM ([#435](https://github.com/eclipse-sprotty/sprotty/pull/435)).
 * Added utility to configure the command stack ([#433](https://github.com/eclipse-sprotty/sprotty/pull/433)).

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/13?closed=1

-----

### v1.1.0 (Jan. 2024)

 * Resolved a [license issue](https://gitlab.eclipse.org/eclipsefdn/emo-team/iplab/-/issues/10784) regarding `jsdom` (it was only used as a dev-dependency).
 * Moving edge labels is now supported ([#411](https://github.com/eclipse-sprotty/sprotty/pull/411)).
 * Moved more interfaces used for defining Sprotty (external) models to `sprotty-protocol` so they can be used in backend applications ([#413](https://github.com/eclipse-sprotty/sprotty/pull/413)).

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/11?closed=1

-----

## v1.0.0 (Oct. 2023)

This version marks the transition of Sprotty's incubation phase into maturity. As part of this, all deprecated API have been removed.

 * Removed all API that was marked as deprecated in any previous release ([#374](https://github.com/eclipse-sprotty/sprotty/pull/374))
 * `ToolManager` API was deprecated and then removed ([#371](https://github.com/eclipse-sprotty/sprotty/pull/371))
 * Renamed ViewportRootElement model element ([#381](https://github.com/eclipse-sprotty/sprotty/pull/381))
 * Updated to `autocompleter` 9.1.0 ([#382](https://github.com/eclipse-sprotty/sprotty/pull/382))
 * Removed SModelExtension interface ([#389](https://github.com/eclipse-sprotty/sprotty/pull/389))

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/6?closed=1

-----

### v0.14.0 (Aug. 2023)

 * Renamed all internal model classes by adding an `Impl` suffix. This ensures a clean separation between the external (protocol) model and the internal (client) model. The original model definitions are marked as deprecated, so you need to update your imports to stay compatible with future versions ([#355](https://github.com/eclipse-sprotty/sprotty/pull/355))
 * Updated dependency to `inversify` to ensure compatibility with `Typescript 5` ([#357](https://github.com/eclipse-sprotty/sprotty/pull/357)):  version constraint is now `~6.0.1` in all sprotty packages.
 * The `ToolManager API` and related concepts have been deprecated. They are are no longer actively used and support will be dropped in future versions ([#371](https://github.com/eclipse-sprotty/sprotty/pull/371))


Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/10?closed=1

-----

### v0.13.0 (Dec. 2022)

 * Removed dependency to `@vscode/codicons` ([#312](https://github.com/eclipse-sprotty/sprotty/pull/312)): You now have to add the dependency to your application and include it via import or other means. See classdiagram [di.config.ts](../../examples/classdiagram/src/di.config.ts) for an example.
 * New function `configureButtonHandler` to register a button handler for a button type ([#303](https://github.com/eclipse-sprotty/sprotty/pull/303))
 * Added `dragover` and `drop` events to mouse listeners ([#309](https://github.com/eclipse-sprotty/sprotty/pull/309))
 * Moved more actions from `sprotty` to `sprotty-protocol` to make them available in backend applications ([#326](https://github.com/eclipse-sprotty/sprotty/pull/326)).


Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/9?closed=1

-----

### v0.12.0 (Jun. 2022)

 * Aligned dependency to `inversify` ([#292](https://github.com/eclipse-sprotty/sprotty/pull/292)): version constraint is now `^5.1.1` in all sprotty packages.

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/8?closed=1

-----

### v0.11.1 (Nov. 2021)

Fixed dependency to `sprotty-protocol`: version constraint is now `~0.11.0` (equivalent to `0.11.*`). The previous version pointed to the non-existing version `0.10.0`.

### v0.11.0 (Nov. 2021)

This version introduces a dependency to the new package `sprotty-protocol`. Many definitions have been copied to the new package and the original definitions are marked as deprecated, so you need to update your imports to stay compatible with future versions.

New features:
 * Edges rendered as Bézier curves ([#245](https://github.com/eclipse-sprotty/sprotty/pull/245)). Use the new `BezierCurveEdgeView` to display edges as smooth curves. This requires the routing points of the edges to be provided as a series of curve segments, each with two control points and one target point (except the last segment, which connects to the target node). The expected number of routing points is of the form `3*n-1`: 2, 5, 8, 11...

Breaking API changes:
 * Actions are consistently declared as interfaces, not as classes, to emphasize that they must be serializable to enable transfer between client and server. Instead of a constructor, use the `create` function defined in the namespace with the same name as the corresponding action interface.
 * `SModelIndex` was renamed to `ModelIndexImpl` and is usable only for the internal model that is used for rendering. If you want to apply an index to an external model (defined via `sprotty-protocol`), you should use the new `SModelIndex` from `sprotty-protocol` instead.
 * A few geometry functions were moved into namespaces in order to clarify their meaning.

-----

### v0.10.0 (Oct. 2021)

New features:
 * Line jumps (`JumpingPolylineEdgeView`) or gaps (`PolylineEdgeViewWithGapsOnIntersections`) to visually clarify intersecting edges ([#226](https://github.com/eclipse-sprotty/sprotty/pull/226))
 * `TYPES.IEdgeRoutePostprocessor` can be registered to analyse and/or change computed routes ([#226](https://github.com/eclipse-sprotty/sprotty/pull/226))
 * `EdgeRouterRegistry` can route all edges contained in a parent element at once. These pre-computed routes are then added to the `args` that are passed on to the views. This allows `IView` and `IEdgeRoutePostprocessor` implementations to consider all computed routes before the routed edges have been rendered. ([#226](https://github.com/eclipse-sprotty/sprotty/pull/226))
 * Added "projection bars" that can serve as scroll bars and display horizontal / vertical projections of model elements. Use `ProjectedViewportView` as root element view to enable this feature. ([#240](https://github.com/eclipse-sprotty/sprotty/pull/240))
 * Added support for Codicons ([#248](https://github.com/eclipse-sprotty/sprotty/issues/248))

Breaking API changes:
 * It is recommended that implementations of the `IView` for `SGraph` instances compute the routes of its children with `edgeRouterRegistry.routeAllChildren(model)` and pass on the routes as arguments to its child views. See implementation of `SGraphView` ([#226](https://github.com/eclipse-sprotty/sprotty/pull/226))
 * Upgrade to snabbdom 3.0.3. The imports of snabbdom functions have changed. The main snabbdom package exports all of the public API.This means consumers of the snabbdom package need to update their imports.

before

```ts
import { h } from 'snabbdom/h'
import { VNode } from 'snabbdom/vnode'
```

after

```ts
import { h, VNode } from 'snabbdom'
```

 * snabbdom now supports jsx, so snabbdom-jsx has been removed. On the other hand, to maintain the ability to treat attribute prefixes as data keys, it is used via a wrapper called lib/jsx.

before

```ts
/** @jsx svg */
import { svg } from 'snabbdom-jsx';
```

after

```ts
/** @jsx svg */
import { svg } from 'sprotty';
```

 * The `on` function API of `vnode-utils` has been changed due to the API change of Snabbdom's event listener. Listeners must `bind` elements. (see [snabbdom#802](https://github.com/snabbdom/snabbdom/issues/802))

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/5?closed=1

-----

### v0.9.0 (Aug. 2020)

New features:
 * Skip rendering elements that are not in viewport ([#182](https://github.com/eclipse-sprotty/sprotty/pull/182))
 * Rejecting request actions ([#184](https://github.com/eclipse-sprotty/sprotty/pull/184))

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/4?closed=1

-----

### v0.8.0 (Apr. 2020)

New features:
 * CenterAction retains zoom level ([#138](https://github.com/eclipse-sprotty/sprotty/pull/138))
 * Cycling through command palettes ([#141](https://github.com/eclipse-sprotty/sprotty/pull/141))
 * Context menus ([#139](https://github.com/eclipse-sprotty/sprotty/pull/139)[#144](https://github.com/eclipse-sprotty/sprotty/pull/144))
 * Use element subtype as css style ([#145](https://github.com/eclipse-sprotty/sprotty/pull/145))
 * Improve loading indicator of command palette ([#148](https://github.com/eclipse-sprotty/sprotty/pull/148), [#151](https://github.com/eclipse-sprotty/sprotty/pull/151))
 * Reset previous hover feedback on mouseover ([#153](https://github.com/eclipse-sprotty/sprotty/pull/153))
 * Edge changes are animated ([#158](https://github.com/eclipse-sprotty/sprotty/pull/158))
 * Fix scrolling on all browsers ([#163](https://github.com/eclipse-sprotty/sprotty/pull/163))
 * Multi-line Label editing and ForeignObjects ([#171](https://github.com/eclipse-sprotty/sprotty/pull/171), [#173](https://github.com/eclipse-sprotty/sprotty/pull/173))

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/3?closed=1

Breaking API changes:
 * `DeleteContextMenuProviderRegistry` has been renamed to `DeleteContextMenuProvider` ([#157](https://github.com/eclipse-sprotty/sprotty/pull/#157))
 * `MenuItem.isEnabled()`, `MenuItem.isToggled()`and `MenuItem.isVisible()` no longer return promises  ([#157](https://github.com/eclipse-sprotty/sprotty/pull/#157))
 * `IUIExtension.id` and `IUIExtension.containerClass` have become methods  ([#171](https://github.com/eclipse-sprotty/sprotty/pull/#171))
 * `EdgeSnapshot` additionally stores `routedPoints` ([#158](https://github.com/eclipse-sprotty/sprotty/pull/#158))

-----

### v0.7.0 (Oct. 2019)

New features:

 * Command palette ([#63](https://github.com/eclipse-sprotty/sprotty/pull/63))
 * UI extensions  ([#63](https://github.com/eclipse-sprotty/sprotty/pull/63))
 * Snap-to-grid ([#87](https://github.com/eclipse-sprotty/sprotty/pull/87))
 * Label editing ([#88](https://github.com/eclipse-sprotty/sprotty/pull/88))
 * Request-response actions ([#103](https://github.com/eclipse-sprotty/sprotty/pull/103))
 * Configure _features_ as parameter to `configureModelElement` ([#109](https://github.com/eclipse-sprotty/sprotty/pull/109))
 * New function `loadDefaultModules` ([#111](https://github.com/eclipse-sprotty/sprotty/pull/111))
 * New function `configureActionHandler` ([#117](https://github.com/eclipse-sprotty/sprotty/pull/117))

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/2?closed=1

Breaking API changes:

 * Split `Viewer` in three classes `ModelViewer`, `HiddenModelViewer`, `PopupModelViewer` ([#103](https://github.com/eclipse-sprotty/sprotty/pull/103)).
 * Renamed `CommandResult` type to `CommandReturn` ([#103](https://github.com/eclipse-sprotty/sprotty/pull/103)).
 * Renamed `IVNodeDecorator` to `IVNodePostprocessor` ([#113](https://github.com/eclipse-sprotty/sprotty/pull/113), [#116](https://github.com/eclipse-sprotty/sprotty/pull/116)).
 * Changed `ComputedBoundsAction` ([#119](https://github.com/eclipse-sprotty/sprotty/pull/119))
 * `SGraphFactory` is deprecated ([#109](https://github.com/eclipse-sprotty/sprotty/pull/109)).

-----

### v0.6.0 (Mar. 2019)

First release of Sprotty with the Eclipse Foundation. The previous repository location was [theia-ide/sprotty](https://github.com/theia-ide/sprotty).
