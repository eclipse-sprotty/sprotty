# Animation and Transitions Showcase

This example demonstrates Sprotty's comprehensive animation system, showing how to create smooth visual transitions and interactive effects in diagrams.

## What This Example Demonstrates

### 1. Triggered Animations

- **Bounce Animation**: Click any node to see a bouncing effect
- **Pulse Animation**: Right-click nodes for a pulsing scale effect
- **Shake Animation**: Double-click nodes for a shake effect
- **Glow Animation**: Hover over nodes for a glowing outline

### 2. State Transition Animations

- **Status Changes**: Watch nodes smoothly transition between different states (idle → processing → complete)
- **Color Transitions**: See gradual color changes as node states evolve
- **Size Transitions**: Observe smooth size changes during state transitions

### 3. Compound Animations

- **Complex Transitions**: Some interactions trigger multiple simultaneous animations
- **Coordinated Effects**: Multiple elements animate together in choreographed sequences
- **Layered Animations**: CSS and Sprotty animations work together

### 4. Custom Easing Functions

- **Bounce Easing**: Natural bouncing motion with physics-like behavior
- **Elastic Easing**: Spring-like motion with overshoot and settle
- **Custom Curves**: Demonstration of different timing functions

### 5. Performance Controls

- **Animation Toggle**: Enable/disable animations for performance testing
- **Duration Control**: Adjust animation speeds in real-time
- **Performance Monitor**: View frame rate and animation metrics

## Key Learning Points

1. **Animation Architecture**: How Sprotty's animation system integrates with the command pattern
2. **Custom Animation Classes**: Creating your own animation types by extending the base Animation class
3. **Easing Functions**: Using and creating custom timing functions for natural motion
4. **Performance Optimization**: Best practices for smooth animations in complex diagrams
5. **CSS Integration**: Combining Sprotty animations with CSS animations for enhanced effects

## Interactive Features

- **Click**: Trigger bounce animations on nodes
- **Right-click**: Activate pulse animations
- **Double-click**: Start shake animations
- **Hover**: See glow effects and smooth transitions
- **Control Panel**: Adjust animation settings and monitor performance

## Technical Highlights

- Custom animation classes extending Sprotty's Animation base class
- Integration of multiple animation types in compound animations
- Performance monitoring and optimization techniques
- Accessibility considerations with reduced motion support
- Real-time animation parameter adjustment

This showcase provides a comprehensive reference for implementing animations in your own Sprotty applications, from simple hover effects to complex multi-stage transitions.
