/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable } from 'inversify';
import { SModelElementImpl } from 'sprotty';
import * as React from 'react';

/**
 * Represents a portal entry that tracks a React component to be rendered
 * into a specific DOM node within the Sprotty diagram.
 */
export interface PortalEntry {
    /** Unique identifier for this portal (typically the model element ID) */
    id: string;
    /** The DOM node where the React component will be portaled into */
    domNode: HTMLElement;
    /** The Sprotty model element associated with this portal */
    model: SModelElementImpl;
    /** The React component type to render */
    componentType: React.ComponentType<ReactNodeProps>;
}

/**
 * Props passed to React components rendered as diagram nodes.
 */
export interface ReactNodeProps {
    /** The Sprotty model element */
    model: SModelElementImpl;
}

/**
 * Listener function type for portal registry changes.
 */
export type PortalChangeListener = (entries: Map<string, PortalEntry>) => void;

/**
 * Service that manages the registry of React portals within a Sprotty diagram.
 *
 * This service acts as the bridge between Sprotty's Snabbdom rendering lifecycle
 * and React's component tree. It maintains a collection of PortalEntry objects
 * that describe which React components should be rendered into which DOM nodes.
 *
 * The service uses an observer pattern to notify React components when the
 * registry changes, triggering re-renders that create or destroy React Portals.
 */
@injectable()
export class ReactPortalService {
    /** Map of portal entries keyed by element ID */
    protected readonly portals: Map<string, PortalEntry> = new Map();

    /** Set of listeners to notify on changes */
    protected readonly listeners: Set<PortalChangeListener> = new Set();

    /** Whether a notification is pending in the next animation frame */
    protected pendingNotify = false;

    /** ID of the pending animation frame request */
    protected pendingFrameId: number | null = null;

    /**
     * Register a new portal for a model element.
     * Called by ReactHostView's Snabbdom insert hook.
     *
     * @param id - The unique identifier (typically model element ID)
     * @param domNode - The DOM node to render into
     * @param model - The Sprotty model element
     * @param componentType - The React component to render
     */
    register(
        id: string,
        domNode: HTMLElement,
        model: SModelElementImpl,
        componentType: React.ComponentType<ReactNodeProps>
    ): void {
        this.portals.set(id, { id, domNode, model, componentType });
        this.notifyListeners();
    }

    /**
     * Update an existing portal's model data.
     * Called by ReactHostView's Snabbdom update hook.
     *
     * @param id - The portal identifier
     * @param model - The updated model element
     */
    update(id: string, model: SModelElementImpl): void {
        const entry = this.portals.get(id);
        if (entry) {
            entry.model = model;
            this.notifyListeners();
        }
    }

    /**
     * Unregister a portal, removing it from the registry.
     * Called by ReactHostView's Snabbdom destroy hook.
     *
     * @param id - The portal identifier to remove
     */
    unregister(id: string): void {
        if (this.portals.delete(id)) {
            this.notifyListeners();
        }
    }

    /**
     * Get a specific portal entry by ID.
     *
     * @param id - The portal identifier
     * @returns The portal entry or undefined if not found
     */
    get(id: string): PortalEntry | undefined {
        return this.portals.get(id);
    }

    /**
     * Get all registered portal entries.
     *
     * @returns A new Map containing all portal entries
     */
    getAll(): Map<string, PortalEntry> {
        return new Map(this.portals);
    }

    /**
     * Check if a portal is registered.
     *
     * @param id - The portal identifier
     * @returns true if the portal exists
     */
    has(id: string): boolean {
        return this.portals.has(id);
    }

    /**
     * Get the number of registered portals.
     */
    get size(): number {
        return this.portals.size;
    }

    /**
     * Subscribe to portal registry changes.
     *
     * @param listener - Function to call when the registry changes
     * @returns Unsubscribe function
     */
    subscribe(listener: PortalChangeListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Clear all portals from the registry.
     */
    clear(): void {
        if (this.portals.size > 0) {
            this.portals.clear();
            this.notifyListeners();
        }
    }

    /**
     * Schedule notification for the next animation frame.
     * Multiple calls within a frame are coalesced into one notification.
     */
    protected scheduleNotify(): void {
        if (this.pendingNotify) return;

        this.pendingNotify = true;

        if (typeof requestAnimationFrame !== 'undefined') {
            this.pendingFrameId = requestAnimationFrame(() => {
                this.pendingNotify = false;
                this.pendingFrameId = null;
                this.doNotifyListeners();
            });
        } else {
            // Fallback for non-browser environments
            this.pendingNotify = false;
            this.doNotifyListeners();
        }
    }

    /**
     * Actually notify all listeners of a change.
     */
    protected doNotifyListeners(): void {
        const entries = this.getAll();
        this.listeners.forEach(listener => {
            try {
                listener(entries);
            } catch (e) {
                console.error('Error in portal change listener:', e);
            }
        });
    }

    /**
     * Notify all listeners of a change.
     * Uses requestAnimationFrame to batch multiple changes within a frame.
     */
    protected notifyListeners(): void {
        this.scheduleNotify();
    }
}

