/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { SNodeImpl, SEdgeImpl } from 'sprotty';

/**
 * Model interfaces for the Diagram Action Debugging/Monitoring Tool
 * This demonstrates how to define Sprotty model elements for debugging applications
 */

export interface DebugNode extends SNodeImpl {
    nodeType: 'client' | 'server' | 'database';
    label: string;
    status: 'online' | 'offline' | 'error' | 'processing';
    createdAt: number;
    lastModified?: number;
    color?: string;
}

export interface DebugEdge extends SEdgeImpl {
    edgeType: 'communication' | 'dependency';
    createdAt: number;
    lastActivity?: number;
}