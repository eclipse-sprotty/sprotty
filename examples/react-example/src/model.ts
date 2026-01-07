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

import { injectable, inject } from 'inversify';
import { SReactNode } from 'sprotty-react';
import { Action } from 'sprotty-protocol';
import { Command, CommandExecutionContext, CommandReturn, TYPES } from 'sprotty';


/**
 * Task status type.
 */
export type TaskStatus = 'todo' | 'in-progress' | 'done';

/**
 * Action to update a task's status without triggering Sprotty re-render.
 */
export interface UpdateTaskStatusAction extends Action {
    kind: typeof UpdateTaskStatusAction.KIND;
    taskId: string;
    newStatus: TaskStatus;
}

export namespace UpdateTaskStatusAction {
    export const KIND = 'updateTaskStatus';

    export function create(taskId: string, newStatus: TaskStatus): UpdateTaskStatusAction {
        return { kind: KIND, taskId, newStatus };
    }
}

/**
 * Command to update a task's status in the internal model.
 * This ensures state persistence when nodes are unmounted and remounted.
 */
@injectable()
export class UpdateTaskStatusCommand extends Command {
    static readonly KIND = UpdateTaskStatusAction.KIND;

    protected previousStatus: TaskStatus | undefined;

    constructor(@inject(TYPES.Action) protected readonly action: UpdateTaskStatusAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.taskId);
        if (element && element instanceof TaskNode) {
            this.previousStatus = element.status;
            element.status = this.action.newStatus;
            console.log(`Task "${element.title}" status updated to: ${this.action.newStatus}`);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.previousStatus !== undefined) {
            const element = context.root.index.getById(this.action.taskId);
            if (element && element instanceof TaskNode) {
                element.status = this.previousStatus;
            }
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Action to update a task's content (title/description) without triggering Sprotty re-render.
 */
export interface UpdateTaskContentAction extends Action {
    kind: typeof UpdateTaskContentAction.KIND;
    taskId: string;
    title?: string;
    description?: string;
}

export namespace UpdateTaskContentAction {
    export const KIND = 'updateTaskContent';

    export function create(taskId: string, title?: string, description?: string): UpdateTaskContentAction {
        return { kind: KIND, taskId, title, description };
    }
}

/**
 * Command to update a task's content in the internal model.
 * This ensures state persistence when nodes are unmounted and remounted.
 */
@injectable()
export class UpdateTaskContentCommand extends Command {
    static readonly KIND = UpdateTaskContentAction.KIND;

    protected previousTitle: string | undefined;
    protected previousDescription: string | undefined;

    constructor(@inject(TYPES.Action) protected readonly action: UpdateTaskContentAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.taskId);
        if (element && element instanceof TaskNode) {
            this.previousTitle = element.title;
            this.previousDescription = element.description;
            if (this.action.title !== undefined) {
                element.title = this.action.title;
            }
            if (this.action.description !== undefined) {
                element.description = this.action.description;
            }
            console.log(`Task "${element.title}" content updated`);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.taskId);
        if (element && element instanceof TaskNode) {
            if (this.previousTitle !== undefined) {
                element.title = this.previousTitle;
            }
            if (this.previousDescription !== undefined) {
                element.description = this.previousDescription;
            }
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Action to update a task's assignee without triggering Sprotty re-render.
 */
export interface UpdateTaskAssigneeAction extends Action {
    kind: typeof UpdateTaskAssigneeAction.KIND;
    taskId: string;
    assignee: string;
}

export namespace UpdateTaskAssigneeAction {
    export const KIND = 'updateTaskAssignee';

    export function create(taskId: string, assignee: string): UpdateTaskAssigneeAction {
        return { kind: KIND, taskId, assignee };
    }
}

/**
 * Command to update a task's assignee in the internal model.
 * This ensures state persistence when nodes are unmounted and remounted.
 */
@injectable()
export class UpdateTaskAssigneeCommand extends Command {
    static readonly KIND = UpdateTaskAssigneeAction.KIND;

    protected previousAssignee: string | undefined;

    constructor(@inject(TYPES.Action) protected readonly action: UpdateTaskAssigneeAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const element = context.root.index.getById(this.action.taskId);
        if (element && element instanceof TaskNode) {
            this.previousAssignee = element.assignee;
            element.assignee = this.action.assignee;
            console.log(`Task "${element.title}" assignee updated to: ${this.action.assignee}`);
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.previousAssignee !== undefined) {
            const element = context.root.index.getById(this.action.taskId);
            if (element && element instanceof TaskNode) {
                element.assignee = this.previousAssignee;
            }
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return this.execute(context);
    }
}

/**
 * Action to remove elements from the diagram.
 * This action updates the LocalModelSource and triggers a re-render.
 */
export interface RemoveElementAction extends Action {
    kind: typeof RemoveElementAction.KIND;
    elementIds: string[];
}

export namespace RemoveElementAction {
    export const KIND = 'removeElement';

    export function create(elementIds: string[]): RemoveElementAction {
        return { kind: KIND, elementIds };
    }
}

/**
 * Action to add a new linked node with an edge from the source node.
 * This action updates the LocalModelSource and triggers a re-render.
 */
export interface AddLinkedNodeAction extends Action {
    kind: typeof AddLinkedNodeAction.KIND;
    sourceNodeId: string;
}

export namespace AddLinkedNodeAction {
    export const KIND = 'addLinkedNode';

    export function create(sourceNodeId: string): AddLinkedNodeAction {
        return { kind: KIND, sourceNodeId };
    }
}

/**
 * Task node model with additional business data.
 */
export class TaskNode extends SReactNode {
    title: string = '';
    description: string = '';
    status: TaskStatus = 'todo';
    assignee: string = '';
}

const niceModel = {
    type: 'graph',
    id: 'root',
    children: [
        {
            type: 'node:task',
            id: 'task1',
            size: { width: 220, height: 140 },
            title: 'Design System',
            description: 'Create component library with design tokens',
            status: 'done',
            assignee: 'Alice'
        },
        {
            type: 'node:task',
            id: 'task2',
            size: { width: 220, height: 140 },
            title: 'API Integration',
            description: 'Connect frontend with backend services',
            status: 'in-progress',
            assignee: 'Bob'
        },
        {
            type: 'node:task',
            id: 'task3',
            size: { width: 220, height: 140 },
            title: 'Testing',
            description: 'Write unit and integration tests',
            status: 'todo',
            assignee: 'Carol'
        },
        {
            type: 'node:task',
            id: 'task4',
            size: { width: 220, height: 140 },
            title: 'Documentation',
            description: 'Update API docs and user guides',
            status: 'in-progress',
            assignee: 'David'
        },
        {
            type: 'node:task',
            id: 'task5',
            size: { width: 220, height: 140 },
            title: 'Deployment',
            description: 'Set up CI/CD pipeline',
            status: 'todo',
            assignee: 'Eve'
        },
        {
            type: 'edge:dependency',
            id: 'edge1',
            sourceId: 'task1',
            targetId: 'task2'
        },
        {
            type: 'edge:dependency',
            id: 'edge2',
            sourceId: 'task2',
            targetId: 'task3'
        },
        {
            type: 'edge:dependency',
            id: 'edge3',
            sourceId: 'task2',
            targetId: 'task4'
        },
        {
            type: 'edge:dependency',
            id: 'edge4',
            sourceId: 'task3',
            targetId: 'task5'
        },
    ]
};

/**
 * Initial model data for the example.
 * Positions are computed by ELK layout engine.
 */
export function createInitialModel() {

    const model = {
        type: 'graph',
        id: 'root',
        children: []
    };
    for (let i = 0; i < 10000; i++) {
        (model.children as any[]).push({
            type: 'node:task',
            id: `task${i}`,
            size: { width: 220, height: 140 },
            title: `Task ${i}`,
            description: `Description ${i}`,
            status: 'todo',
            assignee: `Assignee ${i}`
        });
    }

    return model;
    return niceModel;
}

