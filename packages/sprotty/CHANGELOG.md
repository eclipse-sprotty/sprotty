## Eclipse Sprotty Change Log

This change log covers only the client part of Sprotty. See also the change logs of [sprotty-server](https://github.com/eclipse/sprotty-server/blob/master/CHANGELOG.md), [sprotty-theia](https://github.com/eclipse/sprotty-theia/blob/master/CHANGELOG.md) and [sprotty-elk](https://github.com/eclipse/sprotty/blob/master//packages/sprotty-elk/CHANGELOG.md).

### v0.13.0 (TBD)

* Remove codicon.css, document and explain future usage [#312](https://github.com/eclipse/sprotty/pull/292/): You now have to manually add the dependency of `@vscode/codicons` to your application and reference it in your di.config, see classdiagram [di.config.ts](../../examples/classdiagram/src/di.config.ts)

### v0.12.0 (Jun. 2022)

* Aligned dependency to `inversify` ([#292](https://github.com/eclipse/sprotty/pull/292/)): version constraint is now `^5.1.1` in all sprotty packages.

Fixed issues: https://github.com/eclipse/sprotty/issues?q=milestone%3Av0.12.0+is%3Aclosed+label%3Asprotty

### v0.11.1 (Nov. 2021)

Fixed dependency to `sprotty-protocol`: version constraint is now `~0.11.0` (equivalent to `0.11.*`). The previous version pointed to the non-existing version `0.10.0`.

### v0.11.0 (Nov. 2021)

This version introduces a dependency to the new package `sprotty-protocol`. Many definitions have been copied to the new package and the original definitions are marked as deprecated, so you need to update your imports to stay compatible with future versions.

New features:
 * Edges rendered as Bézier curves ([#245](https://github.com/eclipse/sprotty/pull/245)). Use the new `BezierCurveEdgeView` to display edges as smooth curves. This requires the routing points of the edges to be provided as a series of curve segments, each with two control points and one target point (except the last segment, which connects to the target node). The expected number of routing points is of the form `3*n-1`: 2, 5, 8, 11...

Breaking API changes:
 * Actions are consistently declared as interfaces, not as classes, to emphasize that they must be serializable to enable transfer between client and server. Instead of a constructor, use the `create` function defined in the namespace with the same name as the corresponding action interface.
 * `SModelIndex` was renamed to `ModelIndexImpl` and is usable only for the internal model that is used for rendering. If you want to apply an index to an external model (defined via `sprotty-protocol`), you should use the new `SModelIndex` from `sprotty-protocol` instead.
 * A few geometry functions were moved into namespaces in order to clarify their meaning.

-----

### v0.10.0 (Oct. 2021)

New features:
 * Line jumps (`JumpingPolylineEdgeView`) or gaps (`PolylineEdgeViewWithGapsOnIntersections`) to visually clarify intersecting edges ([#226](https://github.com/eclipse/sprotty/pull/226))
 * `TYPES.IEdgeRoutePostprocessor` can be registered to analyse and/or change computed routes ([#226](https://github.com/eclipse/sprotty/pull/226))
 * `EdgeRouterRegistry` can route all edges contained in a parent element at once. These pre-computed routes are then added to the `args` that are passed on to the views. This allows `IView` and `IEdgeRoutePostprocessor` implementations to consider all computed routes before the routed edges have been rendered. ([#226](https://github.com/eclipse/sprotty/pull/226))
 * Added "projection bars" that can serve as scroll bars and display horizontal / vertical projections of model elements. Use `ProjectedViewportView` as root element view to enable this feature. ([#240](https://github.com/eclipse/sprotty/pull/240))
 * Added support for Codicons ([#248](https://github.com/eclipse/sprotty/issues/248))

Breaking API changes:
 * It is recommended that implementations of the `IView` for `SGraph` instances compute the routes of its children with `edgeRouterRegistry.routeAllChildren(model)` and pass on the routes as arguments to its child views. See implementation of `SGraphView` ([#226](https://github.com/eclipse/sprotty/pull/226))
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

Fixed issues: https://github.com/eclipse/sprotty/milestone/5?closed=1

-----

### v0.9.0 (Aug. 2020)

New features:
 * Skip rendering elements that are not in viewport ([#182](https://github.com/eclipse/sprotty/pull/182))
 * Rejecting request actions ([#184](https://github.com/eclipse/sprotty/pull/184))

Fixed issues: https://github.com/eclipse/sprotty/milestone/4?closed=1

-----

### v0.8.0 (Apr. 2020)

New features:
 * CenterAction retains zoom level ([#138](https://github.com/eclipse/sprotty/pull/138))
 * Cycling through command palettes ([#141](https://github.com/eclipse/sprotty/pull/141))
 * Context menus ([#139](https://github.com/eclipse/sprotty/pull/139)[#144](https://github.com/eclipse/sprotty/pull/144))
 * Use element subtype as css style ([#145](https://github.com/eclipse/sprotty/pull/145))
 * Improve loading indicator of command palette ([#148](https://github.com/eclipse/sprotty/pull/148), [#151](https://github.com/eclipse/sprotty/pull/151))
 * Reset previous hover feedback on mouseover ([#153](https://github.com/eclipse/sprotty/pull/153))
 * Edge changes are animated ([#158](https://github.com/eclipse/sprotty/pull/158))
 * Fix scrolling on all browsers ([#163](https://github.com/eclipse/sprotty/pull/163))
 * Multi-line Label editing and ForeignObjects ([#171](https://github.com/eclipse/sprotty/pull/171), [#173](https://github.com/eclipse/sprotty/pull/173))

Fixed issues: https://github.com/eclipse/sprotty/milestone/3?closed=1

Breaking API changes:
 * `DeleteContextMenuProviderRegistry` has been renamed to `DeleteContextMenuProvider` ([#157](https://github.com/eclipse/sprotty/pull/#157))
 * `MenuItem.isEnabled()`, `MenuItem.isToggled()`and `MenuItem.isVisible()` no longer return promises  ([#157](https://github.com/eclipse/sprotty/pull/#157))
 * `IUIExtension.id` and `IUIExtension.containerClass` have become methods  ([#171](https://github.com/eclipse/sprotty/pull/#171))
 * `EdgeSnapshot` additionally stores `routedPoints` ([#158](https://github.com/eclipse/sprotty/pull/#158))

-----

### v0.7.0 (Oct. 2019)

New features:

 * Command palette ([#63](https://github.com/eclipse/sprotty/pull/63))
 * UI extensions  ([#63](https://github.com/eclipse/sprotty/pull/63))
 * Snap-to-grid ([#87](https://github.com/eclipse/sprotty/pull/87))
 * Label editing ([#88](https://github.com/eclipse/sprotty/pull/88))
 * Request-response actions ([#103](https://github.com/eclipse/sprotty/pull/103))
 * Configure _features_ as parameter to `configureModelElement` ([#109](https://github.com/eclipse/sprotty/pull/109))
 * New function `loadDefaultModules` ([#111](https://github.com/eclipse/sprotty/pull/111))
 * New function `configureActionHandler` ([#117](https://github.com/eclipse/sprotty/pull/117))

Fixed issues: https://github.com/eclipse/sprotty/milestone/2?closed=1

Breaking API changes:

 * Split `Viewer` in three classes `ModelViewer`, `HiddenModelViewer`, `PopupModelViewer` ([#103](https://github.com/eclipse/sprotty/pull/103)).
 * Renamed `CommandResult` type to `CommandReturn` ([#103](https://github.com/eclipse/sprotty/pull/103)).
 * Renamed `IVNodeDecorator` to `IVNodePostprocessor` ([#113](https://github.com/eclipse/sprotty/pull/113), [#116](https://github.com/eclipse/sprotty/pull/116)).
 * Changed `ComputedBoundsAction` ([#119](https://github.com/eclipse/sprotty/pull/119))
 * `SGraphFactory` is deprecated ([#109](https://github.com/eclipse/sprotty/pull/109)).

-----

### v0.6.0 (Mar. 2019)

First release of Sprotty with the Eclipse Foundation. The previous repository location was [theia-ide/sprotty](https://github.com/theia-ide/sprotty).
