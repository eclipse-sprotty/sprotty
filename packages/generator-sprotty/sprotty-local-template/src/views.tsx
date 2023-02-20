/** @jsx svg */
import { svg } from 'sprotty/lib/lib/jsx';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { IView, RenderingContext, SNode } from 'sprotty';
import { TaskNode } from './model';

@injectable()
export class TaskNodeView implements IView {
    render(node: Readonly<SNode & TaskNode>, context: RenderingContext): VNode {
        return <g>
            <rect class-sprotty-node={true} class-task={true}
                class-running={node.isRunning}
                class-finished={node.isFinished}
                width={node.size.width}
                height={node.size.height}
            >
            </rect>
            <text x={node.size.width / 2} y={node.size.height / 2 + 5}>{node.name}</text>
        </g>;
    }
}