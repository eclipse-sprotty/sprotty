# Sprotty Layout Strategies Showcase

This example demonstrates the different layout strategies available in Sprotty and how to configure them effectively.

## What This Example Demonstrates

### Layout Strategy Patterns

1. **Client-Only Layout**
   - Micro-layout computed entirely in the browser
   - Perfect for content-heavy nodes with labels and compartments
   - Leverages actual font metrics and CSS styling

2. **Server-Only Layout**
   - Macro-layout computed on the server or via layout algorithms
   - Ideal for complex network topologies and large diagrams
   - Uses sophisticated algorithms like ELK for optimal positioning

3. **Hybrid Layout**
   - Combines both client and server layout strengths
   - Client handles internal node content, server handles node positioning
   - Best of both worlds for complex, content-rich diagrams

### Interactive Features

- **Layout Mode Switching**: Toggle between different layout strategies
- **Dynamic Content**: Add/remove nodes to see layout adaptation
- **Performance Monitoring**: View layout computation times
- **Debug Visualization**: See layout boundaries and computation steps

## Key Learning Points

- **When to use each layout strategy** based on diagram complexity and requirements
- **Configuration patterns** for different layout scenarios
- **Performance considerations** and optimization techniques
- **Bounds computation workflow** and debugging approaches
- **Best practices** for layout strategy selection

## Files Structure

- `src/model.ts` - Layout-aware model definitions
- `src/views.tsx` - Views optimized for different layout strategies
- `src/di.config.ts` - Dependency injection configuration for layout engines
- `src/standalone.ts` - Main application with layout switching
- `css/page.css` - Page layout and UI styling
- `css/diagram.css` - Diagram-specific styles optimized for layout performance

## Usage

This example runs entirely in the browser. Open `layout-strategies-showcase.html` to explore the different layout approaches and see how they affect diagram rendering and performance.

## Related Documentation

- [Layout Strategies Recipe](https://sprotty.org/docs/recipes/layout-strategies/)
- [Micro-Layout Recipe](https://sprotty.org/docs/recipes/micro-layout/)
- [Eclipse Layout Kernel (ELK)](https://www.eclipse.org/elk/)
