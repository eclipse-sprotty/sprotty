# Exec plan: AX remediation roadmap

- **Status**: active (in `docs/exec-plans/active/`; move the file to `completed/` when done)
- **Goal**: work off the gaps found in the 2026-08-24 agent-readiness audit, foundational first; done when every step below is either shipped or explicitly rejected.

Context: the audit set up AGENTS.md/CLAUDE.md, `docs/ARCHITECTURE.md`, ADR-0001, and fixed the broken command surface (per-package test scripts, Vitest 4 config, publish.yml branch filters, dead Jenkinsfile/Lerna, stale README commands and links, `.vscode` configs). Everything below was found but deliberately deferred.

## Decomposition

Foundational → sophisticated; each step is individually shippable.

- [ ] **Publish workflow follow-ups**: the `dry-run: ${{ github.event_name == 'pull_request' }}` input is vestigial (no `pull_request` trigger), and the Test step is advisory (`if: success() || failure()`) — decide whether tests should gate publishing.
- [ ] **Header rule promotion**: the interview confirmed the full EPL/GPL header block incl. `SPDX-License-Identifier` is mandatory, but `header/header` only checks the copyright line (a 2026 spec file already lacks the SPDX line). Extend the lint pattern to the full block, with a self-correction message pointing at a reference file.
- [ ] **Lint warning debt**: ~20 rules sit at `warn` and never gate (CI is green with warnings). Fix the 6 current warnings, then either promote the valuable rules to `error` + `--max-warnings 0` in CI, or drop the rest. Remove `eslint-plugin-no-null` (loaded, only rule set to `off`). Decide the prettier question: `eslint-config-prettier` is extended but prettier is not installed — adopt prettier or remove the config.
- [ ] **TypeScript strictness**: `strict: true` is not set; `strictFunctionTypes` and `strictPropertyInitialization` are silently off. Try enabling full `strict` and measure the fallout.
- [ ] **Structural dependency rules**: add dependency-cruiser (or similar) encoding the package layering (`sprotty-protocol` imports nothing; `sprotty-elk`'s core stays inversify-free) and cycle detection for package code — today the only cycle detector is webpack's plugin over the examples-reachable graph.
- [ ] **Test coverage gaps**: `features/edit` (9 source files, 0 specs), `expand`, `decoration`, `button`, `command-palette`, `fade`, `open`, `projection`, `undo-redo`, `ui-extensions`, and the new `pointer-tool.ts`/`touch-tool.ts` are untested; `sprotty-library` is published with zero tests and no `tsconfig.test.json`.
- [ ] **CHANGELOG backlog**: per-package changelogs stop at Dec 2024 (~20 months incl. the ESM and npm migrations unrecorded); root `CHANGELOG.md` index omits `sprotty-library`; `sprotty-library` has no CHANGELOG, README, or LICENSE file despite being published.
- [ ] **Examples cleanup**: dead `examples/custom-views-showcase/css/styles.css`; duplicate `id="sprotty-app"` in `multicore.html`; naming inconsistencies (`multicore/src/multicore.ts` vs the `standalone.ts` convention, two examples both named `random-graph.html`); normalize `configureModelElement(container, …)` to `context` in `random-graph*/src/di.config.ts`; `sprotty-library` lists `"css"` in package files but ships no css dir.
- [ ] **Deferred spec candidates** (2026-08-25 triage): the `edit` capability and the command-stack/undo-redo lifecycle were shortlisted for behaviour specs but deferred — write each spec-first when its area is next touched (the edit spec naturally precedes the test-gap work above). `docs/product-specs/index.md` routes the specs that exist.
- [ ] **Mechanized API surface**: add a committed, PR-diffed API report (e.g. api-extractor) for the published packages, regenerated in CI into a dedicated generated-docs directory, turning signature compatibility into a sensor; prose contracts then only carry what signatures can't.
- [ ] **Doc-freshness sensor**: declined in the 2026-08-24 session; revisit whether a mechanical link/command checker over AGENTS.md + docs/ should run in CI.
- [ ] **Governance visibility**: no CODEOWNERS, SECURITY.md, or issue/PR templates (Eclipse-delegated — decide if minimal in-repo ones are wanted); dependabot runs with no in-repo config (`.github/dependabot.yml` would make it legible); README wiki screenshots still point at the old `eclipse/sprotty` org path.
- [ ] **Website repo coordination** (sprotty-website): the core-components concepts page carries an unreviewed `<!-- AI GENERATED BELOW -->` section; tutorials pre-date the ESM migration and need re-verification; the TypeDoc API reference is regenerated manually (last 2025-09) — automate; the recipes never link their companion `examples/*-showcase/`; the landing-page showcase runs on a 2023 `0.14.0-next` prerelease of sprotty; consider publishing an `llms.txt` on sprotty.org for downstream consumer agents; and evaluate moving the docs content source into this repo with the site syncing from it (the Svelte model) so docs and code change in one reviewed PR — an org-level decision, proposal only.

## Progress log

- 2026-08-25: Feature-module index added to `docs/ARCHITECTURE.md`; `docs/product-specs/` opened with the client-server protocol spec; ADR-0002 rescued; AGENTS.md gained the behaviour-contract coupling.
- 2026-08-24: Plan created from the agent-readiness audit (fleet of 5 research agents + verification by execution). Nothing below the fold started.

## Decision log

- 2026-08-25: Spec/design-doc triage with the maintainer — bug-vs-intended has no durable in-repo adjudicator (trigger confirmed); one spec created (`docs/product-specs/client-server-protocol.md`); sprotty.org-documented behaviour confirmed as a compatibility promise (recorded in AGENTS.md); design-history rescue limited to key PR/issue threads (ADR-0002 rescued from #233/#243); edit + command-stack specs deferred.
- 2026-08-24: Doc-freshness CI check (check_docs.py) declined by the maintainer for now — kept as a roadmap item instead.
- 2026-08-24: Vitest single-worker pin removed (suite proven green with 8 workers); per-package `test` scripts repaired; publish.yml branch filters fixed to `master`/`maintenance-*`; Jenkinsfile and Lerna removed (see ADR-0001).

## Open questions

- Should the publish workflow's Test step gate the publish?
