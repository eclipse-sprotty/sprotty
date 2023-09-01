/********************************************************************************
 * Copyright (c) 2018-2022 TypeFox and others.
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

import {
    ELK, ElkNode, ElkLabel, ElkPort, ElkShape, ElkExtendedEdge, LayoutOptions, ElkPrimitiveEdge
} from 'elkjs/lib/elk-api';
import { IModelLayoutEngine } from 'sprotty-protocol/lib/diagram-services';
import { SCompartment, SEdge, SGraph, SLabel, SModelElement, SNode, SPort, SShapeElement } from 'sprotty-protocol/lib/model';
import { Point } from 'sprotty-protocol/lib/utils/geometry';
import { getBasicType, SModelIndex } from 'sprotty-protocol/lib/utils/model-utils';

/**
 * Layout engine that delegates to ELK by transforming the Sprotty graph into an ELK graph.
 *
 * This layout engine requires that the _basic type_ of every model element conforms to the
 * convention: `graph` for the top-level element, `node` for nodes, `edge` for edges, `label`
 * for labels, and `port` for ports. The basic type is either the value of the `type` property
 * or the substring preceding the separator `:` if present. Example: `'node:state'` is
 * interpreted as a node, while `'edge:transition'` is interpreted as an edge.
 */
export class ElkLayoutEngine implements IModelLayoutEngine {

    protected readonly elk: ELK;

    constructor(elkFactory: ElkFactory,
                protected readonly filter: IElementFilter = new DefaultElementFilter(),
                protected readonly configurator: ILayoutConfigurator = new DefaultLayoutConfigurator(),
                protected readonly preprocessor?: ILayoutPreprocessor,
                protected readonly postprocessor?: ILayoutPostprocessor) {
        this.elk = elkFactory();
    }

    /**
     * Transform the Sprotty graph into an ELK graph, invoke the ELK layout engine,
     * apply the results to the original graph, and return it.
     *
     * _Note:_ The basic type of the root element must be `graph`.
     */
    layout(sgraph: SGraph, index?: SModelIndex): SGraph | Promise<SGraph> {
        if (this.getBasicType(sgraph) !== 'graph') {
            return sgraph;
        }
        if (!index) {
            index = new SModelIndex();
            index.add(sgraph);
        }

        // STEP 1: Transform the Sprotty graph into an ELK graph with optional pre-processing
        const elkGraph = this.transformGraph(sgraph, index);
        if (this.preprocessor) {
            this.preprocessor.preprocess(elkGraph, sgraph, index);
        }

        // STEP 2: Invoke the ELK layout engine
        return this.elk.layout(elkGraph).then(result => {

            // STEP 3: Apply the results with optional post-processing to the original graph
            if (this.postprocessor) {
                this.postprocessor.postprocess(result, sgraph, index!);
            }
            this.applyLayout(result, index!);
            return sgraph;
        });
    }

    /**
     * Determine the _basic type_ of the given model element. The layout engine supports
     * the following values: `graph`, `node`, `edge`, `label`, `port` and `compartment`
     */
    protected getBasicType(smodel: SModelElement): string {
        return getBasicType(smodel);
    }

    /**
     * Transform a Sprotty graph element to an ELK graph element.
     */
    protected transformGraph(sgraph: SGraph, index: SModelIndex): ElkNode {
        const elkGraph: ElkNode = {
            id: sgraph.id,
            layoutOptions: this.configurator.apply(sgraph, index)
        };
        if (sgraph.children) {
            elkGraph.children = sgraph.children
                .filter(c => this.getBasicType(c) === 'node' && this.filter.apply(c, index))
                .map(c => this.transformNode(c as SNode, index));
            elkGraph.edges = sgraph.children
                .filter(c => this.getBasicType(c) === 'edge' && this.filter.apply(c, index))
                .map(c => this.transformEdge(c as SEdge, index));
        }
        return elkGraph;
    }

