# Design docs

Design rationale kept true to the design as built: for one design, the strategy chosen, the trade-offs weighed, and the alternatives rejected. A change that alters a design amends its doc in the same change as a dated entry under *Amendments* — never a silent rewrite; a design replaced wholesale gets a new doc and the old one is marked historical. Each doc states its invariants with the test that enforces them, or notes that none does. The trust label tells a session whether to rely or re-check: `verified <date>` (checked against actual code behaviour on that date), `unverified` (rescued or aged, not yet checked), `historical` (superseded by reality, kept as design history). Single decisions live in `../adr/` instead.

| Doc | Date | Trust |
|---|---|---|
| [Edge routing architecture](edge-routing.md) | 2026-08-25 (rescued from 2019–2024 threads) | verified 2026-09-07 |
| [The semantic-model / view-model doctrine](view-model-doctrine.md) | 2026-08-25 (rescued from 2017–2026 talks & posts) | verified 2026-09-07 |
| [Rendering stack & performance strategy](rendering-and-performance.md) | 2026-08-25 (rescued from 2018–2023 talks & posts) | verified 2026-09-07 |
