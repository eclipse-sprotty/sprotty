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
import { SNodeImpl, SEdgeImpl, SLabelImpl } from 'sprotty';
/**
 * Basic custom node - demonstrates simple custom view creation
 */
export declare class BasicShapeNode extends SNodeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    shape: 'circle' | 'triangle' | 'diamond';
    color?: string;
}
/**
 * Enhanced node - demonstrates extending base views
 */
export declare class EnhancedNode extends SNodeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    status: 'normal' | 'warning' | 'error' | 'success';
    showBorder: boolean;
    cornerRadius: number;
}
/**
 * Complex node - demonstrates compositional views
 */
export declare class ComplexNode extends SNodeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    title: string;
    subtitle?: string;
    icon?: string;
    showHeader: boolean;
    showFooter: boolean;
    headerColor?: string;
}
/**
 * Stateful node - demonstrates conditional rendering
 */
export declare class StatefulNode extends SNodeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    state: 'idle' | 'loading' | 'success' | 'error';
    progress?: number;
    message?: string;
}
/**
 * Custom edge - demonstrates edge view creation
 */
export declare class StyledEdge extends SEdgeImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    style: 'solid' | 'dashed' | 'dotted';
    thickness: number;
    color?: string;
    animated: boolean;
}
/**
 * Custom label for demonstration
 */
export declare class CustomLabel extends SLabelImpl {
    static readonly DEFAULT_FEATURES: symbol[];
    backgroundColor?: string;
    borderColor?: string;
    fontSize: number;
}
//# sourceMappingURL=model.d.ts.map