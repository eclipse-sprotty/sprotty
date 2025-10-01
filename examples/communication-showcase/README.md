# Communication Patterns Demo

This example demonstrates Sprotty's powerful action-based communication system through an interactive diagram showing client-server communication patterns.

## What This Example Demonstrates

### Core Communication Concepts

- **Custom Actions**: Creating domain-specific actions for your application
- **Action Handlers**: Processing actions with custom commands that modify the model
- **Action Lifecycle**: Understanding how actions flow through the system
- **Error Handling**: Graceful handling of failures and network issues
- **Real-time Updates**: Updating the diagram based on action results

### Communication Patterns

1. **Request-Response Pattern**: Traditional client-server communication
2. **WebSocket Real-time**: Bidirectional real-time communication
3. **Notification Pattern**: One-way event notifications
4. **Batch Operations**: Handling multiple related actions

### Advanced Features

- **Network Simulation**: Simulate various network conditions (slow, errors, timeouts)
- **Action Logging**: Track all actions with detailed metadata
- **Data Export**: Export action logs in multiple formats
- **Visual Feedback**: Toast notifications and status indicators
- **Model Synchronization**: Keep the diagram in sync with action results

## Key Files

- `src/actions.ts` - Custom action definitions
- `src/handlers.ts` - Action handlers and command implementations
- `src/model.ts` - Domain model interfaces
- `src/views.tsx` - Custom views for communication elements
- `src/di.config.ts` - Dependency injection configuration
- `src/standalone.ts` - Main application setup and demo scenarios

## Learning Objectives

After exploring this example, you should understand:

1. How to design and implement custom actions for your domain
2. How to create action handlers that process actions and update the model
3. How to handle errors gracefully and provide user feedback
4. How to implement real-time communication patterns
5. How to log and debug action flows in your application
6. How to export and analyze action data for monitoring

## Interactive Features

### Message Controls

- **Send Request**: Simulates a client request to the server
- **Send Response**: Simulates a server response to the client
- **Send Notification**: Simulates a server notification to the client

### Network Simulation

- **Normal Network**: Restore normal network conditions
- **Slow Network**: Simulate slow network with delays
- **Network Errors**: Simulate random network failures
- **Timeouts**: Simulate network timeout conditions

### WebSocket Demo

- **Start WebSocket**: Connect to a WebSocket server for real-time communication
- **Stop WebSocket**: Disconnect from the WebSocket server

### Action Logging

- **Clear Log**: Clear the action log display
- **Export JSON/CSV/TXT**: Export action logs in different formats

## Technical Implementation

### Custom Action Example

```typescript
export interface SendMessageAction extends Action {
    kind: 'sendMessage';
    from: string;
    to: string;
    messageType: 'request' | 'response' | 'notification';
    payload: any;
}
```

### Action Handler Example

```typescript
export class SendMessageCommand implements ICommand {
    execute(context: CommandExecutionContext): void {
        // Log the action
        context.actionDispatcher.dispatch({
            kind: 'logAction',
            actionKind: 'sendMessage',
            source: this.action.from,
            target: this.action.to,
            status: 'pending'
        });

        // Update model and provide feedback
        // ... implementation details
    }
}
```

### Model Updates

The example shows how actions can trigger model updates that are reflected in the diagram:

- Node status changes (online, offline, error)
- Action counters increment
- Edge message counts update
- Visual feedback through animations

## Best Practices Demonstrated

1. **Separation of Concerns**: Actions, handlers, and views are clearly separated
2. **Error Handling**: Comprehensive error handling with user feedback
3. **Logging**: Detailed action logging for debugging and monitoring
4. **User Experience**: Visual feedback and status indicators
5. **Extensibility**: Easy to add new action types and handlers

## Running the Example

1. Build the examples: `npm run build` in the examples directory
2. Open `communication-demo.html` in your browser
3. Interact with the controls to see actions in action!

## Related Documentation

- [Communication Patterns Recipe](../../sprotty-website/hugo/content/docs/recipes/communication-patterns.md)
- [Sprotty Actions Documentation](https://github.com/eclipse-sprotty/sprotty/blob/master/packages/sprotty-protocol/src/actions.ts)
