# Sprotty Layout Strategies Showcase

This example demonstrates the three layout strategies available in Sprotty and how to configure them effectively. It serves as a companion to the [Layout Strategies Recipe](https://sprotty.org/docs/recipes/layout-strategies/) in the documentation.

## What This Example Demonstrates

### 📱 Client-Only Layout (Micro-Layout)

- **Browser-based layout** - All layout computation happens in the browser
- **Content-aware sizing** - Uses actual font metrics and CSS information
- **Rich internal structure** - Labels, compartments, and complex nested content
- **Layout options** - Padding, gaps, alignment configurations

### 🖥️ Server-Only Layout (Macro-Layout)

- **Algorithm-driven positioning** - Uses Eclipse Layout Kernel (ELK)
- **Network diagram optimization** - Layered, force-directed, and other algorithms
- **Minimal client overhead** - Server computes all positions
- **Simple node structure** - Focus on relationships over content

### 🔄 Hybrid Layout

- **Best of both worlds** - Combines client and server layout strengths
- **Two-phase workflow** - Client computes content bounds, server computes positions
- **Complex diagrams** - Rich content nodes in algorithmically-arranged diagrams
- **Optimal for real applications** - Balance between content richness and layout quality

## Key Learning Objectives

After exploring this example, you should understand:

1. **Layout Strategy Selection** - When to use client, server, or hybrid approaches
2. **Configuration Patterns** - How to set up each strategy with dependency injection
3. **Viewer Options** - Configuring `needsClientLayout` and `needsServerLayout` properly
4. **ELK Integration** - Setting up Eclipse Layout Kernel for server-side layout
5. **Layout Workflow** - Understanding the bounds computation and rendering phases
6. **Model Structure** - How to structure models for each layout strategy

## Running the Example

1. **Build the example:**

   ```bash
   npm run build
   ```

2. **Start the development server:**

   ```bash
   npm start -w examples
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8080/layout-strategies-showcase/layout-strategies-showcase.html`

## Interactive Features

- **Strategy Switching** - Click buttons to switch between client, server, and hybrid layouts
- **Same Content, Different Layouts** - See how the same microservices architecture renders with each strategy
- **Visual Comparison** - Observe the differences in layout quality and node appearance
- **Real-time Switching** - Experience instant strategy changes without page reload

## Code Structure

```
src/
├── model.ts          # Layout-aware model classes for each strategy
├── views.tsx         # Custom views optimized for each layout type
├── simpleAPI.ts      # One set of diagram options per strategy
└── standalone.ts     # Demo application with strategy switching

css/
├── diagram.css       # Diagram-specific styles
└── page.css          # Page layout and controls
```

## Implementation Patterns

Each strategy is one set of options for `createSprottyDiagram`, in `simpleAPI.ts`. The diagram
supplies the model source, the logger and the default element types; every strategy replaces the
default `edge` view with `LayoutEdgeView`.

### Client Layout Configuration

```typescript
client: () => ({
    // needsClientLayout: true and needsServerLayout: false are the defaults
    logLevel: LogLevel.log,
    elements: {
        'node:client': [SNodeImpl, ClientLayoutNodeView],
        'edge': [SEdgeImpl, LayoutEdgeView]
        // ...compartments and labels with layoutableChildFeature
    }
})
```

### Server Layout Configuration

```typescript
// Shared by the server and hybrid strategies
function elkLayoutEngineModule(configurator: typeof DefaultLayoutConfigurator): ContainerModule {
    return new ContainerModule((bind) => {
        bind(ElkFactory).toConstantValue(elkFactory);
        bind(ILayoutConfigurator).to(configurator);
        bind(TYPES.IModelLayoutEngine).toDynamicValue((context) => (
            new ElkLayoutEngine(
                context.container.get(ElkFactory),
                undefined,
                context.container.get(ILayoutConfigurator),
                undefined,
                undefined
            )
        )).inSingletonScope();
    });
}

server: () => ({
    // Enable server layout only
    viewerOptions: {
        needsClientLayout: false,
        needsServerLayout: true
    },
    logLevel: LogLevel.log,
    modules: [elkLayoutEngineModule(ServerLayoutConfigurator)],
    elements: {
        'node': [ServerLayoutNode, ServerLayoutNodeView],
        'edge': [LayoutEdge, LayoutEdgeView]
    }
})
```

### Hybrid Layout Configuration

```typescript
hybrid: () => ({
    // Enable both layout types: client layout (the default) for micro-layout,
    // server layout for macro-layout
    viewerOptions: {
        needsServerLayout: true
    },
    logLevel: LogLevel.log,
    modules: [elkLayoutEngineModule(HybridLayoutConfigurator)],
    elements: {
        // Register with layout features
        'node:hybrid': [SNodeImpl, HybridLayoutNodeView, {
            enable: [layoutContainerFeature, layoutableChildFeature, boundsFeature]
        }],
        'edge': [SEdgeImpl, LayoutEdgeView]
        // ...compartments and labels
    }
})
```

`createLayoutDiagram(strategy)` builds a fresh diagram from the chosen options each time the
strategy is switched.

## Layout Strategy Comparison

| Aspect | Client Layout | Server Layout | Hybrid Layout |
|--------|--------------|---------------|---------------|
| **Computation** | Browser | Server/Algorithm | Both |
| **Node Content** | Rich, complex | Simple, minimal | Rich, complex |
| **Best For** | Content-heavy nodes | Network diagrams | Real applications |
| **Performance** | Good for small diagrams | Scales to large diagrams | Balanced |
| **Positioning** | Manual or simple | Algorithmic | Algorithmic |
| **Font Metrics** | Accurate | Estimated | Accurate |

## Design Decisions Explained

### Why Three Separate Option Sets?

Each layout strategy requires different:

- Viewer options configuration
- Layout engine bindings
- Model element registrations
- Feature enablement

Separating them into one options object per strategy makes the differences explicit and the code easier to understand.

### Why Different Node Views?

Each strategy benefits from views optimized for its use case:

- **Client views** render rich content that client layout will position
- **Server views** are simpler since server handles all positioning
- **Hybrid views** combine header/body separation with client-managed content

### Why the Same Diagram Content?

Using identical content (a microservices architecture) across all three strategies lets you directly compare:

- Layout quality and aesthetics
- Node appearance and information density
- Edge routing differences
- Performance characteristics

## Next Steps

After exploring this example:

1. **Experiment** with the layout configurations - try different ELK algorithms
2. **Modify the models** - add more nodes or change the content structure
3. **Compare performance** - observe differences with larger diagrams
4. **Build your own** - use these patterns as a starting point for your applications

## Related Documentation

- [Layout Strategies Recipe](https://sprotty.org/docs/recipes/layout-strategies/) - Complete guide to layout configuration
- [Micro-Layout Recipe](https://sprotty.org/docs/recipes/micro-layout/) - Deep dive into client layout
- [Custom Views Recipe](https://sprotty.org/docs/recipes/custom-views/) - Creating views for your nodes
- [Eclipse Layout Kernel](https://www.eclipse.org/elk/reference.html) - ELK algorithm documentation
