## Eclipse Sprotty Change Log (elkjs Layout)

This change log covers only the `elkjs` layout of Sprotty. See also the change log of [sprotty](https://github.com/eclipse/sprotty/blob/master/packages/sprotty/CHANGELOG.md).

### v0.11.0 (Nov. 2021)

The `sprotty-elk` package was moved to the main repository of Sprotty, which is now a monorepo. Furthermore, the dependency to the `sprotty` package was removed in favor of the new `sprotty-protocol` package.

Breaking API changes:
 * The `elkLayoutModule` no longer includes a binding for `TYPES.IModelLayoutEngine`. Add it like this:
 ```typescript
 bind(TYPES.IModelLayoutEngine).toService(ElkLayoutEngine);
 ```
 * `ElkLayoutEngine` takes the new `SModelIndex` from `sprotty-protocol` as optional second parameter.

-----

### v0.10.0 (Nov. 2021)

No changes, this release is just to keep versions in sync.

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
