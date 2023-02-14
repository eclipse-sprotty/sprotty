import 'reflect-metadata'

import { LocalModelSource, TYPES } from 'sprotty'
import createContainer from './di.config'
import { graph } from './model-source';

document.addEventListener("DOMContentLoaded", () => {
    const container = createContainer('<%= html-element-id %>');
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    modelSource.setModel(graph);
});