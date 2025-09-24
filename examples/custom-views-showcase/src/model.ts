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
export class BasicShapeNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = SNodeImpl.DEFAULT_FEATURES;

    shape: 'circle' | 'triangle' | 'diamond' = 'circle';
    color?: string;
}

/**
 * Enhanced node - demonstrates extending base views
 */
export class EnhancedNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = SNodeImpl.DEFAULT_FEATURES;

    status: 'normal' | 'warning' | 'error' | 'success' = 'normal';
    showBorder: boolean = false;
    cornerRadius: number = 0;
}

/**
 * Complex node - demonstrates compositional views
 */
export class ComplexNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = SNodeImpl.DEFAULT_FEATURES;

    title: string = '';
    subtitle?: string;
    icon?: string;
    showHeader: boolean = true;
    showFooter: boolean = false;
    headerColor?: string;
}

/**
 * Stateful node - demonstrates conditional rendering
 */
export class StatefulNode extends SNodeImpl {
    static override readonly DEFAULT_FEATURES = SNodeImpl.DEFAULT_FEATURES;

    state: 'idle' | 'loading' | 'success' | 'error' = 'idle';
    progress?: number; // 0-100 for loading state
    message?: string;
}

/**
 * Custom edge - demonstrates edge view creation
 */
export class StyledEdge extends SEdgeImpl {
    static override readonly DEFAULT_FEATURES = SEdgeImpl.DEFAULT_FEATURES;

    style: 'solid' | 'dashed' | 'dotted' = 'solid';
    thickness: number = 2;
    color?: string;
    animated: boolean = false;
}

/**
 * Custom label for demonstration
 */
export class CustomLabel extends SLabelImpl {
    static override readonly DEFAULT_FEATURES = SLabelImpl.DEFAULT_FEATURES;

    backgroundColor?: string;
    borderColor?: string;
    fontSize: number = 12;
}
