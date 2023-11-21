![Sprotty](./sprotty-logo-500px.png)

[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/eclipse-sprotty/sprotty)
[![Join the chat at https://gitter.im/eclipse/sprotty](https://badges.gitter.im/eclipse/sprotty.svg)](https://gitter.im/eclipse/sprotty?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is the client part of _Sprotty_, a next-generation, open-source diagramming framework built with web technologies.

<img src="https://raw.githubusercontent.com/wiki/eclipse/sprotty/images/screenshot0.png" width="23%" align="left">
<img src="https://raw.githubusercontent.com/wiki/eclipse/sprotty/images/screenshot1.png" width="23%" align="left">
<img src="https://raw.githubusercontent.com/wiki/eclipse/sprotty/images/screenshot2.png" width="23%" align="left">
<img src="https://raw.githubusercontent.com/wiki/eclipse/sprotty/images/screenshot3.png" width="23%">


Some selected features:

* Fast, scalable SVG rendering that is compatible with all modern browsers and stylable with CSS
* Animations built into the core
* Support for a distributed runtime with client and server
* Fast, reactive client architecture implemented in TypeScript
* Java or Node.js based server architecture
* Configuration via dependency injection
* Integrations with Xtext, Langium, the Language Server Protocol, VS Code and Theia
* Can be run as rich-client as well as in the browser

## Repositories

The Sprotty project spans across four GitHub repositories.

* [sprotty](https://github.com/eclipse-sprotty/sprotty) (this repository) contains the client code (`sprotty`), shared code for Node.js servers (`sprotty-protocol`), ELK layout integration (`sprotty-elk`) and examples.
* [sprotty-server](https://github.com/eclipse-sprotty/sprotty-server) contains server code for Java and includes server-side diagram layout, the extension of the Language Server Protocol, and the integration with the Xtext framework.
* [sprotty-theia](https://github.com/eclipse-sprotty/sprotty-theia) contains the glue code to integrate Sprotty views in the Theia IDE.
* [sprotty-vscode](https://github.com/eclipse-sprotty/sprotty-vscode) contains the glue code to integrate Sprotty views in VS Code.

The project is built on [ci.eclipse.org/sprotty](https://ci.eclipse.org/sprotty/).

## Docs

For further information please consult the [documentation on the website](https://sprotty.org/docs/).

The version history is documented in the [CHANGELOG](https://github.com/eclipse-sprotty/sprotty/blob/master/CHANGELOG.md). Changes are tracked seperately for each package.

## References

- [Example: view filtering](https://github.com/TypeFox/sprotty-view-filtering) &ndash; using filtering to efficiently navigate a large dataset of publications and citations
- [Example: nested graphs](https://github.com/TypeFox/sprotty-nested-demo) &ndash; expanding nested subgraphs in-place to efficiently navigate a large project with TypeScript modules
- [Yangster](https://github.com/TypeFox/yang-vscode) &ndash; a VS Code extension for the YANG language
