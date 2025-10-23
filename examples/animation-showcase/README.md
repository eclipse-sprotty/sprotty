# Sprotty Animation and Transitions Showcase

This example demonstrates comprehensive animation capabilities in Sprotty diagrams, including both CSS-based and programmatic animation techniques.

## Features Demonstrated

### CSS-Based Animations

- **Hover Effects**: Scale and shadow transitions on mouse over
- **Loading Spinners**: Rotating animation using CSS `@keyframes`
- **State Indicators**: Pulsing dots, checkmarks, and error crosses
- **Color Transitions**: Smooth fill color changes on state updates
- **Selection Highlights**: Pulsing glow effect on selection
- **Edge Animations**: Dashed line flow using `stroke-dashoffset`

### Programmatic Animations

- **Bounce Animation**: Natural bouncing motion with easing
- **Pulse Animation**: Scaling in and out with sine wave
- **Shake Animation**: Horizontal vibration with decay
- **Spin Animation**: Full 360° rotation
- **Glow Animation**: Dynamic shadow intensity pulsing
- **State Transitions**: Smooth color interpolation between states
- **Edge Flow**: Animated data flow along connections
- **Composite Animations**: Sequences of multiple effects

### Advanced Features

- **Custom Easing Functions**: Bounce, elastic, back, circular
- **Performance Monitoring**: Real-time FPS tracking
- **Action System Integration**: Triggering animations via actions
- **Command Pattern**: Undoable animation commands
- **Accessibility**: Respects `prefers-reduced-motion` preference

## Running the Example

1. Build the examples from the repository root:

   ```bash
   npm run build
   ```

2. Open `animation-showcase.html` in your browser

3. Use the interactive controls to trigger different animations

## Learning Objectives

After exploring this example, you should understand:

1. **When to use CSS vs Programmatic animations**
   - CSS: Simple effects, hover states, repeating animations
   - Programmatic: Complex timing, coordinated effects, model updates

2. **How to create custom animations**
   - Extend the `Animation` class
   - Implement the `tween(t)` method
   - Apply easing functions for natural motion

3. **How to integrate with Sprotty's command system**
   - Create custom actions for animation triggers
   - Implement command handlers
   - Return animated command results

4. **Performance optimization techniques**
   - Use GPU-accelerated CSS properties
   - Monitor frame rates during animation
   - Optimize tween calculations

5. **CSS animation techniques**
   - Transitions for property changes
   - Keyframe animations for complex effects
   - Combining with model state updates

## File Structure

```
animation-showcase/
├── README.md                    # This file
├── animation-showcase.html      # Demo page with interactive controls
├── css/
│   ├── diagram.css             # Diagram styling with CSS animations
│   └── page.css                # Page layout and control panel styling
└── src/
    ├── di.config.ts            # Dependency injection configuration
    ├── standalone.ts           # Main application and control setup
    ├── model.ts                # Type definitions for animated elements
    ├── animations.ts           # Custom animation implementations
    ├── actions.ts              # Custom action definitions
    ├── handlers.ts             # Command handlers for animations
    └── views.tsx               # Custom views for animated elements
```

## Code Highlights

### Custom Animation Example

```typescript
export class BounceAnimation extends Animation {
    tween(t: number): SModelRootImpl {
        const progress = Easing.easeOutBounce(t);
        const offset = bounceHeight * (1 - progress);
        return this.updatePosition(this.model, offset);
    }
}
```

### CSS Animation Example

```css
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.node-loading {
    animation: pulse 2s ease-in-out infinite;
}
```

### Triggering Animations

```typescript
// Dispatch action to trigger animation
dispatcher.dispatch(TriggerAnimationAction.create('node1', 'bounce'));

// Command handler executes the animation
execute(context: CommandExecutionContext): CommandReturn {
    const animation = new BounceAnimation(context.root, elementId, context);
    return animation.start();
}
```

## Performance Tips

- CSS animations automatically use GPU acceleration
- Programmatic animations should maintain 60 FPS (16ms per frame)
- Use `transform` and `opacity` for best performance
- Monitor performance in console during complex animations
- Respect user's reduced motion preferences

## Related Documentation

- [Animation and Transitions Recipe](https://sprotty.org/docs/recipes/animation-transitions/)
- [Custom Views Recipe](https://sprotty.org/docs/recipes/custom-views/)
- [Actions and Commands](https://sprotty.org/docs/concepts/actions/)

## Browser Compatibility

Tested and working in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires support for:

- CSS transitions and animations
- SVG rendering
- ES6+ JavaScript
