# Sprotty Advanced Edge Routing Showcase

This example demonstrates comprehensive edge routing capabilities in Sprotty, including built-in routers, custom routing algorithms, edge decorations, custom anchors, and intersection handling.

## Features Demonstrated

### Built-in Edge Routers

- **Polyline Router**: Straight-line segments with direct connections
- **Manhattan Router**: Orthogonal routing with right-angle connections
- **Bezier Router**: Smooth curved paths using Bézier splines

### Custom Edge Routers

- **Arc Router**: Parabolic arc routing for flowing connections
- **Step Router**: Stepped connections with mid-point transitions
- Interactive router switching and comparison

### Edge Decorations

- **Arrow Types**: Standard filled, hollow, diamond, and circle arrows
- **Mid-path Markers**: Decorative elements along edge paths
- **Custom Markers**: Domain-specific visual indicators
- **Dynamic Styling**: State-based edge appearance

### Anchor Customization

- **Built-in Anchors**: Rectangle, ellipse, and diamond anchors
- **Custom Anchors**: Hexagon and dynamic anchor computers
- **Port Anchoring**: Precise connection to specific ports
- **Anchor Visualization**: See anchor points in real-time

### Edge Intersection Handling

- **Line Jumps**: Visual jumps where edges cross
- **Line Gaps**: Gaps at intersection points
- **Intersection Detection**: Automatic detection and rendering
- **Toggle Controls**: Switch between jump and gap styles

### Advanced Features

- **Animated Flow**: Data flow visualization along edges
- **Interactive Customization**: Live edge property editing
- **Multiple Edge Types**: Dependency, composition, aggregation styles
- **Performance Optimization**: Efficient rendering for many edges

## Running the Example

1. Build the examples from the repository root:

   ```bash
   npm run build
   ```

2. Open `advanced-edges-showcase.html` in your browser

3. Use the interactive controls to explore different routing strategies

## Learning Objectives

After exploring this example, you should understand:

1. **How to use built-in edge routers**
   - When to choose polyline, Manhattan, or Bezier
   - How to configure routers for different scenarios
   - Router-specific options and behaviors

2. **How to create custom edge routers**
   - Extending AbstractEdgeRouter
   - Implementing route calculation algorithms
   - Registering and using custom routers

3. **How to add edge decorations**
   - Creating arrow heads and markers
   - Positioning decorations along edges
   - Rendering custom visual elements

4. **How to customize anchors**
   - Using built-in anchor computers
   - Creating custom anchor algorithms
   - Implementing port-specific anchoring

5. **How to handle edge intersections**
   - Configuring intersection detection
   - Rendering jumps and gaps
   - Creating custom intersection views

6. **How to style edges dynamically**
   - CSS-based edge styling
   - Conditional rendering based on state
   - Animated edge effects

## Interactive Controls

The showcase provides a comprehensive control panel:

### Router Selection

- Switch between polyline, Manhattan, Bezier, arc, and step routers
- Compare routing strategies side-by-side
- See real-time router changes

### Edge Styling

- Change edge colors and widths
- Modify stroke styles (solid, dashed, dotted)
- Apply edge type presets (dependency, composition, etc.)

### Decorations

- Select arrow head types
- Add mid-path markers
- Toggle decoration visibility

### Anchors

- Choose anchor types for nodes
- Visualize anchor points
- Test port-specific connections

### Intersections

- Enable/disable intersection handling
- Switch between jumps and gaps
- Control jump height and gap width

### Animation

- Toggle flow animation
- Adjust flow speed
- Preview animated effects

## File Structure

```
advanced-edges-showcase/
├── README.md                    # This file
├── advanced-edges-showcase.html # Demo page with controls
├── css/
│   ├── diagram.css             # Diagram styling with edge styles
│   └── page.css                # Page layout and control panel
└── src/
    ├── di.config.ts            # Dependency injection configuration
    ├── standalone.ts           # Main application and control logic
    ├── model.ts                # Type definitions for edges and nodes
    ├── custom-routers.ts       # Custom router implementations
    ├── custom-anchors.ts       # Custom anchor computers
    └── views.tsx               # Custom edge and node views
```

## Code Highlights

### Custom Arc Router

