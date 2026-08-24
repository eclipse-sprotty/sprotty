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

1. Create `examples/<name>/` with `<name>.html`, `css/page.css` + `css/diagram.css`, and `src/standalone.ts` exporting a `run<Name>()` function; `src/di.config.ts` default-exports a container factory that `require`s its CSS inside the factory and ends with `loadDefaultModules(container)` **before** loading the example module.
2. Register it in `examples/browser-app.ts`: add the import *and* a branch in the `data-app` dispatch chain.
3. Add a card for it in `examples/index.html`.
4. Rebuild and verify in the browser at `http://localhost:8080/<name>/<name>.html`.

## Templates — copy from these

- Minimal client-only diagram: `circlegraph/`
- Client-server over WebSocket: `random-graph-distributed/` + `server/`
- ELK layout in the browser: `random-graph/`
- Edge routing (manhattan/bezier) and label editing: `classdiagram/`
- Custom views, styling, micro-layout, layout strategies: the four `*-showcase/` dirs (each has a README)

Do **not** copy the `configureModelElement(container, ...)` call from `random-graph*/src/di.config.ts` — passing the container instead of the `context` object is a quirk that happens to work; every other example passes `context` (see `classdiagram/src/di.config.ts`).
