# Sprotty Protocol

This package contains the platform-independent definitions of Sprotty. They are used both by the main client code ([sprotty](https://www.npmjs.com/package/sprotty)) and by servers running in Node.js.

For Node.js-based diagram servers, a class `DiagramServer` is provided. It handles the state and message handling for one client, so you need to create one instance of that class for every diagram instance that is shown in the frontend.
