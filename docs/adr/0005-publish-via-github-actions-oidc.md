---
status: accepted
date: 2026-08-24
superseded-by:
---

# ADR-0005: Publish via GitHub Actions with npm trusted publishing; retire Lerna and Jenkins

## Context

The repo historically published its packages with Lerna (`lerna.json` with `forcePublish`, lerna as root devDependency) and was built on the Eclipse Foundation's Jenkins (`Jenkinsfile`, ci.eclipse.org/sprotty). Both predate the migrations to npm workspaces and GitHub Actions. In August 2026 a `publish.yml` workflow was added using `TypeFox/gh-publish-npm` with OIDC trusted publishing (`id-token: write`, `environment: publish`). At that point no script or workflow invoked Lerna anymore, and the Jenkinsfile still assumed Node 16 and yarn.

## Options considered

1. **Keep Lerna-driven publishing** — familiar, but requires npm tokens and duplicates what the workflow now does.
2. **GitHub Actions + gh-publish-npm (OIDC trusted publishing)** — tokenless, SHA-pinned actions, gated by the `publish` environment.

## Decision

Publishing runs exclusively through `.github/workflows/publish.yml` (npm trusted publishing). Lerna, `lerna.json`, and the `Jenkinsfile` were removed (2026-08-24, confirmed by the maintainer).

## Consequences

- No npm tokens to manage; the `publish` environment gates releases.
- Version bumps are manual commits to `packages/*/package.json` (versions kept in lock-step by convention); the workflow triggers on `package.json` changes pushed to `master` or `maintenance-*` branches.
- The workflow's Test step is advisory (`if: success() || failure()`) — a failing test does not block the publish; the Build CI on PRs is the actual quality gate.
- Anything that still references ci.eclipse.org or Lerna is stale by definition and should be fixed on sight.
