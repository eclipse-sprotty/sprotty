/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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

import { injectable, inject } from 'inversify';
import {
    TYPES,
    IButtonHandler,
    MouseListener,
    KeyListener,
    SModelElementImpl,
    SButtonImpl,
    IActionDispatcher
} from 'sprotty';
import { Action } from 'sprotty-protocol';
import {
    SelectAction,
    SelectAllAction,
    CenterAction,
    FitToScreenAction,
    HoverFeedbackAction
} from 'sprotty-protocol';
import { InteractiveButton } from './model';

interface ContextMenuItem {
    icon?: string;
    label?: string;
    action?: () => void;
    separator?: boolean;
    disabled?: boolean;
}

/**
 * Custom button handler for interactive buttons
 */
@injectable()
export class InteractiveButtonHandler implements IButtonHandler {
    buttonPressed(button: SButtonImpl): Action[] {
        const interactiveButton = button as InteractiveButton;
        const parentId = button.parent?.id || 'unknown';
        const parentNode = button.parent;

        switch (interactiveButton.buttonType) {
            case 'info':
                // Show info: center on element and show selection
                this.showNotification(`ℹ️ Showing details for ${this.getNodeTitle(parentNode)}`);
                return [
                    SelectAction.create({ selectedElementsIDs: [parentId] }),
                    CenterAction.create([parentId], { animate: true })
                ];

            case 'delete':
                // Delete: show confirmation and visual feedback
                const nodeTitle = this.getNodeTitle(parentNode);
                if (confirm(`Are you sure you want to delete "${nodeTitle}"?`)) {
                    this.showNotification(`🗑️ Deleted ${nodeTitle} (demo - not actually deleted)`);
                    // In a real app, you would dispatch an action to remove the element
                    return [
                        SelectAction.create({ selectedElementsIDs: [] }) // Deselect
                    ];
                } else {
                    this.showNotification(`❌ Delete cancelled for ${nodeTitle}`);
                    return [];
                }

            case 'edit':
                // Edit: show edit dialog simulation
                const currentTitle = this.getNodeTitle(parentNode);
                const newTitle = prompt(`Edit name for ${currentTitle}:`, currentTitle);
                if (newTitle && newTitle !== currentTitle) {
                    this.showNotification(`✏️ Renamed "${currentTitle}" to "${newTitle}" (demo - not actually changed)`);
                    // In a real app, you would dispatch an action to update the model
                } else if (newTitle === null) {
                    this.showNotification(`❌ Edit cancelled for ${currentTitle}`);
                }
                return [];

            case 'settings':
                // Settings: show configuration options
                const settingsOptions = ['Option A', 'Option B', 'Option C'];
                const choice = prompt(`Configure ${this.getNodeTitle(parentNode)}:\n${settingsOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEnter option number (1-3):`);
                if (choice && ['1', '2', '3'].includes(choice)) {
                    const selectedOption = settingsOptions[parseInt(choice) - 1];
                    this.showNotification(`⚙️ Applied "${selectedOption}" to ${this.getNodeTitle(parentNode)}`);
                } else if (choice !== null) {
                    this.showNotification(`❌ Invalid option for ${this.getNodeTitle(parentNode)}`);
                }
                return [];

            default:
                return [];
        }
    }

    private getNodeTitle(node: any): string {
        return node?.title || node?.id || 'Unknown Node';
    }

