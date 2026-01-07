"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactPortalService = void 0;
const inversify_1 = require("inversify");
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
let ReactPortalService = class ReactPortalService {
    constructor() {
        /** Map of portal entries keyed by element ID */
        this.portals = new Map();
        /** Set of listeners to notify on changes */
        this.listeners = new Set();
        /** Whether a notification is pending in the next animation frame */
        this.pendingNotify = false;
        /** ID of the pending animation frame request */
        this.pendingFrameId = null;
    }
    /**
     * Register a new portal for a model element.
     * Called by ReactHostView's Snabbdom insert hook.
     *
     * @param id - The unique identifier (typically model element ID)
     * @param domNode - The DOM node to render into
     * @param model - The Sprotty model element
     * @param componentType - The React component to render
     */
    register(id, domNode, model, componentType) {
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
    update(id, model) {
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
    unregister(id) {
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
    get(id) {
        return this.portals.get(id);
    }
    /**
     * Get all registered portal entries.
     *
     * @returns A new Map containing all portal entries
     */
    getAll() {
        return new Map(this.portals);
    }
    /**
     * Check if a portal is registered.
     *
     * @param id - The portal identifier
     * @returns true if the portal exists
     */
    has(id) {
        return this.portals.has(id);
    }
    /**
     * Get the number of registered portals.
     */
    get size() {
        return this.portals.size;
    }
    /**
     * Subscribe to portal registry changes.
     *
     * @param listener - Function to call when the registry changes
     * @returns Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * Clear all portals from the registry.
     */
    clear() {
        if (this.portals.size > 0) {
            this.portals.clear();
            this.notifyListeners();
        }
    }
    /**
     * Schedule notification for the next animation frame.
     * Multiple calls within a frame are coalesced into one notification.
     */
    scheduleNotify() {
        if (this.pendingNotify)
            return;
        this.pendingNotify = true;
        if (typeof requestAnimationFrame !== 'undefined') {
            this.pendingFrameId = requestAnimationFrame(() => {
                this.pendingNotify = false;
                this.pendingFrameId = null;
                this.doNotifyListeners();
            });
        }
        else {
            // Fallback for non-browser environments
            this.pendingNotify = false;
            this.doNotifyListeners();
        }
    }
    /**
     * Actually notify all listeners of a change.
     */
    doNotifyListeners() {
        const entries = this.getAll();
        this.listeners.forEach(listener => {
            try {
                listener(entries);
            }
            catch (e) {
                console.error('Error in portal change listener:', e);
            }
        });
    }
    /**
     * Notify all listeners of a change.
     * Uses requestAnimationFrame to batch multiple changes within a frame.
     */
    notifyListeners() {
        this.scheduleNotify();
    }
};
exports.ReactPortalService = ReactPortalService;
exports.ReactPortalService = ReactPortalService = __decorate([
    (0, inversify_1.injectable)()
], ReactPortalService);
//# sourceMappingURL=react-portal-service.js.map