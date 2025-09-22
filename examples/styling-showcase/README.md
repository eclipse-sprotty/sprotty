# Sprotty Styling Showcase

This example demonstrates the different approaches to styling diagram elements in Sprotty, using a network topology as the subject matter.

## What This Example Demonstrates

### 1. Default Styling

- **Elements:** Server A and Client B (top row)
- **Concept:** All nodes automatically get the `sprotty-node` CSS class
- **CSS:** `.sprotty-node { ... }` applies to all nodes

### 2. Subtype-based Styling

- **Elements:** Database, Router, and Host (second row)
- **Concept:** Nodes with different types get additional CSS classes based on their subtype
- **Types:** `node:server`, `node:router`, `node:database`
- **CSS:** `.sprotty-node.server { ... }`, `.sprotty-node.router { ... }`, etc.

### 3. Custom CSS Classes

- **Elements:** Critical Server (third row, left)
- **Concept:** Individual nodes can specify custom CSS classes via the `cssClasses` property
- **Classes:** `['critical-system', 'high-priority']`
- **CSS:** `.sprotty-node.critical-system { ... }`, `.sprotty-node.high-priority { ... }`

### 4. Conditional Styling

- **Elements:** Load Monitor (third row, right)
- **Concept:** Custom views can apply CSS classes conditionally based on node properties
- **Logic:** Color changes based on `loadPercentage` value
- **CSS:** `.sprotty-node.low-load { ... }`, `.sprotty-node.medium-load { ... }`, `.sprotty-node.high-load { ... }`

### 5. Interactive Styling

- **Elements:** Gateway (bottom)
- **Concept:** CSS classes are applied based on user interactions
- **Features:** Selection (`selected` class) and hover (`mouseover` class)
- **CSS:** `.sprotty-node.selected { ... }`, `.sprotty-node.mouseover { ... }`

## Key Learning Points

1. **CSS Class Hierarchy:** All nodes start with `sprotty-node`, then add specific classes
2. **Subtype Convention:** Node type `node:server` automatically adds `server` CSS class
3. **Granular Control:** Use `cssClasses` property for per-element styling
4. **Dynamic Styling:** Custom views can apply classes based on runtime conditions
5. **User Interaction:** Selection and hover states are handled automatically with appropriate CSS classes

## Running the Example

1. Open `styling-showcase.html` in a web browser
2. Observe the different styling approaches in each section
3. Click "Change Load Percentage" to see conditional styling in action
4. Click and hover on the Gateway node to see interactive styling

## File Structure

- `src/model.ts` - Custom node model for load monitoring
- `src/views.tsx` - Custom view with conditional styling logic
- `src/di.config.ts` - Dependency injection configuration
- `src/standalone.ts` - Main application and model setup
- `css/diagram.css` - All styling examples organized by concept
- `css/page.css` - Page layout and controls
- `styling-showcase.html` - Demo page with explanations

## CSS Organization

The `diagram.css` file is organized into sections that correspond to each styling concept:

1. **Default Styling** - Base classes (`sprotty-node`, `sprotty-edge`, etc.)
2. **Subtype-based Styling** - Type-specific classes (`.server`, `.router`, etc.)
3. **Custom CSS Classes** - Per-element classes (`.critical-system`, etc.)
4. **Conditional Styling** - Dynamic classes (`.low-load`, `.high-load`, etc.)
5. **Interactive Styling** - User interaction classes (`.selected`, `.mouseover`)

This organization makes it easy to understand how each styling approach works and how to implement them in your own diagrams.
