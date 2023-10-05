import { SEdge, SGraph } from 'sprotty-protocol';
import { TaskNode } from './model';

export const graph: SGraph = {
    type: 'graph',
    id: 'graph',
    children: [
        <TaskNode>{
            type: 'task',
            id: 'task01',
            name: 'First Task',
            isFinished: true,
            isRunning: false,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 }
        },
        <TaskNode>{
            type: 'task',
            id: 'task02',
            name: 'Second Task',
            isFinished: false,
            isRunning: true,
            position: { x: 0, y: 200 },
            size: { width: 100, height: 100 }
        },
        <TaskNode>{
            type: 'task',
            id: 'task03',
            name: 'Third Task',
            isFinished: false,
            isRunning: false,
            position: { x: 150, y: 0 },
            size: { width: 100, height: 100 }
        },
        <SEdge>{
            type: 'edge',
            id: 'edge01',
            sourceId: 'task01',
            targetId: 'task02',
            routerKind: 'manhattan',
        }
    ]
};