import { Container, ContainerModule } from 'inversify';
import {
    configureModelElement, configureViewerOptions, ConsoleLogger, loadDefaultModules,
    LocalModelSource, LogLevel, PolylineEdgeView, RectangularNode, SEdgeImpl,
    SGraphImpl, SGraphView, SRoutingHandleImpl, SRoutingHandleView, TYPES
} from 'sprotty';
import { TaskNodeView } from './views';

export default (containerId: string) => {
    const myModule = new ContainerModule((bind, unbind, isBound, rebind) => {
        bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

        const context = { bind, unbind, isBound, rebind };
        configureModelElement(context, 'graph', SGraphImpl, SGraphView);
        configureModelElement(context, 'task', RectangularNode, TaskNodeView);
        configureModelElement(context, 'edge', SEdgeImpl, PolylineEdgeView);
        configureModelElement(context, 'routing-point', SRoutingHandleImpl, SRoutingHandleView);
        configureModelElement(context, 'volatile-routing-point', SRoutingHandleImpl, SRoutingHandleView);

        configureViewerOptions(context, {
            needsClientLayout: false,
            baseDiv: containerId
        });
    });

    const container = new Container();
    loadDefaultModules(container);
    container.load(myModule);
    return container;
}
