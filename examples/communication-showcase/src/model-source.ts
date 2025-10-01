/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable } from 'inversify';
import { LocalModelSource, ActionHandlerRegistry } from 'sprotty';
import { Action } from 'sprotty-protocol';
import {
    CreateNodeAction,
    DeleteNodeAction,
    UpdateNodeAction,
    ConnectNodesAction,
    ClearDebugLogAction,
    ShowDebugNotificationAction
} from './actions';

/**
 * Custom model source that handles debug actions
 * This demonstrates the correct Sprotty pattern for handling custom actions
 */
@injectable()
export class DebugModelSource extends LocalModelSource {

    override initialize(registry: ActionHandlerRegistry): void {
        console.log('🔍 DebugModelSource.initialize called with registry:', registry);
        super.initialize(registry);

        // Register our custom action handlers using KIND constants
        console.log('🔍 Registering action handler for:', CreateNodeAction.KIND);
        registry.register(CreateNodeAction.KIND, this);
        registry.register(DeleteNodeAction.KIND, this);
        registry.register(UpdateNodeAction.KIND, this);
        registry.register(ConnectNodesAction.KIND, this);
        registry.register(ClearDebugLogAction.KIND, this);
        registry.register('exportDebugData', this);
        registry.register('showDebugNotification', this);

        console.log('🔍 DebugModelSource initialized and registered action handlers');
        console.log('🔍 Registry after registration:', registry);
    }

    override handle(action: Action): void {
        console.log('🔍 DebugModelSource.handle called with action:', action);

        switch (action.kind) {
            case CreateNodeAction.KIND:
                this.handleCreateNode(action as CreateNodeAction);
                break;
            case DeleteNodeAction.KIND:
                this.handleDeleteNode(action as DeleteNodeAction);
                break;
            case UpdateNodeAction.KIND:
                this.handleUpdateNode(action as UpdateNodeAction);
                break;
            case ConnectNodesAction.KIND:
                this.handleConnectNodes(action as ConnectNodesAction);
                break;
            case ClearDebugLogAction.KIND:
                this.handleClearDebugLog(action as ClearDebugLogAction);
                break;
            case 'showDebugNotification':
                this.handleShowDebugNotification(action as ShowDebugNotificationAction);
                break;
            default:
                super.handle(action);
        }
    }

    private handleCreateNode(action: CreateNodeAction): void {
        console.log('🔍 Creating new node:', action);

        const nodeId = `${action.nodeType}-${Date.now()}`;
        const newNode = {
            type: 'node:debug',
            id: nodeId,
            position: action.position,
            size: { width: 150, height: 100 },
            nodeType: action.nodeType,
            label: action.label,
            status: 'online',
            createdAt: Date.now()
        };

        // Get current model and add the new node
        const currentModel = this.currentRoot;
        const updatedModel = {
            ...currentModel,
            children: [
                ...(currentModel.children || []),
                newNode
            ]
        };

        console.log('🔍 Updated model with new node:', updatedModel);

        // Update the model
        this.updateModel(updatedModel);
    }

    private handleDeleteNode(action: DeleteNodeAction): void {
        console.log('🔍 Deleting node:', action.nodeId);

        const currentModel = this.currentRoot;
        const updatedModel = {
            ...currentModel,
            children: (currentModel.children || []).filter((child: any) => child.id !== action.nodeId)
        };

        this.updateModel(updatedModel);
    }

    private handleUpdateNode(action: UpdateNodeAction): void {
        console.log('🔍 Updating node:', action);

        const currentModel = this.currentRoot;
        const updatedModel = {
            ...currentModel,
            children: (currentModel.children || []).map((child: any) => {
                if (child.id === action.nodeId) {
                    return {
                        ...child,
                        status: action.properties.status || child.status,
                        label: action.properties.label || child.label,
                        color: action.properties.color || child.color,
                        lastModified: Date.now()
                    };
                }
                return child;
            })
        };

        this.updateModel(updatedModel);
    }

    private handleConnectNodes(action: ConnectNodesAction): void {
        console.log('🔍 Connecting nodes:', action);

        // Check if both nodes exist in the current model
        const currentModel = this.currentRoot;
        const sourceExists = (currentModel.children || []).some((child: any) => child.id === action.sourceId);
        const targetExists = (currentModel.children || []).some((child: any) => child.id === action.targetId);

        console.log('🔍 Source node exists:', sourceExists, 'Target node exists:', targetExists);

        if (!sourceExists || !targetExists) {
            console.warn('🚨 Cannot connect nodes - source or target node not found:', action.sourceId, action.targetId);
            return;
        }

        const edgeId = `edge-${action.sourceId}-${action.targetId}-${Date.now()}`;
        const newEdge = {
            type: 'edge:debug',
            id: edgeId,
            sourceId: action.sourceId,
            targetId: action.targetId,
            edgeType: action.edgeType || 'communication',
            createdAt: Date.now(),
            // Add routing points to ensure edge is visible
            routingPoints: []
        };

        console.log('🔍 Creating new edge:', newEdge);

        const updatedModel = {
            ...currentModel,
            children: [
                ...(currentModel.children || []),
                newEdge
            ]
        };

        console.log('🔍 Updated model with new edge, total children:', updatedModel.children.length);
        this.updateModel(updatedModel);
    }


    private handleClearDebugLog(action: ClearDebugLogAction): void {
        console.log('🧹 Clearing debug log');
        // This would clear the debug log in the UI
    }


    private handleShowDebugNotification(action: ShowDebugNotificationAction): void {
        console.log('🔔 Showing notification:', action.message);
        // This would show a notification in the UI
    }
}