```typescript
export class ArcEdgeRouter extends AbstractEdgeRouter {
    route(edge: SRoutableElementImpl): RoutedPoint[] {
        // Calculate parabolic arc between nodes
        const arcPoints = this.calculateArcPoints(source, target);
        return [sourceAnchor, ...arcPoints, targetAnchor];
    }
}
```

### Arrow Decorations

```typescript
export class ArrowEdgeView extends PolylineEdgeView {
    protected renderArrowHead(route: Point[], edge: SEdgeImpl): VNode {
        // Calculate arrow based on edge direction
        const angle = this.calculateAngle(route);
        return this.renderArrowForAngle(angle, arrowType);
    }
}
```

### Custom Hexagon Anchor

```typescript
export class HexagonAnchor implements IAnchorComputer {
    getAnchor(connectable: SConnectableElementImpl, refPoint: Point): Point {
        // Find closest point on hexagon boundary
        return this.projectOnHexagon(connectable, refPoint);
    }
}
```

### Intersection Handling

```typescript
// Enable intersection detection
bind(IntersectionFinder).toSelf().inSingletonScope();
bind(TYPES.IEdgeRoutePostprocessor).toService(IntersectionFinder);

// Use jumping edge view
configureModelElement(context, 'edge:jumping', SEdgeImpl, JumpingPolylineEdgeView);
```

## Demonstration Scenarios

### Scenario 1: Router Comparison

Compare how different routers handle the same node layout:

- Polyline: Direct straight-line connections
- Manhattan: Clean orthogonal paths
- Bezier: Smooth flowing curves
- Arc: Parabolic connections
- Step: Mid-point stepped paths

### Scenario 2: Edge Types

Explore different edge semantics:

- Dependency edges (dashed lines, hollow arrows)
- Composition edges (solid lines, diamond arrows)
- Aggregation edges (solid lines, hollow diamonds)
- Association edges (solid lines, standard arrows)

### Scenario 3: Port Connections

See precise port-to-port connections:

- Multiple ports per node
- Specific routing to port positions
- Clean connection points

### Scenario 4: Intersection Handling

Observe edge crossings with:

- No handling (simple overlap)
- Jump visualization
- Gap rendering
- Custom intersection styles

### Scenario 5: Animated Flow

Watch data flow visualization:

- Particle animation along edges
- Dashed line flow effect
- Variable flow speeds
- Bi-directional flows

## Performance Considerations

The showcase demonstrates several performance optimization techniques:

- **Viewport culling**: Edges outside the viewport aren't rendered
- **Simplified routes**: Distant zoom levels use fewer points
- **Efficient redraws**: Only changed elements are re-rendered
- **Cached calculations**: Expensive computations are cached

## Browser Compatibility

Tested and working in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires support for:

- SVG 1.1
- CSS animations
- ES6+ JavaScript
- SVG path animations

## Related Documentation

- [Advanced Edge Routing Recipe](https://sprotty.org/docs/recipes/advanced-edge-routing/)
- [Custom Views Recipe](https://sprotty.org/docs/recipes/custom-views/)
- [Animation and Transitions Recipe](https://sprotty.org/docs/recipes/animation-transitions/)
- [Sprotty API Documentation](https://sprotty.org/docs/api/)

## Next Steps

After exploring this showcase:

1. Experiment with the interactive controls
2. Review the source code to understand implementation
3. Try modifying the custom routers
4. Create your own anchor computers
5. Implement custom edge decorations for your domain

## Troubleshooting

**Edges not routing correctly:**

- Check that source and target nodes exist
- Verify router kind is registered
- Ensure anchor computers are configured

**Arrows not appearing:**

- Verify arrow rendering in edge view
- Check CSS marker definitions
- Ensure path calculations are correct

**Intersections not detected:**

- Confirm IntersectionFinder is registered
- Use correct edge view (JumpingPolylineEdgeView)
- Check that edges actually cross

**Performance issues:**

- Reduce number of routing points
- Simplify edge decorations
- Enable viewport culling
- Use CSS animations instead of programmatic

## Contributing

Found a bug or want to add a feature? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This example is part of the Sprotty project and follows the same license terms (Eclipse Public License 2.0).
