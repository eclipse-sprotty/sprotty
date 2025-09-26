# Sprotty Advanced Interactions Showcase

This example demonstrates advanced interaction patterns in Sprotty diagrams, including:

- **Button Handlers**: Custom buttons with interactive actions
- **Mouse & Keyboard Listeners**: Context menus, hover effects, keyboard shortcuts
- **Drag & Drop**: Constrained movement and external palette drops
- **Selection Management**: Multi-selection with modifier keys
- **Focus Management**: Centering and highlighting elements
- **Projection Bars**: Minimap-style navigation for large diagrams

## Features Demonstrated

### Button Interactions

- Info buttons that show tooltips
- Delete buttons with confirmation
- Edit buttons for inline editing
- Different button styles and states

### Mouse Interactions

- Right-click context menus
- Hover feedback and tooltips
- Double-click to focus elements
- Drag constraints (grid snapping)

### Keyboard Shortcuts

- `Ctrl/Cmd + A`: Select all elements
- `Ctrl/Cmd + F`: Fit to screen
- `Delete/Backspace`: Delete selected elements
- `Enter/Space`: Focus element under cursor
- Arrow keys: Navigate between elements

### Selection Patterns

- Single click: Select element
- `Ctrl/Cmd + Click`: Toggle selection
- `Shift + Click`: Extend selection
- Visual feedback for selected elements

### Focus Management

- Double-click to center on element
- Keyboard navigation with focus indicators
- Animated transitions to focused elements

### Projection Bars

- Horizontal projection bar (bottom)
- Vertical projection bar (right)
- Element projections with custom styling
- Click projections to navigate

## Running the Example

1. Build the examples: `npm run build`
2. Open `advanced-interactions-showcase.html` in your browser
3. Interact with the diagram to explore all features

## Learning Objectives

After exploring this example, you should understand:

1. How to implement custom button handlers
2. How to create advanced mouse and keyboard listeners
3. How to handle drag and drop operations
4. How to implement sophisticated selection patterns
5. How to manage focus and navigation
6. How to set up projection bars for large diagrams

## Related Documentation

- [Advanced Interactions Recipe](https://sprotty.org/docs/recipes/advanced-interactions/)
- [User Interaction Reference](https://sprotty.org/docs/ref/user-interaction/)
- [Extension Points](https://sprotty.org/docs/concepts/extension-points/)
