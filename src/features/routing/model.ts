/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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

import { SModelElement, SParentElement } from '../../base/model/smodel';
import { SModelExtension } from '../../base/model/smodel-extension';
import { translatePoint } from '../../base/model/smodel-utils';
import { RoutedPoint } from './routing';
import { SEdge, SGraphIndex } from '../../graph/sgraph';
import { center, Point } from '../../utils/geometry';
import { FluentIterable } from '../../utils/iterable';
import { SShapeElement } from '../bounds/model';

export interface Routable extends SModelExtension {
    routingPoints: Point[];
    readonly source?: SConnectableElement;
    readonly target?: SConnectableElement;
    sourceId?: string,
    targetId?: string,
    route(): RoutedPoint[],
    sourceAnchorCorrection?: number,
    targetAnchorCorrection?: number,
    parent: SParentElement
}

export function isRoutable<T extends SModelElement>(element: T): element is T & Routable {
    return (element as any).routingPoints !== undefined
        && typeof((element as any).route) === 'function';
}

export const connectableFeature = Symbol('connectableFeature');

export interface Connectable extends SModelExtension {
    canConnect(routable: Routable, role: 'source' | 'target'): boolean;
}

export function isConnectable<T extends SModelElement>(element: T): element is Connectable & T {
    return element.hasFeature(connectableFeature) && (element as any).canConnect;
}

/**
 * A connectable element is one that can have outgoing and incoming edges, i.e. it can be the source
 * or target element of an edge. There are two kinds of connectable elements: nodes (`SNode`) and
 * ports (`SPort`). A node represents a main entity, while a port is a connection point inside a node.
 */
export abstract class SConnectableElement extends SShapeElement implements Connectable {

    /**
     * The incoming edges of this connectable element. They are resolved by the index, which must
     * be an `SGraphIndex`.
     */
    get incomingEdges(): FluentIterable<SEdge> {
        return (this.index as SGraphIndex).getIncomingEdges(this);
    }

    /**
     * The outgoing edges of this connectable element. They are resolved by the index, which must
     * be an `SGraphIndex`.
     */
    get outgoingEdges(): FluentIterable<SEdge> {
        return (this.index as SGraphIndex).getOutgoingEdges(this);
    }

    /**
     * Compute an anchor position for routing an edge towards this element.
     *
     * The default implementation returns the element's center point. If edges should be connected
     * differently, e.g. to some point on the boundary of the element's view, the according computation
     * should be implemented in a subclass by overriding this method.
     *
     * @param referencePoint The point from which the edge is routed towards this element
     * @param offset An optional offset value to be considered in the anchor computation;
     *               positive values should shift the anchor away from this element, negative values
     *               should shift the anchor more to the inside.
     */
    getAnchor(referencePoint: Point, offset?: number): Point {
        return center(this.bounds);
    }

    /**
     * Compute an anchor position for routing an edge towards this element and correct any mismatch
     * of the coordinate systems.
     *
     * @param refPoint The point from which the edge is routed towards this element
     * @param refContainer The parent element that defines the coordinate system for `refPoint`
     * @param edge The edge for which the anchor is computed
     * @param offset An optional offset value (see `getAnchor`)
     */
    getTranslatedAnchor(refPoint: Point, refContainer: SParentElement, edge: Routable, offset?: number): Point {
        const translatedRefPoint = translatePoint(refPoint, refContainer, this.parent);
        const anchor = this.getAnchor(translatedRefPoint, offset);
        return translatePoint(anchor, this.parent, edge.parent);
    }

    canConnect(routable: Routable, role: string) {
        return true;
    }
}
