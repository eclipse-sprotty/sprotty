# sprotty-library

A library of prebuilt diagram elements for [Eclipse Sprotty](https://github.com/eclipse-sprotty/sprotty). It currently provides the standard flowchart shapes together with matching Sprotty views, so a flowchart can be assembled from model data alone, without writing custom views.

## Installation

```bash
npm install sprotty-library
```

The package depends on `sprotty` and `sprotty-protocol` of the same major version. Like them, it is published as ES modules only.

## Usage

`Flowchart.flowchartModule` is an InversifyJS `ContainerModule` that registers the flowchart element types with their model classes and views. Load it into the diagram container after the default Sprotty modules and before your own module:

```ts
import { Container, ContainerModule } from 'inversify';
import { LocalModelSource, TYPES, loadDefaultModules } from 'sprotty';
import { Flowchart } from 'sprotty-library';

const container = new Container();
loadDefaultModules(container);
container.load(Flowchart.flowchartModule);
container.load(new ContainerModule(({ bind }) => {
    bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
}));
```

The module registers these element types (the `type` values used in the external model):

| Type | Model class | View |
| --- | --- | --- |
| `graph` | `SGraphImpl` | `SGraphView` |
| `node:terminal` | `RectangularNode` | `TerminalNodeView` |
| `node:process` | `RectangularNode` | `ProcessNodeView` |
| `node:decision` | `DiamondNode` | `DecisionNodeView` |
| `node:input`, `node:output` | `RectangularNode` | `InputOutputNodeView` |
| `node:comment` | `RectangularNode` | `CommentNodeView` |
| `node:predefined-process` | `RectangularNode` | `PredefinedProcessNodeView` |
| `node:on-page-connector` | `CircularNode` | `OnPageConnectorNodeView` |
| `node:off-page-connector` | `RectangularNode` | `OffPageConnectorNodeView` |
| `node:delay` | `RectangularNode` | `DelayNodeView` |
| `node:alternate-process` | `RectangularNode` | `AlternateProcessNodeView` |
| `node:data` | `RectangularNode` | `DataNodeView` |
| `node:document` | `RectangularNode` | `DocumentNodeView` |
| `node:multi-document` | `RectangularNode` | `MultiDocumentNodeView` |
| `node:preparation` | `RectangularNode` | `PreparationNodeView` |
| `node:display` | `RectangularNode` | `DisplayNodeView` |
| `node:manual-input` | `RectangularNode` | `ManualInputNodeView` |
| `node:manual-operation` | `RectangularNode` | `ManualOperationNodeView` |
| `node:database` | `RectangularNode` | `DatabaseNodeView` |
| `label` | `SLabelImpl` | `SLabelView` |
| `label:edge` | `SLabelImpl` | `EdgeLabelView` |
| `edge` | `SEdgeImpl` | `EdgeWithArrow` |
| `routing-point`, `volatile-routing-point` | `SRoutingHandleImpl` | `SRoutingHandleView` |

For each node type, `Flowchart` also exports a `sprotty-protocol` interface with the matching `type` literal (`Terminal`, `Process`, `Decision`, …) for building typed external models. The views are exported as well, so individual registrations can be overridden with `configureModelElement` in a module that is loaded after `flowchartModule`.

## Styling

The views render plain SVG shapes and emit CSS classes rather than inline styles. Every node carries `sprotty-node` and a class named after its type (`terminal`, `process`, `decision`, …), plus `mouseover` and `selected` while it is hovered or selected. Edges render their arrow as a path with the class `arrowhead`; edge labels consist of a `text` with the class `sprotty-label` on a background rect with the class `edge-label-background`. The package ships no stylesheet, so the application provides one; the [stylesheet of the flowchart example](https://github.com/eclipse-sprotty/sprotty/blob/main/examples/flowchart/css/diagram.css) is a good starting point.

## Example

The [flowchart example](https://github.com/eclipse-sprotty/sprotty/tree/main/examples/flowchart) shows the module in a complete application. In a clone of the repository, run `npm install`, `npm run build` and `npm run start -w examples`, then open http://localhost:8080/flowchart/flowchart.html.

## Docs

For further information please consult the [documentation on the website](https://sprotty.org/docs/).

The version history is documented in the [CHANGELOG](https://github.com/eclipse-sprotty/sprotty/blob/main/packages/sprotty-library/CHANGELOG.md).
