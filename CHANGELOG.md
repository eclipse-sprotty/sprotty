## Eclipse Sprotty Change Log

This change log covers only the client part of Sprotty. See also the change logs of [sprotty-server](https://github.com/eclipse/sprotty-server/blob/master/CHANGELOG.md), [sprotty-theia](https://github.com/eclipse/sprotty-theia/blob/master/CHANGELOG.md) and [sprotty-layout](https://github.com/eclipse/sprotty-layout/blob/master/CHANGELOG.md).

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
