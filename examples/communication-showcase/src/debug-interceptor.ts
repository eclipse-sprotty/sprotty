/*
 * Copyright (C) 2025 TypeFox GmbH.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable } from 'inversify';
import { IActionDispatcher } from 'sprotty';
import { Action } from 'sprotty-protocol';

/**
 * Debug Action Interceptor - Core pattern for monitoring Sprotty actions
 * This demonstrates how to intercept and analyze all actions flowing through the system
 */

export interface ActionLogEntry {
    id: string;
    timestamp: number;
    action: Action;
    duration?: number;
    modelStateBefore?: any;
    modelStateAfter?: any;
    error?: string;
    source: 'user' | 'system';
}

@injectable()
export class DebugActionInterceptor implements IActionDispatcher {

    private actionLog: ActionLogEntry[] = [];
    private actionCounter = 0;

    private baseDispatcher!: IActionDispatcher;

    dispatch(action: Action): Promise<void> {
        console.log('🔍 DebugActionInterceptor.dispatch called with action:', action);


        const logEntry: ActionLogEntry = {
            id: `action_${++this.actionCounter}`,
            timestamp: Date.now(),
            action: { ...action }, // Clone to avoid mutations
            source: this.isSystemAction(action) ? 'system' : 'user'
        };

        // Capture model state before (if available)
        try {
            logEntry.modelStateBefore = this.captureModelState();
        } catch (e) {
            // Model might not be available yet
        }

        const startTime = performance.now();

        // Show debug notification for user actions
        if (logEntry.source === 'user') {
            this.showActionDebugInfo(action);
        }

        // Dispatch the actual action
        console.log('🔍 Calling baseDispatcher.dispatch with:', action);
        const result = this.baseDispatcher.dispatch(action);
        console.log('🔍 baseDispatcher.dispatch returned:', result);

        // Capture timing and model state after
        result.then(() => {
            logEntry.duration = performance.now() - startTime;

            try {
                logEntry.modelStateAfter = this.captureModelState();
            } catch (e) {
                // Model might not be available
            }

            this.actionLog.push(logEntry);
            this.updateDebugUI();

            // Keep only last 100 actions to prevent memory issues
            if (this.actionLog.length > 100) {
                this.actionLog.shift();
            }
        }).catch((error) => {
            logEntry.error = error.message || 'Unknown error';
            logEntry.duration = performance.now() - startTime;
            this.actionLog.push(logEntry);
            this.updateDebugUI();
        });

        return result;
    }

    dispatchAll(actions: Action[]): Promise<void> {
        return this.baseDispatcher.dispatchAll(actions);
    }

    request<Res>(action: any): Promise<Res> {
        return this.baseDispatcher.request(action) as Promise<Res>;
    }

    private isSystemAction(action: Action): boolean {
        // System actions are typically internal Sprotty actions
        return action.kind.startsWith('request') ||
            action.kind.startsWith('computed') ||
            action.kind.startsWith('update') ||
            action.kind.startsWith('set') ||
            action.kind === 'fit' ||
            action.kind === 'center';
    }

    private captureModelState(): any {
        // Try to get current model state from DOM
        const sprottyDiv = document.querySelector('.sprotty-graph');
        if (sprottyDiv) {
            const nodes = Array.from(sprottyDiv.querySelectorAll('.sprotty-node')).length;
            const edges = Array.from(sprottyDiv.querySelectorAll('.sprotty-edge')).length;
            return { nodeCount: nodes, edgeCount: edges };
        }
        return null;
    }

