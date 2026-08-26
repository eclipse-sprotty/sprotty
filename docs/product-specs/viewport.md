# Viewport

**Intent** — Users navigate diagrams that are larger than the canvas: pan, zoom, center on elements, and fit the diagram to the screen, via mouse/touch/keyboard and programmatically. Downstream tools (GLSP, sprotty-vscode, sprotty-theia) dispatch the viewport actions and subclass the commands, so this behaviour is semver-relevant. Sources: tracker adjudications #220, #302, #441 and the 2026-08-25 maintainer triage.

## Behaviour contract

- `SetViewportAction` applies scroll and zoom, and the command supports undo/redo — enforced by `packages/sprotty/src/features/viewport/viewport.spec.ts`. Consecutive viewport changes merge into one undo step (`SetViewportCommand` is a `MergeableCommand`) — (unverified)
- Every viewport change is clamped by `limitViewport` using `ViewerOptions` (`zoomLimits` default 0.01–10, `horizontalScrollLimits`/`verticalScrollLimits` default ±100 000). Limits are always applied; disabling them is currently unsupported (disputed in [#441](https://github.com/eclipse-sprotty/sprotty/issues/441), open) — (unverified)
- `CenterAction` centers the given elements, or the whole model if none are given; `FitToScreenAction` additionally adjusts zoom so they fill the canvas — as documented in the sprotty.org key-binding table (CTRL-SHIFT-C / CTRL-SHIFT-F) — (unverified)
- Model updates preserve the current viewport (adjudicated as a bug when they didn't, [#130](https://github.com/eclipse-sprotty/sprotty/issues/130)) — (unverified)
- The application must dispatch `InitializeCanvasBoundsAction` when the canvas container is resized; center/fit compute against the last known canvas bounds (adjudicated intended in [#220](https://github.com/eclipse-sprotty/sprotty/issues/220)) — (unverified)
- **Acknowledged gap**: center/fit dispatched together with the initial model set/update is intended to take effect once canvas bounds are initialized, but is currently unreliable — the open bug cluster [#121](https://github.com/eclipse-sprotty/sprotty/issues/121)/[#147](https://github.com/eclipse-sprotty/sprotty/issues/147)/[#164](https://github.com/eclipse-sprotty/sprotty/issues/164). Until fixed, dispatch center/fit after `InitializeCanvasBoundsAction` has been processed.

## Deliberately not promised

- Animation timing and easing of viewport transitions, and the step sizes of wheel/keyboard zoom and scroll.
- The command-merging internals of `SetViewportCommand`.
- Running with disabled or partial viewport limits — the limits are part of the current contract until [#441](https://github.com/eclipse-sprotty/sprotty/issues/441) decides otherwise.
- The visual appearance of projection bars (CSS-styleable by design).

## Surface

- Actions: `SetViewportAction`, `GetViewportAction`, `CenterAction`, `FitToScreenAction`
- Commands: `SetViewportCommand`, `CenterCommand`, `FitToScreenCommand`, `BoundsAwareViewportCommand`
- Config: `ViewerOptions.zoomLimits`, `.horizontalScrollLimits`, `.verticalScrollLimits`; `limitViewport`
- Interaction: `ScrollMouseListener`, `ZoomMouseListener`, `CenterKeyboardListener`
- Model: `Viewport`, `ViewportRootElementImpl`, `ProjectedViewportView` (projection bars — used as root view, no DI module)

## Pointers

- https://sprotty.org/docs/ref/user-interaction/ — the default key/mouse bindings (contract source)
- `docs/ARCHITECTURE.md` — the `blockUntil` deadlock gotcha behind the #121 cluster
- Open adjudications this spec tracks: [#121](https://github.com/eclipse-sprotty/sprotty/issues/121), [#441](https://github.com/eclipse-sprotty/sprotty/issues/441)
