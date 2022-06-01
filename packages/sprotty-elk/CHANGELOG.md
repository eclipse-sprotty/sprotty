## Eclipse Sprotty Change Log (elkjs Layout)

This change log covers only the `elkjs` layout of Sprotty. See also the change log of [sprotty](https://github.com/eclipse/sprotty/blob/master/packages/sprotty/CHANGELOG.md).

### v0.12.0 (Jun. 2022)

New features:
* Implemented client for running ELK layout in a separate process ([#282](https://github.com/eclipse/sprotty/pull/282)).
Adds `SocketElkServer` and `StdioElkServer` that enable to run the ELK layout engine in a separate Java process
* Aligned dependency to `inversify`: version constraint is now `^5.1.1` in all sprotty packages.

Fixed issues: https://github.com/eclipse/sprotty/issues?q=milestone%3Av0.12.0+is%3Aclosed+label%3Asprotty-elk

### v0.11.0 (Nov. 2021)

The `sprotty-elk` package was moved to the main repository of Sprotty, which is now a monorepo. Furthermore, the dependency to the `sprotty` package was removed in favor of the new `sprotty-protocol` package.

This package can now be used on the backend side with Node.js as well as on the frontend side:
 * In the backend, import from `'sprotty-elk/lib/elk-layout'`. These are the plain definitions without a dependency to InversifyJS.
 * In the frontend, import from `'sprotty-elk'` (the default export) or `'sprotty-elk/lib/inversify'`. These definitions are adapted to be used with InversifyJS.

Of course you can use the InversifyJS-specific definitions in the backend as well if you plan to use that DI framework there.

Breaking API changes:
 * The module `di.config` was removed in favor of `inversify`, which contains all InversifyJS-specific definitions.
 * The plain definitions in the module `elk-layout` no longer include InversifyJS annotations.
 * The `elkLayoutModule` no longer includes a binding for `TYPES.IModelLayoutEngine`. Add it like this:
```typescript
bind(TYPES.IModelLayoutEngine).toService(ElkLayoutEngine);
```
 * `ElkLayoutEngine` takes the new `SModelIndex` from `sprotty-protocol` as optional second parameter.

-----

### v0.10.0 (Nov. 2021)

No changes since v0.9.0; this release is to keep the versions of the Sprotty components synchronized.

### v0.9.0 (Aug. 2020)

Fixed issues: https://github.com/eclipse/sprotty-layout/milestone/4?closed=1

Breaking API changes:
 * Removed SModelIndexWithParent in favor of new functionality from Sprotty main package ([eclipse/sprotty#187](https://github.com/eclipse/sprotty/pull/187))

-----

### v0.8.0 (Apr. 2020)

New features:
 * Port labels ([#9](https://github.com/eclipse/sprotty-layout/pull/9))
 * Edge source and target for ports ([#10](https://github.com/eclipse/sprotty-layout/pull/10))

Fixed issues: https://github.com/eclipse/sprotty-layout/milestone/3?closed=1

-----

### v0.7.0 (Oct. 2019)

No changes since v0.6.0; this release is to keep the versions of the Sprotty components synchronized.

-----

### v0.6.0 (Mar. 2019)

First release of Sprotty with the Eclipse Foundation.