    private showActionDebugInfo(action: Action): void {
        // Create a temporary debug notification
        const notification = document.createElement('div');
        notification.className = 'debug-action-notification';
        notification.innerHTML = `
            <strong>Action Dispatched:</strong> ${action.kind}
            <br><small>${new Date().toLocaleTimeString()}</small>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #007bff;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10001;
            transition: opacity 0.3s ease;
            max-width: 200px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    private updateDebugUI(): void {
        // Update the debug log display
        const debugLog = document.getElementById('debug-action-log');
        if (debugLog) {
            const recentActions = this.actionLog.slice(-10).reverse(); // Show last 10 actions
            debugLog.innerHTML = recentActions.map(entry => `
                <div class="debug-log-entry ${entry.source}" data-action-id="${entry.id}">
                    <div class="debug-log-header">
                        <span class="action-kind">${entry.action.kind}</span>
                        <span class="action-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span class="action-source">${entry.source}</span>
                        ${entry.duration ? `<span class="action-duration">${entry.duration.toFixed(2)}ms</span>` : ''}
                    </div>
                    ${entry.error ? `<div class="debug-log-error">Error: ${entry.error}</div>` : ''}
                    <div class="debug-log-details" style="display: none;">
                        <pre>${JSON.stringify(entry.action, null, 2)}</pre>
                    </div>
                </div>
            `).join('');

            // Add click handlers to expand details
            debugLog.querySelectorAll('.debug-log-entry').forEach(entry => {
                entry.addEventListener('click', () => {
                    const details = entry.querySelector('.debug-log-details') as HTMLElement;
                    details.style.display = details.style.display === 'none' ? 'block' : 'none';
                });
            });
        }

        // Update statistics
        const statsDiv = document.getElementById('debug-stats');
        if (statsDiv) {
            const userActions = this.actionLog.filter(e => e.source === 'user').length;
            const systemActions = this.actionLog.filter(e => e.source === 'system').length;
            const avgDuration = this.actionLog.length > 0
                ? this.actionLog.reduce((sum, e) => sum + (e.duration || 0), 0) / this.actionLog.length
                : 0;

            statsDiv.innerHTML = `
                <div class="stat-item">Total Actions: <strong>${this.actionLog.length}</strong></div>
                <div class="stat-item">User Actions: <strong>${userActions}</strong></div>
                <div class="stat-item">System Actions: <strong>${systemActions}</strong></div>
                <div class="stat-item">Avg Duration: <strong>${avgDuration.toFixed(2)}ms</strong></div>
            `;
        }
    }

    // Public methods for debugging functionality
    getActionLog(): ActionLogEntry[] {
        return [...this.actionLog]; // Return copy
    }



    exportDebugData(format: 'json' | 'csv'): void {
        const data = this.actionLog.map(entry => ({
            id: entry.id,
            timestamp: new Date(entry.timestamp).toISOString(),
            actionKind: entry.action.kind,
            duration: entry.duration,
            source: entry.source,
            error: entry.error,
            modelBefore: entry.modelStateBefore,
            modelAfter: entry.modelStateAfter
        }));

        let content: string;
        let mimeType: string;
        let filename: string;

        if (format === 'json') {
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            filename = `sprotty-debug-${Date.now()}.json`;
        } else {
            // CSV format
            const headers = ['ID', 'Timestamp', 'Action', 'Duration (ms)', 'Source', 'Error'];
            const rows = data.map(d => [
                d.id,
                d.timestamp,
                d.actionKind,
                d.duration?.toString() || '',
                d.source,
                d.error || ''
            ]);
            content = [headers, ...rows].map(row => row.join(',')).join('\n');
            mimeType = 'text/csv';
            filename = `sprotty-debug-${Date.now()}.csv`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Clear the action log and update the UI
     */
    clearLog(): void {
        console.log('🧹 Clearing action log...');
        this.actionLog = [];
        this.actionCounter = 0;
        this.updateLogUI();
        this.updateStatsUI();
    }

    /**
     * Update the log UI to show empty state
     */
    private updateLogUI(): void {
        const logContainer = document.getElementById('debug-action-log');
        if (logContainer) {
            logContainer.innerHTML = '<div class="log-empty">No actions logged yet. Start interacting with the diagram!</div>';
        }
    }

    /**
     * Update the statistics UI to show zero stats
     */
    private updateStatsUI(): void {
        const statsContainer = document.getElementById('debug-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">Total Actions: <strong>0</strong></div>
                <div class="stat-item">User Actions: <strong>0</strong></div>
                <div class="stat-item">System Actions: <strong>0</strong></div>
                <div class="stat-item">Avg Duration: <strong>0ms</strong></div>
            `;
        }
    }
}