    /**
     * Transform a Sprotty node element to an ELK node element.
     */
    protected transformNode(snode: SNode, index: SModelIndex): ElkNode {
        const elkNode: ElkNode = {
            id: snode.id,
            layoutOptions: this.configurator.apply(snode, index)
        };
        if (snode.children) {
            const padding: LayoutPadding = { top: 0, right: 0, bottom: 0, left: 0 };
            elkNode.children = this.transformCompartment(snode, index, padding);
            if (padding.top !== 0 || padding.right !== 0 || padding.bottom !== 0 || padding.left !== 0) {
                elkNode.layoutOptions ??= {};
                elkNode.layoutOptions['org.eclipse.elk.padding'] ??= `[top=${padding.top},left=${padding.left},bottom=${padding.bottom},right=${padding.right}]`;
            }
            elkNode.edges = snode.children
                .filter(c => this.getBasicType(c) === 'edge' && this.filter.apply(c, index))
                .map(c => this.transformEdge(c as SEdge, index));
            elkNode.labels = snode.children
                .filter(c => this.getBasicType(c) === 'label' && this.filter.apply(c, index))
                .map(c => this.transformLabel(c as SLabel, index));
            elkNode.ports = snode.children
                .filter(c => this.getBasicType(c) === 'port' && this.filter.apply(c, index))
                .map(c => this.transformPort(c as SPort, index));
        }
        this.transformShape(elkNode, snode);
        return elkNode;
    }

    protected transformCompartment(scomp: SNode | SCompartment, index: SModelIndex, padding: LayoutPadding): ElkNode[] | undefined {
        if (!scomp.children) {
            return undefined;
        }
        const nodes = scomp.children.filter(c => this.getBasicType(c) === 'node' && this.filter.apply(c, index));
        if (nodes.length > 0) {
            return nodes.map(c => this.transformNode(c as SNode, index));
        }
        for (const c of scomp.children) {
            if (this.getBasicType(c) === 'compartment' && this.filter.apply(c, index)) {
                const ccomp = c as SCompartment;
                if (scomp.layout) {
                    if (ccomp.position) {
                        padding.left += ccomp.position.x;
                        padding.top += ccomp.position.y;
                    }
                    if (ccomp.size && scomp.size) {
                        padding.right += scomp.size.width - ccomp.size.width - (ccomp.position ? ccomp.position.x : 0);
                        padding.bottom += scomp.size.height - ccomp.size.height - (ccomp.position ? ccomp.position.y : 0);
                    }
                }
                const childNodes = this.transformCompartment(ccomp, index, padding);
                if (childNodes) {
                    return childNodes;
                }
            }
        }
        return undefined;
    }

    /**
     * Transform a Sprotty edge element to an ELK edge element.
     */
    protected transformEdge(sedge: SEdge, index: SModelIndex): ElkExtendedEdge {
        const elkEdge: ElkExtendedEdge = {
            id: sedge.id,
            sources: [sedge.sourceId],
            targets: [sedge.targetId],
            layoutOptions: this.configurator.apply(sedge, index)
        };
        if (sedge.children) {
            elkEdge.labels = sedge.children
                .filter(c => this.getBasicType(c) === 'label' && this.filter.apply(c, index))
                .map(c => this.transformLabel(c as SLabel, index));
        }
        const points = sedge.routingPoints;
        if (points && points.length >= 2) {
            elkEdge.sections = [{
                id: sedge.id + ':section',
                startPoint: points[0],
                bendPoints: points.slice(1, points.length - 1),
                endPoint: points[points.length - 1]
            }];
        }
        return elkEdge;
    }

    /**
     * Transform a Sprotty label element to an ELK label element.
     */
    protected transformLabel(slabel: SLabel, index: SModelIndex): ElkLabel {
        const elkLabel: ElkLabel = {
            id: slabel.id,
            text: slabel.text,
            layoutOptions: this.configurator.apply(slabel, index)
        };
        this.transformShape(elkLabel, slabel);
        return elkLabel;
    }

