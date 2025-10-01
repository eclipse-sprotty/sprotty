/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { Action } from 'sprotty-protocol';

/**
 * Actions for the Diagram Action Debugging/Monitoring Tool
 * This demonstrates Sprotty's action-based communication patterns through debugging
 */

// Action for creating nodes (to have something to debug)
export interface CreateNodeAction extends Action {
    kind: typeof CreateNodeAction.KIND;
    nodeType: 'client' | 'server' | 'database';
    position: { x: number, y: number };
    label: string;
}

export namespace CreateNodeAction {
    export const KIND = 'createNode';

    export function create(options: {
        nodeType: 'client' | 'server' | 'database';
        position: { x: number, y: number };
        label: string;
    }): CreateNodeAction {
        return {
            kind: KIND,
            nodeType: options.nodeType,
            position: options.position,
            label: options.label
        };
    }
}

// Action for deleting nodes
export interface DeleteNodeAction extends Action {
    kind: typeof DeleteNodeAction.KIND;
    nodeId: string;
}

export namespace DeleteNodeAction {
    export const KIND = 'deleteNode';

    export function create(nodeId: string): DeleteNodeAction {
        return {
            kind: KIND,
            nodeId
        };
    }
}

// Action for updating node properties
export interface UpdateNodeAction extends Action {
    kind: typeof UpdateNodeAction.KIND;
    nodeId: string;
    properties: {
        label?: string;
        status?: 'online' | 'offline' | 'error' | 'processing';
        color?: string;
    };
}

export namespace UpdateNodeAction {
    export const KIND = 'updateNode';

    export function create(nodeId: string, properties: {
        label?: string;
        status?: 'online' | 'offline' | 'error' | 'processing';
        color?: string;
    }): UpdateNodeAction {
        return {
            kind: KIND,
            nodeId,
            properties
        };
    }
}

// Action for connecting nodes with edges
export interface ConnectNodesAction extends Action {
    kind: typeof ConnectNodesAction.KIND;
    sourceId: string;
    targetId: string;
    edgeType: 'communication' | 'dependency';
}

export namespace ConnectNodesAction {
    export const KIND = 'connectNodes';

    export function create(sourceId: string, targetId: string, edgeType: 'communication' | 'dependency' = 'communication'): ConnectNodesAction {
        return {
            kind: KIND,
            sourceId,
            targetId,
            edgeType
        };
    }
}


// Debugging-specific actions

export interface ClearDebugLogAction extends Action {
    kind: typeof ClearDebugLogAction.KIND;
}

export namespace ClearDebugLogAction {
    export const KIND = 'clearDebugLog';

    export function create(): ClearDebugLogAction {
        return {
            kind: KIND
        };
    }
}

export interface ExportDebugDataAction extends Action {
    kind: 'exportDebugData';
    format: 'json' | 'csv';
}

// Action for showing debug notifications
export interface ShowDebugNotificationAction extends Action {
    kind: 'showDebugNotification';
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    actionData?: any;
    duration?: number;
}