## Eclipse Sprotty Change Log (Client-Server Protocol)

This change log covers only the client-server protocol of Sprotty. See [here](https://github.com/eclipse-sprotty/sprotty/blob/master/CHANGELOG.md) for other packages.

### v1.0.0 (Oct. 2023)

This version marks the transition of Sprotty's incubation phase into maturity. As part of this, all deprecated API have been removed.

 * Add request context to avoid collisions in request IDs ([#385](https://github.com/eclipse-sprotty/sprotty/pull/385)); when using this package in a server context, call `setRequestContext('server')` to ensure that requests are disambiguated from other contexts.
 * Removed all API that was marked as deprecated in any previous release ([#374](https://github.com/eclipse-sprotty/sprotty/pull/374))

Fixed issues and closed PRs: https://github.com/eclipse-sprotty/sprotty/milestone/6?closed=1

-----

## v.0.14.0 (Aug. 2023)

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/10?closed=1

-----

### v0.13.0 (Dec. 2022)

 * Moved more actions from `sprotty` to `sprotty-protocol` to make them available in backend applications ([#326](https://github.com/eclipse-sprotty/sprotty/pull/326)).

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/9?closed=1

-----

### v0.12.0 (Jun. 2022)

 * Added `ServerActionHandlerRegistry` service to register action handlers for all `DiagramServer` instances ([#260](https://github.com/eclipse-sprotty/sprotty/pull/260)).

Fixed issues: https://github.com/eclipse-sprotty/sprotty/milestone/8?closed=1
