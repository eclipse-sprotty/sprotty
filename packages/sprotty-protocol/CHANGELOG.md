## Eclipse Sprotty Change Log (Client-Server Protocol)

This change log covers only the client-server protocol of Sprotty. See [here](https://github.com/eclipse-sprotty/sprotty/blob/master/CHANGELOG.md) for other packages.

### v1.3.0 (Jul. 2024)

 * Moved actions related to SVG exporting from the `sprotty` package ([#459](https://github.com/eclipse-sprotty/sprotty/pull/459)).

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/14?closed=1

-----

### v1.2.0 (Apr. 2024)

 * Made (client) layout options available in `sprotty-protocol` ([#426](https://github.com/eclipse-sprotty/sprotty/pull/426)).

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/13?closed=1

-----

### v1.1.0 (Jan. 2024)

 * Moved more interfaces used for defining Sprotty (external) models into this package so they can be used in backend applications ([#413](https://github.com/eclipse-sprotty/sprotty/pull/413)).
 * Other smaller improvements ([#409](https://github.com/eclipse-sprotty/sprotty/pull/409))

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/11?closed=1

-----

## v1.0.0 (Oct. 2023)

This version marks the transition of Sprotty's incubation phase into maturity. As part of this, all deprecated API have been removed.

 * Add request context to avoid collisions in request IDs ([#385](https://github.com/eclipse-sprotty/sprotty/pull/385)); when using this package in a server context, call `setRequestContext('server')` to ensure that requests are disambiguated from other contexts.
 * Removed all API that was marked as deprecated in any previous release ([#374](https://github.com/eclipse-sprotty/sprotty/pull/374))

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/6?closed=1

-----

### v.0.14.0 (Aug. 2023)

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/10?closed=1

-----

### v0.13.0 (Dec. 2022)

 * Moved more actions from `sprotty` to `sprotty-protocol` to make them available in backend applications ([#326](https://github.com/eclipse-sprotty/sprotty/pull/326)).

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/9?closed=1

-----

### v0.12.0 (Jun. 2022)

 * Added `ServerActionHandlerRegistry` service to register action handlers for all `DiagramServer` instances ([#260](https://github.com/eclipse-sprotty/sprotty/pull/260)).

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/8?closed=1
