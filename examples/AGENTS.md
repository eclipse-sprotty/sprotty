# Sprotty examples

All examples are bundled into a **single webpack bundle** (`examples/webpack.config.cjs`, entry `browser-app.ts`, output `resources/bundle.js`). Each example's HTML page selects its app via `<div id="sprotty-app" data-app="<name>">`; `browser-app.ts` dispatches on that attribute.

## Commands

```sh
npm run build -w examples      # webpack bundle + tsc (run root `npm run build` at least once first)
npm run watch                  # from repo root: rebuilds packages and bundle on change
npm run start -w examples      # serve at http://localhost:8080 — landing page lists all examples
```

Example URLs follow `http://localhost:8080/<dir>/<html-file>`, e.g. `/circlegraph/circlegraph.html`. Only `random-graph-distributed` talks to the WebSocket server, and its layout additionally needs an external elk-server (https://github.com/TypeFox/elk-server) running in socket mode; every other example is static.

## Adding an example

1. Create `examples/<name>/` with `<name>.html`, `css/page.css` + `css/diagram.css`, and `src/standalone.ts` exporting a `run<Name>()` function; `src/simpleAPI.ts` default-exports a diagram factory that `require`s its CSS inside the factory and returns `createSprottyDiagram({ … })`. Under `elements`, register only the types the default set lacks or that you deliberately override; put any other bindings in a `ContainerModule` passed through `modules`, which must not register default types (`docs/adr/0007-simplified-diagram-api.md`, Decision 2). Set `logLevel` and any viewer option that differs from the default explicitly. `standalone.ts` sets the model and dispatches through the returned `SprottyDiagram`.
2. Register it in `examples/browser-app.ts`: add the import *and* a branch in the `data-app` dispatch chain.
3. Add a card for it in `examples/index.html`.
4. Rebuild and verify in the browser at `http://localhost:8080/<name>/<name>.html`.

## Templates — copy from these

- Minimal client-only diagram: `circlegraph/`
- Client-server over WebSocket: `random-graph-distributed/` + `server/`
- ELK layout in the browser: `random-graph/`
- Edge routing (manhattan/bezier) and label editing: `classdiagram/`
- Custom views, styling, micro-layout, layout strategies: the four `*-showcase/` dirs (each has a README)
- Every example except `flowchart/` builds its diagram with `createSprottyDiagram` in `src/simpleAPI.ts`, and its `standalone.ts` uses the returned `SprottyDiagram` without `TYPES`; only `random-graph` (below) still calls `container.get`
- Same configuration written both ways: `custom-views-showcase/` keeps its hand-written `ContainerModule` in `src/di.config.ts`, unwired, next to `src/simpleAPI.ts`
- A service the diagram does not expose: `random-graph/src/standalone.ts` reads the ELK layout configurator through `diagram.container`
- Server-backed model source (no `setModel`; the model is requested through the dispatcher): `random-graph-distributed/`
- `flowchart/` still builds a hand-written container: `Flowchart.flowchartModule` from `sprotty-library` registers default types (`graph`, `label`, `edge`, the routing points), so it collides with `createSprottyDiagram`'s defaults until that module is brought in line with ADR-0007 (Decision 2)

The `configureX` helpers accept either a `Container` or the `{ bind, isBound }` pair from a `ContainerModule` callback; both are the exported `BindingContext` type. The examples register elements through `elements` instead; inside a hand-written module, pass the `context` object, as `custom-views-showcase/src/di.config.ts` and `flowchart/src/di.config.ts` do.
