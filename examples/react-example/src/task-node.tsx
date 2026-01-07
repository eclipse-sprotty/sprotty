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

import * as React from 'react';
import { useSprottyDispatch } from 'sprotty-react';
import { SelectAction } from 'sprotty-protocol';
import { getZoom, SModelElementImpl } from 'sprotty';
import { AddLinkedNodeAction, RemoveElementAction, TaskNode, TaskStatus, UpdateTaskStatusAction, UpdateTaskContentAction, UpdateTaskAssigneeAction } from './model';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from './theme';

/**
 * Zoom threshold for LOD rendering.
 * Below this zoom level, simplified nodes are rendered for performance.
 */
const LOD_ZOOM_THRESHOLD = 0.2;

/**
 * Hook to track viewport zoom level.
 * Uses requestAnimationFrame to detect zoom changes and trigger re-renders.
 * This is necessary because Sprotty's zoom changes don't automatically
 * trigger React component re-renders (only the root SVG transform changes).
 *
 * @param model - The Sprotty model element to get zoom from
 * @returns The current zoom level
 */
function useZoom(model: SModelElementImpl): number {
    const [zoom, setZoom] = useState(() => getZoom(model));

    useEffect(() => {
        let rafId: number;
        let lastZoom = getZoom(model);

        const checkZoom = () => {
            const currentZoom = getZoom(model);
            if (currentZoom !== lastZoom) {
                lastZoom = currentZoom;
                setZoom(currentZoom);
            }
            rafId = requestAnimationFrame(checkZoom);
        };

        rafId = requestAnimationFrame(checkZoom);
        return () => cancelAnimationFrame(rafId);
    }, [model]);

    return zoom;
}

/**
 * Simplified task node component for LOD rendering.
 * Renders a minimal colored rectangle when zoomed out for better performance.
 */
interface SimplifiedTaskNodeProps {
    model: TaskNode;
}

const SimplifiedTaskNode: React.FC<SimplifiedTaskNodeProps> = React.memo(({ model }) => (
    <div className={`task-node-simple status-${model.status}`} />
));

SimplifiedTaskNode.displayName = 'SimplifiedTaskNode';

/**
 * Type for editable fields.
 */
type EditableField = 'title' | 'description' | null;

/**
 * Props for the TaskNodeComponent.
 */
export interface TaskNodeComponentProps {
    model: TaskNode;
}

/**
 * Status badge labels.
 */
const STATUS_LABELS: Record<TaskStatus, string> = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done'
};

/**
 * Status progression order.
 */
const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done'];

/**
 * Available assignees for the dropdown.
 */
const ASSIGNEES: string[] = ['None', 'Alice', 'Bob', 'Carol', 'David', 'Eve'];

/**
 * Get the next status in the progression.
 */
function getNextStatus(current: TaskStatus): TaskStatus | null {
    const currentIndex = STATUS_ORDER.indexOf(current);
    if (currentIndex < STATUS_ORDER.length - 1) {
        return STATUS_ORDER[currentIndex + 1];
    }
    return null;
}

/**
 * React component for rendering a task node.
 *
 * This component demonstrates:
 * - Accessing model data from Sprotty
 * - Dispatching actions to modify the diagram
 * - Event handling within React nodes
 * - Dynamic styling based on model state
 * - Theme-aware rendering using useTheme hook
 * - Level-of-detail (LOD) rendering based on zoom level
 */
