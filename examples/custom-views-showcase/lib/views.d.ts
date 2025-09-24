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
import { IView, RenderingContext, IViewArgs, RectangularNodeView, PolylineEdgeView } from 'sprotty';
import { BasicShapeNode, EnhancedNode, ComplexNode, StatefulNode, StyledEdge, CustomLabel } from './model';
/**
 * Basic Shape View - demonstrates simple custom view creation
 */
export declare class BasicShapeView implements IView {
    render(node: Readonly<BasicShapeNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected isVisible(element: BasicShapeNode, context: RenderingContext): boolean;
}
/**
 * Enhanced View - demonstrates extending base views with decorations
 */
export declare class EnhancedNodeView extends RectangularNodeView {
    render(node: Readonly<EnhancedNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected renderStatusIndicator(node: EnhancedNode): VNode | undefined;
    protected renderBorder(node: EnhancedNode): VNode;
}
/**
 * Complex View - demonstrates compositional view patterns
 */
export declare class ComplexNodeView implements IView {
    render(node: Readonly<ComplexNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected renderHeader(node: ComplexNode): VNode;
    protected renderBody(node: ComplexNode, context: RenderingContext): VNode;
    protected renderFooter(node: ComplexNode): VNode;
    protected isVisible(element: ComplexNode, context: RenderingContext): boolean;
}
/**
 * Stateful View - demonstrates conditional rendering based on state
 */
export declare class StatefulNodeView implements IView {
    render(node: Readonly<StatefulNode>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected renderLoadingState(node: StatefulNode, context: RenderingContext): VNode;
    protected renderErrorState(node: StatefulNode, context: RenderingContext): VNode;
    protected renderSuccessState(node: StatefulNode, context: RenderingContext): VNode;
    protected renderIdleState(node: StatefulNode, context: RenderingContext): VNode;
    protected isVisible(element: StatefulNode, context: RenderingContext): boolean;
}
/**
 * Styled Edge View - demonstrates custom edge rendering
 */
export declare class StyledEdgeView extends PolylineEdgeView {
    protected renderLine(edge: StyledEdge, segments: any[], context: RenderingContext): VNode;
    protected createPath(segments: any[]): string;
    protected getStrokeDashArray(edge: StyledEdge): string;
}
/**
 * Custom Label View - demonstrates label customization
 */
export declare class CustomLabelView implements IView {
    render(label: Readonly<CustomLabel>, context: RenderingContext, args?: IViewArgs): VNode | undefined;
    protected isVisible(element: CustomLabel, context: RenderingContext): boolean;
}
//# sourceMappingURL=views.d.ts.map