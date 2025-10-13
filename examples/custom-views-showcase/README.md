# Custom Views Showcase

This example demonstrates various patterns for creating custom views in Sprotty. It serves as a companion to the [Custom Views Recipe](../../hugo/content/docs/recipes/custom-views.md) in the documentation.

## What This Example Demonstrates

### 🔵 Basic Custom Views

- **Circle, Triangle, Diamond shapes** - Simple geometric views created from scratch
- **Dynamic styling** - Color and shape properties controlled by model data
- **TSX syntax** - Clean declarative SVG rendering with TypeScript expressions

### ⭐ Enhanced Views

- **Extended base views** - Building upon `RectangularNodeView` with custom decorations
- **Status indicators** - Visual status badges (normal, warning, error, success)
- **Conditional decorations** - Borders and styling based on model properties

### 🏗️ Compositional Views

- **Complex node structure** - Headers, bodies, and footers as separate components
- **Reusable patterns** - Breaking down complex views into manageable methods
- **Icon and text integration** - Combining symbols, titles, and subtitles

### 🔄 Stateful Views

- **Conditional rendering** - Different visual representations based on node state
- **Loading states** - Progress bars and dynamic content updates
- **Error handling** - Visual feedback for different states (idle, loading, success, error)

### ↗️ Custom Edge Views

- **Line styles** - Solid, dashed, and dotted edge patterns
- **Visual properties** - Custom colors, thickness, and stroke patterns
- **Animations** - Animated edges with CSS keyframes
- **Arrow heads** - Custom edge termination rendering

### 🏷️ Custom Label Views

- **Enhanced text rendering** - Labels with backgrounds and borders
- **Typography control** - Custom fonts, sizes, and styling
- **Visual integration** - Labels that complement their parent elements

## Key Learning Objectives

After exploring this example, you should understand:

1. **View Creation Patterns** - How to implement `IView` interface effectively
2. **TSX Best Practices** - Proper use of Sprotty's JSX syntax and class system
3. **View Registry Configuration** - How to register custom views with dependency injection
4. **Rendering Context Usage** - Leveraging `RenderingContext` for child rendering and services
5. **Performance Considerations** - Visibility checks and efficient rendering techniques
6. **View Composition** - Breaking complex views into manageable, reusable components

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
   Navigate to `http://localhost:8080`

## Interactive Features

- **Selection** - Click on nodes to see selection highlighting
- **Hover Effects** - Mouse over elements for visual feedback
- **Live Updates** - Watch the loading node progress animate automatically
- **State Changes** - Observe different visual states across stateful nodes

## Code Structure

```
src/
├── model.ts          # Custom model classes with properties
├── views.tsx         # All custom view implementations
├── di.config.ts      # Dependency injection configuration
└── standalone.ts     # Application setup and sample data

css/
└── styles.css        # Comprehensive styling for all views

index.html            # Demo page with documentation
```

## View Implementation Highlights

### Basic Shape View Pattern

```typescript
@injectable()
export class BasicShapeView implements IView {
    render(node: Readonly<BasicShapeNode>, context: RenderingContext): VNode | undefined {
        // Visibility check
        if (!this.isVisible(node, context)) return undefined;

        // Dynamic shape rendering based on model properties
        switch (node.shape) {
            case 'circle': return this.renderCircle(node);
            case 'triangle': return this.renderTriangle(node);
            // ...
        }
    }
}
```

### Enhanced View Pattern

```typescript
@injectable()
export class EnhancedNodeView extends RectangularNodeView {
    override render(node: Readonly<EnhancedNode>, context: RenderingContext): VNode | undefined {
        // Base rendering + custom decorations
        return <g>
            <rect /* base rectangle */ />
            {this.renderStatusIndicator(node)}
            {node.showBorder && this.renderBorder(node)}
            {context.renderChildren(node)}
        </g>;
    }
}
```

### Compositional View Pattern

```typescript
@injectable()
export class ComplexNodeView implements IView {
    render(node: Readonly<ComplexNode>, context: RenderingContext): VNode | undefined {
        return <g>
            {node.showHeader && this.renderHeader(node)}
            {this.renderBody(node, context)}
            {node.showFooter && this.renderFooter(node)}
        </g>;
    }

    protected renderHeader(node: ComplexNode): VNode { /* ... */ }
    protected renderBody(node: ComplexNode, context: RenderingContext): VNode { /* ... */ }
    protected renderFooter(node: ComplexNode): VNode { /* ... */ }
}
```

## Next Steps

After exploring this example:

1. **Experiment** with the view implementations - modify colors, shapes, and behaviors
2. **Create your own** custom view types following these patterns
3. **Explore related recipes** - [Styling](../styling.md), [Micro-layout](../micro-layout.md)
4. **Build complex diagrams** using these view patterns as foundations

## Related Documentation

- [Custom Views Recipe](../../hugo/content/docs/recipes/custom-views.md) - Complete guide to custom view creation
- [Styling Recipe](../../hugo/content/docs/recipes/styling.md) - Advanced CSS techniques
- [Micro-layout Recipe](../../hugo/content/docs/recipes/micro-layout.md) - Child element organization
- [TSX Syntax Guide](../../hugo/content/docs/concepts/tsx-syntax.md) - Deep dive into Sprotty's JSX usage
