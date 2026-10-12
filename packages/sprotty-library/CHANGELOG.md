## Eclipse Sprotty Change Log (sprotty-library)

This change log covers only the `sprotty-library` package of Sprotty. See [here](https://github.com/eclipse-sprotty/sprotty/blob/main/CHANGELOG.md) for other packages.

### v2.0.0 (unreleased)

 * The package is now published as ES modules only ([#515](https://github.com/eclipse-sprotty/sprotty/pull/515)), in line with the other Sprotty packages. `sprotty-protocol` is now a declared dependency.
 * Updated dependency to `inversify` through `sprotty` ([#561](https://github.com/eclipse-sprotty/sprotty/pull/561)): version constraint is now `~8.2` in all sprotty packages. `flowchartModule` is loaded as before; see the [`sprotty` change log](https://github.com/eclipse-sprotty/sprotty/blob/main/packages/sprotty/CHANGELOG.md) for the changes required in application code.
 * The package now ships a README and its LICENSE file; previous versions were published without them. Version 1.4.0 of this package was not published to npm, so 1.3.0 is its last 1.x release.

-----

### v1.2.0 (Apr. 2024)

 * First release: standard flowchart shapes with matching views, registered through `Flowchart.flowchartModule` ([#423](https://github.com/eclipse-sprotty/sprotty/pull/423)).

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/13?closed=1
