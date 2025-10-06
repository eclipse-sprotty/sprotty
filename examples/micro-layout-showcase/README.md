# Sprotty Micro-Layout Showcase

This example demonstrates the micro-layout concepts in Sprotty, showing how to arrange elements inside nodes using different layout types and options.

## What This Example Demonstrates

### 1. Basic Layout Types

- **VBox Layout**: Children elements are stacked vertically
- **HBox Layout**: Children elements are arranged horizontally
- **Stack Layout**: Children elements are overlaid on top of each other

### 2. Interactive Layout Controls

- **Real-time Modification**: Change layout properties and see immediate visual feedback
- **Layout Options**: Experiment with alignment, padding, and sizing options
- **Preset Configurations**: Try common layout patterns with one click

### 3. Complex Layouts with Compartments

- **Dashboard Card**: Shows nested compartments with different layouts
- **Metric Widgets**: Demonstrates how compartments can contain multiple elements
- **Hierarchical Layouts**: VBox containing HBox compartments

### 4. Layoutable Child Features

- **Nested Nodes**: Shows how child nodes can respect parent layout when `layoutableChildFeature` is enabled
- **Layout Inheritance**: Demonstrates the difference between regular and layoutable children

## Key Learning Points

1. **Client-side Layout**: Micro-layout requires `needsClientLayout: true` in the DI configuration
2. **Layout Property**: Any `SNode` or `SCompartment` can have a `layout` property (`vbox`, `hbox`, or `stack`)
3. **Layout Options**: Fine-tune layouts with:
   - **Alignment**: `hAlign` and `vAlign` for positioning children
   - **Padding**: `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` for spacing
   - **Sizing**: `minWidth`, `minHeight`, and `resizeContainer` for size control
4. **Compartments**: Use `SCompartment` to create complex nested layouts
5. **Layoutable Children**: Enable `layoutableChildFeature` for nodes that should respect parent layout

## Interactive Features

### Layout Controls

- **Layout Type**: Switch between VBox, HBox, and Stack layouts
- **Alignment**: Control horizontal and vertical alignment (disabled for primary layout direction)
- **Padding**: Adjust spacing around children with sliders (0-50px)
- **Size Options**: Set minimum dimensions and container resizing behavior

### Preset Buttons

- **Preset 1**: Typical card layout with centered content and generous padding
- **Preset 2**: Horizontal layout optimized for dashboard widgets
- **Preset 3**: Compact horizontal layout for menu items
- **Reset**: Return to default settings

### Real-time Feedback

- Changes are applied immediately to the interactive card (blue card in the diagram)
- Visual transitions show the layout changes smoothly
- Value displays update as you adjust sliders

## Technical Implementation

### Model Structure

```typescript
// Interactive card with modifiable layout properties
{
    id: 'interactive-card',
    type: 'node:interactive-card',
    layout: 'vbox',                    // Can be changed via controls
    layoutOptions: {
        hAlign: 'center',              // left | center | right
        vAlign: 'center',              // top | center | bottom
        paddingTop: 10,                // Spacing in pixels
        paddingRight: 15,
        paddingBottom: 10,
        paddingLeft: 15,
        minWidth: 150,                 // Minimum dimensions
        minHeight: 100,
        resizeContainer: true          // Auto-resize based on content
    },
    children: [/* card elements */]
}
```

### DI Configuration

```typescript
// Essential: Enable client-side layout
configureViewerOptions(context, {
    needsClientLayout: true,    // Required for micro-layout
    baseDiv: 'sprotty'
});

// Enable layoutable child feature for nested nodes
configureModelElement(context, 'node:basic', SNodeImpl, RectangularNodeView, {
    enable: [layoutableChildFeature]
});
```

### Event Handling

```typescript
// Example: Layout type change
document.querySelectorAll('input[name="layout"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.checked) {
            updateInteractiveCard(modelSource, {
                layout: e.target.value
            });
        }
    });
});
```

## File Structure

- `src/model.ts` - Interactive card model with layout properties
- `src/views.tsx` - Custom views for cards and components
- `src/di.config.ts` - DI configuration with `needsClientLayout: true`
- `src/standalone.ts` - Main application and interactive controls
- `css/diagram.css` - Card and component styling
- `css/page.css` - Page layout and control panel styling
- `micro-layout-showcase.html` - Demo page with interactive controls

## Running the Example

1. Open `micro-layout-showcase.html` in a web browser
2. Observe the different layout types in the demo cards
3. Use the interactive controls on the right to modify the blue card
4. Try different presets to see common layout patterns
5. Experiment with various combinations to understand how layout options work together

## Related Documentation

- [Micro-Layout Recipe](https://sprotty.org/docs/recipes/micro-layout/) - Complete guide to micro-layout concepts
- [Sprotty Documentation](https://sprotty.org/docs/) - General Sprotty documentation
- [Layout API Reference](https://sprotty.org/docs/api/) - Detailed API documentation

This example provides hands-on experience with Sprotty's micro-layout system, making it easy to understand how to create well-organized, visually appealing node layouts in your own diagrams.