export const TaskNodeComponent: React.FC<TaskNodeComponentProps> = ({ model }) => {
    // === ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS (React rules of hooks) ===

    // LOD: track zoom level reactively to switch between views when zooming
    const zoom = useZoom(model);

    // State hooks
    const [status, setStatus] = useState(model.status);
    const [title, setTitle] = useState(model.title);
    const [description, setDescription] = useState(model.description);
    const [assignee, setAssignee] = useState(model.assignee || 'None');
    const [editingField, setEditingField] = useState<EditableField>(null);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const { theme } = useTheme();

    // Ref hooks
    const titleInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);

    // Context hooks
    const dispatch = useSprottyDispatch();

    // Effect hooks
    // Focus input when entering edit mode
    useEffect(() => {
        if (editingField === 'title' && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        } else if (editingField === 'description' && descriptionInputRef.current) {
            descriptionInputRef.current.focus();
            descriptionInputRef.current.select();
        }
    }, [editingField]);

    // Close assignee dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
                setShowAssigneeDropdown(false);
            }
        };

        if (showAssigneeDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAssigneeDropdown]);

    // === END OF HOOKS - Early returns are safe after this point ===

    // LOD: Render simplified view when zoomed out for performance
    if (zoom < LOD_ZOOM_THRESHOLD) {
        return <SimplifiedTaskNode model={model} />;
    }

    const handleSelect = (event: React.MouseEvent) => {
        event.stopPropagation();
        dispatch.dispatch(SelectAction.create({
            selectedElementsIDs: [model.id],
            deselectedElementsIDs: []
        }));
    };

    const handleAdvance = (event: React.MouseEvent) => {
        event.stopPropagation();
        const nextStatus = getNextStatus(status);
        if (nextStatus) {
            console.log(`Advancing task ${model.id} to ${nextStatus}`);

            // Dispatch custom action to update the model in the model source
            // This action does not trigger a Sprotty re-render
            dispatch.dispatch(UpdateTaskStatusAction.create(model.id, nextStatus));
            // Keep local React state in sync for immediate UI update
            setStatus(nextStatus);
        }
    };

    const handleDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        dispatch.dispatch(RemoveElementAction.create([model.id]));
    };

    const handleAddLinked = (event: React.MouseEvent) => {
        event.stopPropagation();
        dispatch.dispatch(AddLinkedNodeAction.create(model.id));
    };

    const handleDoubleClick = (field: EditableField) => (event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingField(field);
    };

    const handleSave = (field: 'title' | 'description') => {
        // Dispatch action to persist to model (does not trigger re-render)
        dispatch.dispatch(UpdateTaskContentAction.create(
            model.id,
            field === 'title' ? title : undefined,
            field === 'description' ? description : undefined
        ));
        setEditingField(null);
    };

    const handleCancel = (field: 'title' | 'description') => {
        // Revert local state to model values
        if (field === 'title') {
            setTitle(model.title);
        } else {
            setDescription(model.description);
        }
        setEditingField(null);
    };

    const handleKeyDown = (field: 'title' | 'description') => (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && field === 'title') {
            event.preventDefault();
            handleSave(field);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            handleCancel(field);
        }
    };

    const handleBlur = (field: 'title' | 'description') => () => {
        handleSave(field);
    };

    const handleAssigneeClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setShowAssigneeDropdown(!showAssigneeDropdown);
    };

    const handleAssigneeSelect = (newAssignee: string) => (event: React.MouseEvent) => {
        event.stopPropagation();
        setAssignee(newAssignee);
        setShowAssigneeDropdown(false);
        // Dispatch action to persist to model
        dispatch.dispatch(UpdateTaskAssigneeAction.create(model.id, newAssignee));
        console.log(`Assignee updated to: ${newAssignee}`);
    };

    const isSelected = (model as any).selected;
    const canAdvance = status !== 'done';

    return (
        <div
            className={`task-node status-${status} ${isSelected ? 'selected' : ''}`}
            onClick={handleSelect}
            data-theme={theme}
        >
            <div className="task-header">
                {editingField === 'title' ? (
                    <input
                        ref={titleInputRef}
                        type="text"
                        className="task-title-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown('title')}
                        onBlur={handleBlur('title')}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <h3
                        className="task-title"
                        onDoubleClick={handleDoubleClick('title')}
                        title="Double-click to edit"
                    >
                        {title}
                    </h3>
                )}
                <span className={`task-badge ${status}`}>
                    {STATUS_LABELS[status]}
                </span>
            </div>

            {editingField === 'description' ? (
                <textarea
                    ref={descriptionInputRef}
                    className="task-description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown('description')}
                    onBlur={handleBlur('description')}
                    onClick={(e) => e.stopPropagation()}
                    rows={2}
                />
            ) : (
                <p
                    className="task-description"
                    onDoubleClick={handleDoubleClick('description')}
                    title="Double-click to edit"
                >
                    {description || 'Double-click to add description'}
                </p>
            )}

            <button
                className="task-btn task-btn-add"
                onClick={handleAddLinked}
                title="Add linked task"
            >
                +
            </button>

            <div className="task-footer">
                <div className="task-assignee-container" ref={assigneeDropdownRef}>
                    <span
                        className="task-assignee"
                        onClick={handleAssigneeClick}
                        title="Click to change assignee"
                    >
                        {assignee}
                    </span>
                    {showAssigneeDropdown && (
                        <div className="task-assignee-dropdown">
                            {ASSIGNEES.map((a) => (
                                <div
                                    key={a}
                                    className={`task-assignee-option ${a === assignee ? 'selected' : ''}`}
                                    onClick={handleAssigneeSelect(a)}
                                >
                                    {a}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="task-actions">
                    {canAdvance && (
                        <button
                            className="task-btn task-btn-advance"
                            onClick={handleAdvance}
                            title="Advance status"
                        >
                            Next
                        </button>
                    )}
                    <button
                        className="task-btn task-btn-delete"
                        onClick={handleDelete}
                        title="Delete task"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

TaskNodeComponent.displayName = 'TaskNodeComponent';
