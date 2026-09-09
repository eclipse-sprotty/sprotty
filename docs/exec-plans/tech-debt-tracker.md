# Tech-debt tracker

Known debt that is tolerated on purpose, each entry with the reason it is tolerated and what would pay it off. Add an entry when debt is consciously deferred; delete it when the debt is paid. In-flight work belongs in an exec plan under `active/`, not here.

## Entries

- **ESLint 9 / flat-config migration** (added 2026-09-09, carried over from the completed AX remediation roadmap, `docs/exec-plans/completed/ax-remediation-roadmap.md`): ESLint 8 is end-of-life and the repo still uses the legacy `.eslintrc.js`. typescript-eslint 8 already supports flat config and no other eslint plugin remains, so the migration is unblocked; the deprecated core formatting rules (`brace-style`, `max-len`, …) move to `@stylistic` in the same step. Tolerated because the current lint gate works (`npm run lint`, all rules at `error`, `--max-warnings 0`) and the migration is tooling-only. Maintainer decision 2026-09-09: wanted eventually, but it does not block the AX remediation plan.
