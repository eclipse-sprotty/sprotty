# The semantic-model / view-model doctrine

*Written 2026-08-25 as a design-history rescue from the founders' public communication (sources listed at the end); code-checkable consequences verified against the repo on that date. The protocol-level behaviour contract is `../product-specs/client-server-protocol.md` — this file keeps the doctrine those adjudications derive from.*

## The doctrine

The SModel is a **view model**: a lightweight, computed projection of an application-specific **semantic model** that Sprotty itself never sees. Producing a diagram is a model-to-model transformation (semantic model → SModel), re-run whenever the source changes. Three commitments follow:

- **The client holds only the view model of the current diagram.** Semantic knowledge — and the bulk of the data — stays behind the model source or server: "the diagram only knows about diagram stuff like nodes, edges, graphs" (EclipseCon France 2018). The split is consciously modeled on LSP's smart-server/dumb-client pattern, and its stated purpose is browser memory: a server "can handle much bigger amounts of data, e.g. from a database or a development workspace", which "minimizes the memory footprint on the client" (2017 announcement post). Do not move semantic-model or bulk-data handling into the client packages.
- **Diagrams are disposable projections, not documents.** Diagrams are "computed projections of richer underlying data, allowing multiple focused views to coexist" (2026 retrospective); Sprotty's stated goal is fast, customizable diagrams "without carrying over the complexity of traditional modeling frameworks" — no meta-model layer.
- **Regeneration wins.** When the source changes, the projection is recomputed. This is why regeneration erasing client-side edits is adjudicated *intended* ([#306](https://github.com/eclipse-sprotty/sprotty/issues/306)) and why `CommitModelAction` replaces the external model with a reduced copy ([#177](https://github.com/eclipse-sprotty/sprotty/issues/177)) — both recorded in the client-server spec. Features that would make the SModel authoritative (wholesale diagram-file persistence in core, meta-model layers) contradict the doctrine.

## Populating a diagram — the 2019 taxonomy

Three strategies with escalating cost (EclipseCon 2019; "canonical" is GMF's term):

1. **Canonical** — project the full semantic model. No persistence or reconciliation needed; layout is automatic.
2. **Filtered** — a rule-driven subset; additionally needs a UI for the filter rules.
3. **Manually composed** — the user picks elements; additionally needs diagram persistence *and* a reconciliation story.

Persistence/reconciliation complexity is a function of the chosen population strategy, not a framework deficiency.

## Editing: user changes go into the transformation, never into its output

The mapping from semantic model to view model is strictly unidirectional, and the EclipseCon 2019 talk states exactly why. The classic modeling world's instinct is a bidirectional transformation — implement the reverse direction too, since diagram changes look like model changes. That fails in two ways ("you should avoid the bidirectional mappings because of cycles and inconsistencies"):

- **Cycles.** A diagram-side change updates the semantic model; the forward mapping then fires again, and unless the implementation reliably detects that the resulting update "is not actually a semantic change … you run into a cycle. We see that often in many frameworks that are based on model-view-controller … you have these kinds of cycles and something else goes bananas."
- **Inconsistencies.** Two mappings maintaining the same relationship drift apart, and the two representations disagree.

The positive rule covers *all* diagram interaction, not just editing: **every user change is applied to an input of the semantic-model → SModel transformation, and the transformation is re-run.** Which input depends on the population strategy (taxonomy above): in a canonical diagram the only input is the semantic model itself — "there's no way to change the model from the diagram side"; filtered and manually composed diagrams add a second input, the *diagram configuration* ("just another ingredient to the transformation" — filter rules, picked elements, positions, routing points), and gestures like hiding a node mutate that configuration. The SModel stays a pure output in every case. Note the rule bans bidirectional *mutation* only — bidirectional *navigation* (selection focus syncing from text to diagram, double-click navigating from diagram to source) is fine and comes for free in the language-server integration.

**The Sprotty way in language-server scenarios: reuse the server's existing semantic operations** — "translate your user interactions, your user actions, everything a user does on the diagram, into semantic operations … don't try to automatically convert that back." Concretely, don't invent diagram-side edit mechanisms; surface LSP operations in the diagram (all three demonstrated in the 2019 talk):

- **Code actions as the palette** — the diagram palette asks the language server over LSP which code actions are available at a position and triggers them: "there's no reason why I shouldn't use the same semantic operation" that appears as a quick-fix light bulb in the text editor.
- **Rename refactoring for name labels** — editing a node's name label does "not change the diagram model here but [triggers] a semantic action, a rename, from the language server protocol, such that all the references to that element get updated."
- **Content assist for cross-reference labels** — double-clicking such a label triggers LSP completion: the SModel carries the corresponding text offset, the completion result is inserted as text, and a wrong choice yields a normal validation error, visible in the diagram too.

One semantic operation, defined once on the server, surfaces in both the text editor and the diagram — the pattern GLSP later generalized as its *operations*. In language-server scenarios this hardens into the text-first rule: "the diagram is always updated from changes of the text, never the other way around" (2020 post).

Two pragmatic caveats close the argument. For canonical diagrams that only want manual node positions (the state-machine case), storing that bit of layout in the semantic model itself is acceptable — one file instead of two, "of course not the purist approach", but simpler. And question the requirement itself: "maybe diagram editing is not necessary — it adds a lot of complexity … it may not be the most sensible thing to spend an hour laying out your diagram when you can instead write a proper semantic model fast." Combined text+diagram editing is judged genuinely hard — element identity, error handling, transactions — which is why sprotty core keeps only limited editing machinery and graphics-first editing is deliberately left to GLSP (see the ecosystem section in `../ARCHITECTURE.md`).

## Persistence: never the SModel

When an application persists diagram state (population choices, manual positions), it must not serialize the SModel/external model: "we decided not to store the s-model for persisting the diagram state because it's just too detailed" — and unmergeable in a git repository (EclipseCon 2019). Persist a reduced, human-readable format holding only what the user actually modified, each entry carrying a trace to its semantic element.

## Reconciliation: manual, via issue markers

When persisted diagram state goes stale against the semantic model (elements renamed or deleted), the intended behaviour is to *mark* orphaned elements and let the user clean up (the `decoration` feature ships the marker mechanism). Automatic reconciliation was explicitly rejected: transient broken states — a syntax error mid-edit that makes half the model vanish — would destroy the user's diagram work before they finish typing (EclipseCon 2019).

## Sources

- [Sprotty — a web-based diagramming framework](https://www.typefox.io/blog/sprotty-a-web-based-diagramming-framework/) (Jan Köhnlein, 2017)
- [sprotty — Graphical Views For Web Applications](https://www.youtube.com/watch?v=xv_Nn2wP9fE) (Köhnlein/Spönemann, EclipseCon France 2018)
- [Graphical Views for Web-Based Modeling Tools With Theia and Sprotty](https://www.youtube.com/watch?v=dZu4aCoudDM) (Spönemann/Köhnlein, EclipseCon Europe 2019) — population taxonomy, editing, persistence, reconciliation
- [Domain-specific languages in Theia and VS Code](https://www.typefox.io/blog/domain-specific-languages-in-theia-and-vs-code/) (Köhnlein, 2020) — the text-first rule
- [Textual and graphical languages for the cloud era](https://www.typefox.io/blog/textual-graphical-languages-cloud-era/) (Spönemann, 2022)
- [10 years of open source](https://www.typefox.io/blog/10-years-of-open-source/) (Spönemann, 2026) — the view-model positioning restated