    /**
     * Transform a Sprotty port element to an ELK port element.
     */
    protected transformPort(sport: SPort, index: SModelIndex): ElkPort {
        const elkPort: ElkPort = {
            id: sport.id,
            layoutOptions: this.configurator.apply(sport, index)
        };
        if (sport.children) {
            elkPort.labels = sport.children
                .filter(c => this.getBasicType(c) === 'label' && this.filter.apply(c, index))
                .map(c => this.transformLabel(c as SLabel, index));
        }
        this.transformShape(elkPort, sport);
        return elkPort;
    }

    /**
     * Copy the position and size of a Sprotty shape to an ELK shape.
     */
    protected transformShape(elkShape: ElkShape, sshape: SShapeElement): void {
        if (sshape.position) {
            elkShape.x = sshape.position.x;
            elkShape.y = sshape.position.y;
        }
        if (sshape.size) {
            elkShape.width = sshape.size.width;
            elkShape.height = sshape.size.height;
        }
    }

    /**
     * Apply the results of the ELK layout engine to the original Sprotty model.
     */
    protected applyLayout(elkNode: ElkNode, index: SModelIndex): void {
        const snode = index.getById(elkNode.id);
        if (snode && this.getBasicType(snode) === 'node') {
            this.applyShape(snode as SNode, elkNode, index);
        }
        if (elkNode.children) {
            for (const child of elkNode.children) {
                this.applyLayout(child, index);
            }
        }
        if (elkNode.edges) {
            for (const elkEdge of elkNode.edges) {
                const sedge = index.getById(elkEdge.id);
                if (sedge && this.getBasicType(sedge) === 'edge') {
                    this.applyEdge(sedge as SEdge, elkEdge, index);
                }
            }
        }
        if (elkNode.ports) {
            for (const elkPort of elkNode.ports) {
                const sport = index.getById(elkPort.id);
                if (sport && this.getBasicType(sport) === 'port') {
                    this.applyShape(sport as SPort, elkPort, index);
                }
            }
        }
    }

    /**
     * Apply shape layout results, i.e. position and size.
     */
    protected applyShape(sshape: SShapeElement, elkShape: ElkShape, index: SModelIndex): void {
        if (elkShape.x !== undefined && elkShape.y !== undefined) {
            sshape.position = { x: elkShape.x, y: elkShape.y };
        }
        if (elkShape.width !== undefined && elkShape.height !== undefined) {
            sshape.size = { width: elkShape.width, height: elkShape.height };
        }

        if (elkShape.labels) {
            for (const elkLabel of elkShape.labels) {
                const slabel = elkLabel.id && index.getById(elkLabel.id);
                if (slabel) {
                    this.applyShape(slabel as SLabel, elkLabel, index);
                }
            }
        }
    }

    /**
     * Apply edge layout results, i.e. start point, end point and bend points.
     */
    protected applyEdge(sedge: SEdge, elkEdge: ElkExtendedEdge, index: SModelIndex): void {
        const points: Point[] = [];
        if (elkEdge.sections && elkEdge.sections.length > 0) {
            const section = elkEdge.sections[0];
            if (section.startPoint) {
                points.push(section.startPoint);
            }
            if (section.bendPoints) {
                points.push(...section.bendPoints);
            }
            if (section.endPoint) {
                points.push(section.endPoint);
            }
        } else if (isPrimitiveEdge(elkEdge)) {
            if (elkEdge.sourcePoint) {
                points.push(elkEdge.sourcePoint);
            }
            if (elkEdge.bendPoints) {
                points.push(...elkEdge.bendPoints);
            }
            if (elkEdge.targetPoint) {
                points.push(elkEdge.targetPoint);
            }
        }
        sedge.routingPoints = points;

        if (elkEdge.labels) {
            elkEdge.labels.forEach((elkLabel) => {
                const sLabel = elkLabel.id && index.getById(elkLabel.id);
                if (sLabel) {
                    this.applyShape(sLabel, elkLabel, index);
                }
            });
        }
    }

}

