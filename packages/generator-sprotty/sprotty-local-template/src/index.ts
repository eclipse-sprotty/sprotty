import { LocalModelSource, TYPES } from 'sprotty'
import createContainer from './di.config'
import { graph } from './model-source';

export function runDiagram() {
    const container = createContainer('<%= html-element-id %>')
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    modelSource.setModel(graph)
}