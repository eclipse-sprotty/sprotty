# Sprotty Layout Strategies Showcase

This example demonstrates the three layout strategies available in Sprotty and how to configure them effectively. It serves as a companion to the [Layout Strategies Recipe](../../hugo/content/docs/recipes/layout-strategies.md) in the documentation.

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
   npm run serve
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8080/examples/layout-strategies-showcase.html`

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
├── di.config.ts      # Three separate DI modules for each strategy
└── standalone.ts     # Demo application with strategy switching

css/
├── diagram.css       # Diagram-specific styles
└── page.css          # Page layout and controls
```

## Implementation Patterns

### Client Layout Configuration

```typescript
const clientLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Enable client layout only
    configureViewerOptions(context, {
        needsClientLayout: true,
        needsServerLayout: false,
        baseDiv: 'sprotty'
    });

    // Register nodes with layout features
    configureModelElement(context, 'node:client', SNodeImpl, ClientLayoutNodeView);
});
```

### Server Layout Configuration

```typescript
const serverLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Configure ELK layout engine
    bind(ElkFactory).toConstantValue(elkFactory);
    bind(ILayoutConfigurator).to(ServerLayoutConfigurator);
    bind(TYPES.IModelLayoutEngine).toDynamicValue((context) => (
        new ElkLayoutEngine(
            context.container.get(ElkFactory),
            undefined,
            context.container.get(ILayoutConfigurator),
            undefined,
            undefined
        )
    )).inSingletonScope();

    // Enable server layout only
    configureViewerOptions(context, {
        needsClientLayout: false,
        needsServerLayout: true,
        baseDiv: 'sprotty'
    });
});
```

### Hybrid Layout Configuration

```typescript
const hybridLayoutModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    // Configure ELK layout engine
    bind(ElkFactory).toConstantValue(elkFactory);
    bind(ILayoutConfigurator).to(HybridLayoutConfigurator);
    bind(TYPES.IModelLayoutEngine).toDynamicValue((context) => (
        new ElkLayoutEngine(/* ... */)
    )).inSingletonScope();

    // Enable both layout types
    configureViewerOptions(context, {
        needsClientLayout: true,   // For micro-layout
        needsServerLayout: true    // For macro-layout
    });

    // Register with layout features
    configureModelElement(context, 'node:hybrid', SNodeImpl, HybridLayoutNodeView, {
        enable: [layoutContainerFeature, layoutableChildFeature]
    });
});
```

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

### Why Three Separate DI Modules?

Each layout strategy requires different:

- Viewer options configuration
- Layout engine bindings
- Model element registrations
- Feature enablement

Separating them into modules makes the differences explicit and the code easier to understand.

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

- [Layout Strategies Recipe](../../hugo/content/docs/recipes/layout-strategies.md) - Complete guide to layout configuration
- [Micro-Layout Recipe](../../hugo/content/docs/recipes/micro-layout.md) - Deep dive into client layout
- [Custom Views Recipe](../../hugo/content/docs/recipes/custom-views.md) - Creating views for your nodes
- [Eclipse Layout Kernel](https://www.eclipse.org/elk/reference.html) - ELK algorithm documentation
