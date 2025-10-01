/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable } from 'inversify';
import {
    IActionHandler,
    ICommand,
    CommandExecutionContext,
    SModelRootImpl,
    CommandReturn,
} from 'sprotty';
import {
    CreateNodeAction,
    DeleteNodeAction,
    UpdateNodeAction,
    ConnectNodesAction,
    ClearDebugLogAction,
    ExportDebugDataAction,
    ShowDebugNotificationAction
} from './actions';
import { DebugNode } from './model';
import { DebugActionInterceptor } from './debug-interceptor';

/**
 * Action handlers for the Diagram Action Debugging/Monitoring Tool
 * This demonstrates how to implement proper Sprotty action handlers and commands
 */

@injectable()
export class DebugActionHandler implements IActionHandler {

    // Remove the circular dependency - we don't need to inject the dispatcher here

    handle(action: any): ICommand | void {
        console.log('🔍 DebugActionHandler.handle called with action:', action);

        switch (action.kind) {
            case 'createNode':
                console.log('🔍 Creating CreateNodeCommand');
                return new CreateNodeCommand(action as CreateNodeAction);
            case 'deleteNode':
                return new DeleteNodeCommand(action as DeleteNodeAction);
            case 'updateNode':
                return new UpdateNodeCommand(action as UpdateNodeAction);
            case 'connectNodes':
                return new ConnectNodesCommand(action as ConnectNodesAction);
            case 'clearDebugLog':
                return new ClearDebugLogCommand(action as ClearDebugLogAction);
            case 'exportDebugData':
                return new ExportDebugDataCommand(action as ExportDebugDataAction);
            case 'showDebugNotification':
                return new ShowDebugNotificationCommand(action as ShowDebugNotificationAction);
        }
    }
}

/**
 * Command to create a new node - demonstrates model manipulation
 */
export class CreateNodeCommand implements ICommand {
    constructor(private action: CreateNodeAction) { }

