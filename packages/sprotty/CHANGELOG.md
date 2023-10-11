## Eclipse Sprotty Change Log

This change log covers only the client part of Sprotty. See [here](https://github.com/eclipse-sprotty/sprotty/blob/master/CHANGELOG.md) for other packages.

### v1.0.0 (Oct. 2023)

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
