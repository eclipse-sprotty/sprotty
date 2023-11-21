# sprotty-elk

Integration of the [Eclipse Layout Kernel (ELK)](https://www.eclipse.org/elk/) with [Eclipse Sprotty](http://github.com/eclipse/sprotty). This package makes the ELK layout engine available to graph visualizations based on Sprotty. It can be used both on the frontend (with `LocalModelSource`) and on the backend (with `DiagramServer`).

## Build

```bash
yarn
```

The project is built on [ci.eclipse.org/sprotty](https://ci.eclipse.org/sprotty/).

Pre-built npm packages available from [npmjs](https://www.npmjs.com/package/sprotty-elk).

## References

- [Example: view filtering](https://github.com/TypeFox/sprotty-view-filtering) &ndash; using filtering to efficiently navigate a large dataset of publications and citations
- [Example: nested graphs](https://github.com/TypeFox/sprotty-nested-demo) &ndash; expanding nested subgraphs in-place to efficiently navigate a large project with TypeScript modules
