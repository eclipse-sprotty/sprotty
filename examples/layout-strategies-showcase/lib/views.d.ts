/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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
import { VNode } from 'snabbdom';
import { IView, RenderingContext, IViewArgs, PolylineEdgeView } from 'sprotty';
import { ClientLayoutNode, ServerLayoutNode, HybridLayoutNode, LayoutCompartment, LayoutAwareLabel, LayoutEdge } from './model';
/**
 * Client Layout Node View - Rich content with micro-layout
 */
export declare class ClientLayoutNodeView implements IView {
    render(node: Readonly<ClientLayoutNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected isVisible(element: ClientLayoutNode, context: RenderingContext): boolean;
}
/**
 * Server Layout Node View - Minimal content, positioned by algorithms
 */
export declare class ServerLayoutNodeView implements IView {
    render(node: Readonly<ServerLayoutNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected isVisible(element: ServerLayoutNode, context: RenderingContext): boolean;
    protected getNodeIcon(nodeType?: string): string;
    protected getNodeColor(nodeType?: string): string;
}
/**
 * Hybrid Layout Node View - Combines both approaches
 */
export declare class HybridLayoutNodeView implements IView {
    render(node: Readonly<HybridLayoutNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected isVisible(element: HybridLayoutNode, context: RenderingContext): boolean;
    protected getNodeIcon(nodeType?: string): string;
}
/**
 * Layout Compartment View - Organizes content within nodes
 */
export declare class LayoutCompartmentView implements IView {
    render(compartment: Readonly<LayoutCompartment>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected isVisible(element: LayoutCompartment, context: RenderingContext): boolean;
}
/**
 * Layout Aware Label View - Adapts to layout context
 */
export declare class LayoutAwareLabelView implements IView {
    render(label: Readonly<LayoutAwareLabel>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected isVisible(element: LayoutAwareLabel, context: RenderingContext): boolean;
    protected getDefaultFontSize(labelType?: string): number;
    protected getDefaultFontWeight(labelType?: string): string;
    protected getDefaultColor(labelType?: string): string;
}
/**
 * Layout Edge View - Works with all layout strategies
 */
export declare class LayoutEdgeView extends PolylineEdgeView {
    render(edge: Readonly<LayoutEdge>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected getEdgeColor(edgeType?: string): string;
    protected getStrokeDashArray(style?: string): string;
    protected createPathForRoute(route: any[]): string;
    protected renderArrowHead(route: any[], color: string): VNode | undefined;
}
/**
 * Performance Monitor View - Shows layout performance metrics
 */
export declare class PerformanceMonitorView implements IView {
    render(monitor: any, context: RenderingContext, args?: IViewArgs): VNode | undefined;
}
//# sourceMappingURL=views.d.ts.map