    private showNotification(message: string): void {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

/**
 * Advanced mouse listener with context menus and hover effects
 */
@injectable()
export class AdvancedMouseListener extends MouseListener {

    @inject(TYPES.IActionDispatcher) protected actionDispatcher!: IActionDispatcher;

    override doubleClick(target: SModelElementImpl, event: MouseEvent): Action[] {
        // Double-click to focus and center on element
        if (target.type.startsWith('node:')) {
            return [
                SelectAction.create({ selectedElementsIDs: [target.id] }),
                CenterAction.create([target.id], { animate: true })
            ];
        }
        return [];
    }

    override mouseDown(target: SModelElementImpl, event: MouseEvent): Action[] {
        // Handle right-click context menu
        if (event.button === 2) { // Right click
            event.preventDefault();
            this.showContextMenu(target, event);
            return [];
        }
        return [];
    }

    override mouseEnter(target: SModelElementImpl, event: MouseEvent): Action[] {
        // Show hover feedback
        return [
            HoverFeedbackAction.create({
                mouseoverElement: target.id,
                mouseIsOver: true
            })
        ];
    }

    override mouseLeave(target: SModelElementImpl, event: MouseEvent): Action[] {
        // Hide hover feedback
        return [
            HoverFeedbackAction.create({
                mouseoverElement: target.id,
                mouseIsOver: false
            })
        ];
    }

    private showContextMenu(target: SModelElementImpl, event: MouseEvent): void {
        // Enhanced context menu with proper Sprotty actions
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 4px 0;
            z-index: 10000;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 13px;
            min-width: 120px;
        `;

        const nodeTitle = this.getNodeTitle(target);
        const items = this.getContextMenuItems(target, nodeTitle);

        items.forEach((item: ContextMenuItem, index) => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background: #e0e0e0;
                    margin: 4px 0;
                `;
                menu.appendChild(separator);
                return;
            }

            const menuItem = document.createElement('div');
            menuItem.innerHTML = `<span style="margin-right: 8px;">${item.icon || ''}</span>${item.label || ''}`;
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: background-color 0.15s ease;
                ${item.disabled ? 'color: #999; cursor: not-allowed;' : ''}
            `;

            if (!item.disabled && item.action) {
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = '#f5f5f5';
                });
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.backgroundColor = 'transparent';
                });
                menuItem.addEventListener('click', () => {
                    if (item.action) {
                        item.action();
                    }
                    this.removeContextMenu(menu);
                });
            }

            menu.appendChild(menuItem);
        });

        // Remove menu when clicking elsewhere
        const removeMenu = (e: Event) => {
            if (!menu.contains(e.target as Node)) {
                this.removeContextMenu(menu);
                document.removeEventListener('click', removeMenu);
            }
        };

        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener('click', removeMenu), 0);
    }

    private getContextMenuItems(target: SModelElementImpl, nodeTitle: string): ContextMenuItem[] {
        const items: ContextMenuItem[] = [];

        // Node-specific actions
        if (target.type.startsWith('node:')) {
            items.push(
                {
                    icon: '🎯',
                    label: `Select ${nodeTitle}`,
                    action: () => {
                        this.actionDispatcher.dispatch(SelectAction.create({ selectedElementsIDs: [target.id] }));
                        this.showNotification(`✅ Selected ${nodeTitle}`);
                    }
                },
                {
                    icon: '🎪',
                    label: `Center on ${nodeTitle}`,
                    action: () => {
                        this.actionDispatcher.dispatch(CenterAction.create([target.id], { animate: true }));
                        this.showNotification(`🎯 Centered on ${nodeTitle}`);
                    }
                },
                { separator: true },
                {
                    icon: '📋',
                    label: 'Copy ID',
                    action: () => {
                        navigator.clipboard.writeText(target.id).then(() => {
                            this.showNotification(`📋 Copied ID: ${target.id}`);
                        }).catch(() => {
                            this.showNotification(`❌ Failed to copy ID`);
                        });
                    }
                },
                {
                    icon: '📊',
                    label: 'Show Properties',
                    action: () => {
                        const props = {
                            ID: target.id,
                            Type: target.type,
                            Title: nodeTitle,
                            Position: `(${(target as any).position?.x || 0}, ${(target as any).position?.y || 0})`,
                            Size: `${(target as any).size?.width || 0} × ${(target as any).size?.height || 0}`
                        };
                        const propsText = Object.entries(props)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n');
                        alert(`Properties for ${nodeTitle}:\n\n${propsText}`);
                    }
                },
                { separator: true },
                {
                    icon: '🗑️',
                    label: `Delete ${nodeTitle}`,
                    action: () => {
                        if (confirm(`Are you sure you want to delete "${nodeTitle}"?`)) {
                            this.showNotification(`🗑️ Deleted ${nodeTitle} (demo - not actually deleted)`);
                            // In a real app, dispatch a delete action here
                            this.actionDispatcher.dispatch(SelectAction.create({ selectedElementsIDs: [] }));
                        }
                    }
                }
            );
        } else if (target.type.startsWith('edge')) {
            // Edge-specific actions
            items.push(
                {
                    icon: '🎯',
                    label: 'Select Edge',
                    action: () => {
                        this.actionDispatcher.dispatch(SelectAction.create({ selectedElementsIDs: [target.id] }));
                        this.showNotification(`✅ Selected edge`);
                    }
                },
                {
                    icon: '📋',
                    label: 'Copy Edge ID',
                    action: () => {
                        navigator.clipboard.writeText(target.id).then(() => {
                            this.showNotification(`📋 Copied edge ID: ${target.id}`);
                        }).catch(() => {
                            this.showNotification(`❌ Failed to copy ID`);
                        });
                    }
                }
            );
        } else {
            // Generic actions for other elements
            items.push(
                {
                    icon: '🎯',
                    label: 'Select Element',
                    action: () => {
                        this.actionDispatcher.dispatch(SelectAction.create({ selectedElementsIDs: [target.id] }));
                        this.showNotification(`✅ Selected element`);
                    }
                }
            );
        }

        // Global actions
        items.push(
            { separator: true },
            {
                icon: '🔍',
                label: 'Fit to Screen',
                action: () => {
                    this.actionDispatcher.dispatch(FitToScreenAction.create([], { padding: 30, maxZoom: 1.1 }));
                    this.showNotification(`🔍 Fitted diagram to screen`);
                }
            },
            {
                icon: '🎯',
                label: 'Select All',
                action: () => {
                    this.actionDispatcher.dispatch(SelectAllAction.create());
                    this.showNotification(`🎯 Selected all elements`);
                }
            }
        );

        return items;
    }

    private removeContextMenu(menu: HTMLElement): void {
        if (menu.parentNode) {
            menu.parentNode.removeChild(menu);
        }
    }

    private getNodeTitle(target: SModelElementImpl): string {
        return (target as any)?.title || target.id || 'Element';
    }

    private showNotification(message: string): void {
        // Create a temporary notification (reusing the same logic as button handler)
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

/**
 * Advanced keyboard listener with shortcuts
 */
@injectable()
export class AdvancedKeyListener extends KeyListener {

    override keyDown(element: SModelElementImpl, event: KeyboardEvent): Action[] {
        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.code) {
                case 'KeyA':
                    event.preventDefault();
                    return [SelectAllAction.create()];

                case 'KeyF':
                    event.preventDefault();
                    return [FitToScreenAction.create([])];

                default:
                    return [];
            }
        }

        // Handle other key navigation if needed
        switch (event.code) {
            default:
                return [];
        }

        return [];
    }
}
