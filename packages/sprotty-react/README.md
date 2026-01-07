# sprotty-react

React integration for [Sprotty](https://github.com/eclipse-sprotty/sprotty) diagrams.

This package enables rendering native React components within Sprotty diagram nodes using React Portals projected into SVG `foreignObject` elements.

## Features

- **Native React Components**: Render React components as diagram nodes with full React Context support
- **Event Isolation**: Automatic event trapping prevents conflicts between React interactions and Sprotty tools
- **Action Dispatch**: Use the `useSprottyDispatch` hook to dispatch Sprotty actions from React components
- **Model Access**: Access the Sprotty model from React components via `useSprottyModel` hook
- **Auto Layout Sync**: ResizeObserver integration for automatic layout updates when node content changes

## Installation

```bash
npm install sprotty-react
# or
yarn add sprotty-react
```

## Quick Start

### 1. Configure your DI container

```typescript
import { Container, ContainerModule } from 'inversify';
import { loadDefaultModules, SGraphImpl, SGraphView, configureModelElement } from 'sprotty';
import { reactModule, configureReactNode, SReactNode } from 'sprotty-react';
import { TaskNodeComponent } from './task-node';

const myModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Configure graph
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);

    // Configure React node
    configureReactNode(context, 'node:task', SReactNode, TaskNodeComponent);
});

const container = new Container();
loadDefaultModules(container);
container.load(reactModule, myModule);
```

### 2. Create a React component for your node

```tsx
import React from 'react';
import { useSprottyDispatch, SReactNode } from 'sprotty-react';

interface TaskNodeProps {
    model: SReactNode;
}

export const TaskNodeComponent: React.FC<TaskNodeProps> = ({ model }) => {
    const dispatch = useSprottyDispatch();

    const handleDelete = () => {
        dispatch({ kind: 'deleteElement', elementId: model.id });
    };

    return (
        <div className="task-node">
            <h3>{model.id}</h3>
            <button onClick={handleDelete}>Delete</button>
        </div>
    );
};
```

### 3. Render the diagram with SprottyDiagram

```tsx
import React from 'react';
import { SprottyDiagram } from 'sprotty-react';
import createContainer from './di.config';

export const App: React.FC = () => {
    const container = createContainer('sprotty');

    return (
        <div>
            <SprottyDiagram container={container} />
        </div>
    );
};
```

## API Reference

### Components

- **`SprottyDiagram`**: Main React wrapper component that manages the Sprotty diagram
- **`EventTrap`**: Wrapper component that prevents event propagation to Sprotty

### Hooks

- **`useSprottyDispatch()`**: Returns the Sprotty `IActionDispatcher` for dispatching actions
- **`useSprottyModel()`**: Returns the current Sprotty model

### Configuration

- **`configureReactNode(context, type, modelClass, ReactComponent)`**: Helper to configure React nodes
- **`reactModule`**: Inversify ContainerModule with all sprotty-react bindings

### Models

- **`SReactNode`**: Base model class for React-rendered nodes

## License

[EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0](LICENSE)

