/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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

import { LocalModelSource, TYPES } from 'sprotty';
import { createContainer } from './di.config';
import {
    createComparisonModel,
    createIntersectionModel,
    CustomEdge,
    RouterType,
    ArrowType,
    EdgeType,
    StrokeStyle
} from './model';
import { SGraph } from 'sprotty-protocol';

/**
 * Main application state
 */
interface AppState {
    currentRouter: RouterType;
    currentArrowType: ArrowType;
    currentEdgeType: EdgeType;
    currentStrokeStyle: StrokeStyle;
    showIntersections: boolean;
    useJumps: boolean;
    selectedEdgeId: string | null;
}

/**
 * Main entry point for the advanced edges showcase
 */
export default async function runAdvancedEdgesShowcase() {
    const container = createContainer();
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);

    const state: AppState = {
        currentRouter: 'polyline',
        currentArrowType: 'standard',
        currentEdgeType: 'normal',
        currentStrokeStyle: 'solid',
        showIntersections: false,
        useJumps: true,
        selectedEdgeId: null
    };

    /**
     * Update the diagram model
     */
    async function updateModel(model: SGraph): Promise<void> {
        await modelSource.setModel(model);
    }

    /**
     * Get current model from model source
     */
    async function getCurrentModel(): Promise<SGraph | undefined> {
        const model = (modelSource as any).model;
        return model as SGraph;
    }

    // Set initial model - start with simple polyline comparison
    await updateModel(createComparisonModel('polyline'));

    /**
     * Setup all control event listeners
     */
    function setupControls(): void {
        setupRouterControls();
        setupArrowControls();
        setupEdgeTypeControls();
        setupStrokeControls();
        setupIntersectionControls();
        setupScenarioButtons();
    }

    /**
     * Setup router selection controls
     */
    function setupRouterControls(): void {
        const routerSelect = document.getElementById('router-select') as HTMLSelectElement;
        if (routerSelect) {
            routerSelect.addEventListener('change', async () => {
                state.currentRouter = routerSelect.value as RouterType;
                await applyRouterToAllEdges();
            });
        }
    }

    /**
     * Setup arrow type controls
     */
    function setupArrowControls(): void {
        const arrowSelect = document.getElementById('arrow-select') as HTMLSelectElement;
        if (arrowSelect) {
            arrowSelect.addEventListener('change', async () => {
                state.currentArrowType = arrowSelect.value as ArrowType;
                await applyArrowTypeToAllEdges();
            });
        }
    }

    /**
     * Setup edge type controls
     */
    function setupEdgeTypeControls(): void {
        const edgeTypeSelect = document.getElementById('edge-type-select') as HTMLSelectElement;
        if (edgeTypeSelect) {
            edgeTypeSelect.addEventListener('change', async () => {
                state.currentEdgeType = edgeTypeSelect.value as EdgeType;
                await applyEdgeTypeToAllEdges();
            });
        }
    }

    /**
     * Setup stroke style controls
     */
    function setupStrokeControls(): void {
        const strokeSelect = document.getElementById('stroke-select') as HTMLSelectElement;
        if (strokeSelect) {
            strokeSelect.addEventListener('change', async () => {
                state.currentStrokeStyle = strokeSelect.value as StrokeStyle;
                await applyStrokeStyleToAllEdges();
            });
        }
    }

    /**
     * Setup intersection handling controls
     */
    function setupIntersectionControls(): void {
        const intersectionToggle = document.getElementById('intersection-toggle') as HTMLInputElement;
        if (intersectionToggle) {
            intersectionToggle.addEventListener('change', async () => {
                state.showIntersections = intersectionToggle.checked;
                if (state.showIntersections) {
                    await showIntersectionDemo();
                } else {
                    await updateModel(createComparisonModel('polyline'));
                }
            });
        }

        const jumpGapToggle = document.getElementById('jump-gap-toggle') as HTMLInputElement;
        if (jumpGapToggle) {
            jumpGapToggle.addEventListener('change', async () => {
                state.useJumps = jumpGapToggle.checked;
                if (state.showIntersections) {
                    await showIntersectionDemo();
                }
            });
        }
    }


    /**
     * Setup demo scenario buttons
     */
    function setupScenarioButtons(): void {
        const polylineButton = document.getElementById('btn-polyline') as HTMLButtonElement;
        if (polylineButton) {
            polylineButton.addEventListener('click', async () => {
                await updateModel(createComparisonModel('polyline'));
            });
        }

        const manhattanButton = document.getElementById('btn-manhattan') as HTMLButtonElement;
        if (manhattanButton) {
            manhattanButton.addEventListener('click', async () => {
                await updateModel(createComparisonModel('manhattan'));
            });
        }

        const bezierButton = document.getElementById('btn-bezier') as HTMLButtonElement;
        if (bezierButton) {
            bezierButton.addEventListener('click', async () => {
                await updateModel(createComparisonModel('bezier'));
            });
        }

        // Custom routers disabled temporarily - TODO: Re-enable after proper anchor registration
        const arcButton = document.getElementById('btn-arc') as HTMLButtonElement;
        if (arcButton) {
            arcButton.disabled = true;
            arcButton.title = 'Custom Arc router temporarily disabled';
        }

        const stepButton = document.getElementById('btn-step') as HTMLButtonElement;
        if (stepButton) {
            stepButton.disabled = true;
            stepButton.title = 'Custom Step router temporarily disabled';
        }
    }

    /**
     * Apply router change to all edges
     */
    async function applyRouterToAllEdges(): Promise<void> {
        const currentModel = await getCurrentModel();
        if (!currentModel) return;

        const updatedChildren = currentModel.children?.map(child => {
            if (child.type?.startsWith('edge')) {
                return {
                    ...child,
                    routerKind: state.currentRouter
                };
            }
            return child;
        });

        await updateModel({
            ...currentModel,
            children: updatedChildren
        });
    }

    /**
     * Apply arrow type to all edges
     */
    async function applyArrowTypeToAllEdges(): Promise<void> {
        const currentModel = await getCurrentModel();
        if (!currentModel) return;

        const updatedChildren = currentModel.children?.map(child => {
            if (child.type?.startsWith('edge')) {
                return {
                    ...child,
                    arrowType: state.currentArrowType
                } as CustomEdge;
            }
            return child;
        });

        await updateModel({
            ...currentModel,
            children: updatedChildren
        });
    }

    /**
     * Apply edge type to all edges
     */
    async function applyEdgeTypeToAllEdges(): Promise<void> {
        const currentModel = await getCurrentModel();
        if (!currentModel) return;

        const updatedChildren = currentModel.children?.map(child => {
            if (child.type?.startsWith('edge')) {
                return {
                    ...child,
                    edgeType: state.currentEdgeType
                } as CustomEdge;
            }
            return child;
        });

        await updateModel({
            ...currentModel,
            children: updatedChildren
        });
    }

    /**
     * Apply stroke style to all edges
     */
    async function applyStrokeStyleToAllEdges(): Promise<void> {
        const currentModel = await getCurrentModel();
        if (!currentModel) return;

        const updatedChildren = currentModel.children?.map(child => {
            if (child.type?.startsWith('edge')) {
                return {
                    ...child,
                    strokeStyle: state.currentStrokeStyle
                } as CustomEdge;
            }
            return child;
        });

        await updateModel({
            ...currentModel,
            children: updatedChildren
        });
    }


    /**
     * Show intersection demonstration
     */
    async function showIntersectionDemo(): Promise<void> {
        await updateModel(createIntersectionModel(state.useJumps));
    }

    // Setup event listeners
    setupControls();

    console.log('Advanced Edges Showcase initialized');
}