    execute(context: CommandExecutionContext): CommandReturn {
        // Generate unique ID
        const nodeId = `${this.action.nodeType}-${Date.now()}`;

        // DEBUG: Log the action and context
        console.log('🔍 CreateNodeCommand.execute called with:', {
            action: this.action,
            contextRoot: context.root,
            contextRootChildren: context.root.children
        });

        // Create new node data
        const newNode = {
            type: 'node:debug',
            id: nodeId,
            position: this.action.position,
            size: { width: 150, height: 100 },
            nodeType: this.action.nodeType,
            label: this.action.label,
            status: 'online',
            createdAt: Date.now()
        };

        console.log('🔍 Created new node:', newNode);

        // Create updated model with new node - include required Sprotty graph properties
        const updatedModel = {
            type: 'graph',
            id: 'debug-tool-demo',
            children: [
                ...Array.from(context.root.children),
                newNode
            ],
            // Required Sprotty graph properties
            scroll: { x: 0, y: 0 },
            zoom: 1,
            canvasBounds: { x: 0, y: 0, width: 800, height: 600 }
        };

        console.log('🔍 Updated model:', updatedModel);
        console.log('🔍 Updated model children:', updatedModel.children);

        return { model: updatedModel as any, modelChanged: true, cause: this.action };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const root = context.root as SModelRootImpl;
        const nodeId = `${this.action.nodeType}-${Date.now()}`;

        const updatedChildren = root.children.filter(child => child.id !== nodeId);
        const updatedRoot = Object.assign({}, root, { children: updatedChildren });

        return { model: updatedRoot, modelChanged: true };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to delete a node - demonstrates model cleanup
 */
export class DeleteNodeCommand implements ICommand {
    private deletedNode?: any;
    private deletedEdges: any[] = [];

    constructor(private action: DeleteNodeAction) { }

    execute(context: CommandExecutionContext): CommandReturn {
        const root = context.root as SModelRootImpl;

        // Find and store the node being deleted
        this.deletedNode = root.children.find(child => child.id === this.action.nodeId);

        // Find and store edges connected to this node
        this.deletedEdges = root.children.filter(child =>
            child.type === 'edge:debug' &&
            ((child as any).sourceId === this.action.nodeId || (child as any).targetId === this.action.nodeId)
        );

        // Remove node and connected edges
        const updatedChildren = root.children.filter(child =>
            child.id !== this.action.nodeId &&
            !this.deletedEdges.some(edge => edge.id === child.id)
        );
        const updatedRoot = Object.assign({}, root, { children: updatedChildren });

        return { model: updatedRoot, modelChanged: true, cause: this.action };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const root = context.root as SModelRootImpl;

        // Restore deleted node and edges
        const restoredElements = [];
        if (this.deletedNode) restoredElements.push(this.deletedNode);
        restoredElements.push(...this.deletedEdges);

        const updatedChildren = [...root.children, ...restoredElements];
        const updatedRoot = Object.assign({}, root, { children: updatedChildren });

        return { model: updatedRoot, modelChanged: true };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to update node properties - demonstrates partial model updates
 */
export class UpdateNodeCommand implements ICommand {
    private originalProperties?: any;

    constructor(private action: UpdateNodeAction) { }

    execute(context: CommandExecutionContext): CommandReturn {
        const root = context.root as SModelRootImpl;

        const updatedChildren = root.children.map(child => {
            if (child.id === this.action.nodeId && child.type === 'node:debug') {
                const node = child as DebugNode;

                // Store original properties for undo
                this.originalProperties = {
                    label: node.label,
                    status: node.status,
                    color: (node as any).color
                };

                return {
                    ...node,
                    ...this.action.properties,
                    lastModified: Date.now()
                };
            }
            return child;
        });

        const updatedRoot = Object.assign({}, root, { children: updatedChildren });
        return { model: updatedRoot, modelChanged: true, cause: this.action };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (!this.originalProperties) {
            return { model: context.root as SModelRootImpl, modelChanged: false };
        }

        const root = context.root as SModelRootImpl;
        const updatedChildren = root.children.map(child => {
            if (child.id === this.action.nodeId && child.type === 'node:debug') {
                return { ...child, ...this.originalProperties };
            }
            return child;
        });

        const updatedRoot = Object.assign({}, root, { children: updatedChildren });
        return { model: updatedRoot, modelChanged: true };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to connect nodes with an edge - demonstrates relationship creation
 */
export class ConnectNodesCommand implements ICommand {
    constructor(private action: ConnectNodesAction) { }

    execute(context: CommandExecutionContext): CommandReturn {
        const root = context.root as SModelRootImpl;

        // Check if nodes exist
        const sourceExists = root.children.some(child => child.id === this.action.sourceId);
        const targetExists = root.children.some(child => child.id === this.action.targetId);

        if (!sourceExists || !targetExists) {
            return { model: root, modelChanged: false, cause: this.action };
        }

        // Create new edge
        const edgeId = `edge-${this.action.sourceId}-${this.action.targetId}-${Date.now()}`;
        const newEdge = {
            type: 'edge:debug',
            id: edgeId,
            sourceId: this.action.sourceId,
            targetId: this.action.targetId,
            edgeType: this.action.edgeType,
            createdAt: Date.now(),
            children: [{
                type: 'label',
                id: `${edgeId}-label`,
                text: this.action.edgeType
            }]
        };

        const updatedChildren = [...root.children, newEdge as any];
        const updatedRoot = Object.assign({}, root, { children: updatedChildren });

        return { model: updatedRoot, modelChanged: true, cause: this.action };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const root = context.root as SModelRootImpl;
        const edgeId = `edge-${this.action.sourceId}-${this.action.targetId}`;

        const updatedChildren = root.children.filter(child => !child.id.startsWith(edgeId));
        const updatedRoot = Object.assign({}, root, { children: updatedChildren });

        return { model: updatedRoot, modelChanged: true };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}


/**
 * Command to clear debug log - demonstrates utility commands
 */
export class ClearDebugLogCommand implements ICommand {
    constructor(private action: ClearDebugLogAction) { }

    execute(context: CommandExecutionContext): CommandReturn {
        // Get the debug interceptor and clear its log
        const debugInterceptor = (context as any).actionDispatcher as DebugActionInterceptor;
        if (debugInterceptor && typeof debugInterceptor.clearLog === 'function') {
            debugInterceptor.clearLog();
        }

        return { model: context.root as SModelRootImpl, modelChanged: false, cause: this.action };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root as SModelRootImpl, modelChanged: false };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to export debug data - demonstrates data export patterns
 */
export class ExportDebugDataCommand implements ICommand {
    constructor(private action: ExportDebugDataAction) { }

    execute(context: CommandExecutionContext): CommandReturn {
        // Get the debug interceptor and export its data
        const debugInterceptor = (context as any).actionDispatcher as DebugActionInterceptor;
        if (debugInterceptor && typeof debugInterceptor.exportDebugData === 'function') {
            debugInterceptor.exportDebugData(this.action.format);
        }

        return { model: context.root as SModelRootImpl, modelChanged: false, cause: this.action };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root as SModelRootImpl, modelChanged: false };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Command to show debug notifications - demonstrates UI feedback patterns
 */
export class ShowDebugNotificationCommand implements ICommand {
    constructor(private action: ShowDebugNotificationAction) { }

    execute(context: CommandExecutionContext): CommandReturn {
        this.showToast(this.action.message, this.action.type, this.action.duration);
        return { model: context.root as SModelRootImpl, modelChanged: false, cause: this.action };
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return { model: context.root as SModelRootImpl, modelChanged: false };
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }

    private showToast(message: string, type: ShowDebugNotificationAction['type'], duration: number = 3000): void {
        const toast = document.createElement('div');
        toast.className = `debug-toast debug-toast-${type}`;
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            background-color: ${this.getBackgroundColor(type)};
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    private getBackgroundColor(type: ShowDebugNotificationAction['type']): string {
        switch (type) {
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            case 'success': return '#28a745';
            case 'info':
            default: return '#17a2b8';
        }
    }
}