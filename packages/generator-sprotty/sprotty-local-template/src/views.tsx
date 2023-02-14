/** @jsx svg */
import { svg } from 'sprotty/lib/lib/jsx';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { IView, RenderingContext, SNode } from 'sprotty';
import { TaskNode } from './model';

@injectable()
export class TaskNodeView implements IView {
    render(node: Readonly<SNode & TaskNode>, context: RenderingContext): VNode {
        const width = 100;
        const height = 100;
        const position = 50;
        return <g>
            <rect class-sprotty-node={true} class-task={true}
                class-running={node.isRunning}
                class-finished={node.isFinished}
                width={node.size.width}
                height={node.size.height}
            >
            </rect>
            <text x={position} y={position + 5}>{node.name}</text>
        </g>;
    }
}