function isPrimitiveEdge(edge: unknown): edge is ElkPrimitiveEdge {
    return typeof (edge as ElkPrimitiveEdge).source === 'string'
        && typeof (edge as ElkPrimitiveEdge).target === 'string';
}

/**
 * Factory for ELK instances. Follow the elkjs package documentation on how to configure ELK
 * instances. For example, the bundled version can be used by importing the ELK constructor
 * from `"elkjs/lib/elk.bundled"`. For the webworker version, import the constructor from
 * `"elkjs/lib/elk-api"` and add the option `workerUrl: "elk/elk-worker.min.js"`.
 */
export type ElkFactory = () => ELK;

/**
 * Filter used to determine which model elements should be included in the automatic layout.
 */
export interface IElementFilter {
    apply(element: SModelElement, index: SModelIndex): boolean
}

export class DefaultElementFilter implements IElementFilter {

    apply(element: SModelElement, index: SModelIndex): boolean {
        switch (this.getBasicType(element)) {
            case 'node':
                return this.filterNode(element as SNode, index);
            case 'edge':
                return this.filterEdge(element as SEdge, index);
            case 'label':
                return this.filterLabel(element as SLabel, index);
            case 'port':
                return this.filterPort(element as SPort, index);
            case 'compartment':
                return this.filterCompartment(element as SCompartment, index);
            default:
                return true;
        }
    }

    protected getBasicType(smodel: SModelElement): string{
        return getBasicType(smodel);
    }

    protected filterNode(node: SNode, index: SModelIndex): boolean {
        return true;
    }

    protected filterEdge(edge: SEdge, index: SModelIndex): boolean {
        const source = index.getById(edge.sourceId);
        if (!source)
            return false;
        const sourceType = this.getBasicType(source);
        if (sourceType === 'node' && !this.filterNode(source, index)
            || sourceType === 'port' && !this.filterPort(source, index))
            return false;
        const target = index.getById(edge.targetId);
        if (!target)
            return false;
        const targetType = this.getBasicType(target);
        if (targetType === 'node' && !this.filterNode(target, index)
            || targetType === 'port' && !this.filterPort(target, index))
            return false;
        return true;
    }

    protected filterLabel(label: SLabel, index: SModelIndex): boolean {
        return true;
    }

    protected filterPort(port: SPort, index: SModelIndex): boolean {
        return true;
    }

    protected filterCompartment(compartment: SCompartment, index: SModelIndex): boolean {
        return true;
    }

}

/**
 * Configurator of layout algorithms; provides mappings of layout options for each model element.
 */
export interface ILayoutConfigurator {
    apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined
}

export class DefaultLayoutConfigurator implements ILayoutConfigurator {

    apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined {
        switch (this.getBasicType(element)) {
            case 'graph':
                return this.graphOptions(element as SGraph, index);
            case 'node':
                return this.nodeOptions(element as SNode, index);
            case 'edge':
                return this.edgeOptions(element as SEdge, index);
            case 'label':
                return this.labelOptions(element as SLabel, index);
            case 'port':
                return this.portOptions(element as SPort, index);
            default:
                return undefined;
        }
    }

    protected getBasicType(smodel: SModelElement): string{
        return getBasicType(smodel);
    }

    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions | undefined {
        return undefined;
    }

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        return undefined;
    }

    protected edgeOptions(sedge: SEdge, index: SModelIndex): LayoutOptions | undefined {
        return undefined;
    }

    protected labelOptions(slabel: SLabel, index: SModelIndex): LayoutOptions | undefined {
        return undefined;
    }

    protected portOptions(sport: SPort, index: SModelIndex): LayoutOptions | undefined {
        return undefined;
    }

}

export interface ILayoutPreprocessor {
    preprocess(elkGraph: ElkNode, sgraph: SGraph, index: SModelIndex): void
}

export interface ILayoutPostprocessor {
    postprocess(elkGraph: ElkNode, sgraph: SGraph, index: SModelIndex): void
}

export type LayoutPadding = {
    top: number,
    right: number,
    bottom: number,
    left: number
};
