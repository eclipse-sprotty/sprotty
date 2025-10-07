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

import { TYPES, LocalModelSource, IActionDispatcher } from 'sprotty';
import { SGraph, SNode, SLabel, SCompartment, FitToScreenAction } from 'sprotty-protocol';
import createContainer from './di.config';

export default async function runMicroLayoutShowcase() {
    const container = createContainer();
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);

    // Create the micro-layout demonstration diagram
    const graph: SGraph = {
        id: 'graph',
        type: 'graph',
        children: [
            // Section 1: Basic Layout Types Demo
            createDemoCard('vbox-demo', 'VBox Layout', 'vbox', { x: 50, y: 50 }),
            createDemoCard('hbox-demo', 'HBox Layout', 'hbox', { x: 250, y: 50 }),
            createDemoCard('stack-demo', 'Stack Layout', 'stack', { x: 450, y: 50 }),

            // Section 2: Interactive Card
            createInteractiveCard(),

            // Section 3: Complex Layout with Compartments
            createComplexLayoutDemo(),

            // Section 4: Layoutable Children Demo
            createLayoutableChildrenDemo()
        ]
    };

    // Initialize the model
    modelSource.setModel(graph);

    // Setup interactive controls
    setupInteractiveControls(modelSource);

    // Fit the diagram to screen with padding after a short delay to ensure rendering is complete
    setTimeout(() => {
        dispatcher.dispatch(FitToScreenAction.create([], { padding: 20, animate: false }));
    }, 300);
}

function createDemoCard(id: string, title: string, layout: 'vbox' | 'hbox' | 'stack', position: { x: number, y: number }): SNode {
    const children: (SLabel | SNode)[] = [
        {
            id: `${id}-title`,
            type: 'label:text',
            text: title,
            position: { x: 0, y: 0 }
        } as SLabel
    ];

    // Add different child elements based on layout type
    if (layout === 'vbox') {
        children.push(
            {
                id: `${id}-icon`,
                type: 'node:component',
                componentType: 'icon',
                size: { width: 30, height: 30 },
                children: [{
                    id: `${id}-icon-label`,
                    type: 'label:text',
                    text: '⭐',
                    position: { x: 15, y: 15 }
                } as SLabel]
            } as SNode,
            {
                id: `${id}-button`,
                type: 'node:component',
                componentType: 'button',
                size: { width: 60, height: 25 },
                children: [{
                    id: `${id}-button-label`,
                    type: 'label:text',
                    text: 'Action',
                    position: { x: 30, y: 12 }
                } as SLabel]
            } as SNode
        );
    } else if (layout === 'hbox') {
        children.push(
            {
                id: `${id}-icon`,
                type: 'node:component',
                componentType: 'icon',
                size: { width: 25, height: 25 },
                children: [{
                    id: `${id}-icon-label`,
                    type: 'label:text',
                    text: '📊',
                    position: { x: 12, y: 12 }
                } as SLabel]
            } as SNode,
            {
                id: `${id}-text`,
                type: 'label:text',
                text: 'Data',
                position: { x: 0, y: 0 }
            } as SLabel,
            {
                id: `${id}-button`,
                type: 'node:component',
                componentType: 'button',
                size: { width: 40, height: 20 },
                children: [{
                    id: `${id}-button-label`,
                    type: 'label:text',
                    text: 'Go',
                    position: { x: 20, y: 10 }
                } as SLabel]
            } as SNode
        );
    } else { // stack
        children.push(
            {
                id: `${id}-background`,
                type: 'label:text',
                text: 'Background',
                position: { x: 0, y: 0 }
            } as SLabel,
            {
                id: `${id}-overlay`,
                type: 'label:text',
                text: 'Overlay',
                position: { x: 0, y: 0 }
            } as SLabel
        );
    }

    return {
        id,
        type: 'node:demo-card',
        position,
        size: { width: 150, height: 120 },
        layout,
        layoutOptions: {
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            paddingRight: 10,
            hAlign: 'center',
            vAlign: 'center'
        },
        children
    } as SNode;
}

function createInteractiveCard(): SNode {
    return {
        id: 'interactive-card',
        type: 'node:interactive-card',
        position: { x: 50, y: 220 },
        size: { width: 200, height: 150 },
        layout: 'vbox',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingRight: 15,
            paddingBottom: 10,
            paddingLeft: 15,
            minWidth: 150,
            minHeight: 100,
            resizeContainer: true
        },
        children: [
            {
                id: 'interactive-title',
                type: 'label:text',
                text: 'Interactive Card',
                position: { x: 0, y: 0 }
            } as SLabel,
            {
                id: 'interactive-icon',
                type: 'node:component',
                componentType: 'icon',
                size: { width: 40, height: 40 },
                children: [{
                    id: 'interactive-icon-label',
                    type: 'label:text',
                    text: '🎛️',
                    position: { x: 20, y: 20 }
                } as SLabel]
            } as SNode,
            {
                id: 'interactive-description',
                type: 'label:text',
                text: 'Use controls →',
                position: { x: 0, y: 0 }
            } as SLabel,
            {
                id: 'interactive-button',
                type: 'node:component',
                componentType: 'button',
                size: { width: 80, height: 30 },
                children: [{
                    id: 'interactive-button-label',
                    type: 'label:text',
                    text: 'Button',
                    position: { x: 40, y: 15 }
                } as SLabel]
            } as SNode
        ]
    } as SNode;
}

function createComplexLayoutDemo(): SNode {
    return {
        id: 'complex-demo',
        type: 'node:demo-card',
        position: { x: 300, y: 220 },
        size: { width: 250, height: 180 },
        layout: 'vbox',
        layoutOptions: {
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            paddingRight: 10
        },
        children: [
            {
                id: 'complex-title',
                type: 'label:text',
                text: 'Dashboard Card',
                position: { x: 0, y: 0 }
            } as SLabel,
            {
                id: 'metrics-compartment',
                type: 'comp:compartment',
                layout: 'hbox',
                layoutOptions: {
                    paddingTop: 5,
                    paddingBottom: 5,
                    paddingLeft: 5,
                    paddingRight: 5
                },
                children: [
                    createMetric('metric1', 'CPU', '45%'),
                    createMetric('metric2', 'RAM', '78%'),
                    createMetric('metric3', 'DISK', '23%')
                ]
            } as SCompartment,
            {
                id: 'chart-area',
                type: 'node:component',
                componentType: 'chart',
                size: { width: 200, height: 60 },
                children: [{
                    id: 'chart-label',
                    type: 'label:text',
                    text: '📈 Chart Area',
                    position: { x: 100, y: 30 }
                } as SLabel]
            } as SNode
        ]
    } as SNode;
}

function createMetric(id: string, label: string, value: string): SNode {
    return {
        id,
        type: 'node:component',
        componentType: 'metric',
        size: { width: 60, height: 40 },
        layout: 'vbox',
        layoutOptions: {
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 3,
            paddingBottom: 3
        },
        children: [
            {
                id: `${id}-label`,
                type: 'label:text',
                text: label,
                position: { x: 0, y: 0 }
            } as SLabel,
            {
                id: `${id}-value`,
                type: 'label:text',
                text: value,
                position: { x: 0, y: 0 }
            } as SLabel
        ]
    } as SNode;
}

function createLayoutableChildrenDemo(): SNode {
    return {
        id: 'layoutable-demo',
        type: 'node:demo-card',
        position: { x: 50, y: 430 },
        size: { width: 550, height: 180 },
        layout: 'vbox',
        layoutOptions: {
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            paddingRight: 10,
            hAlign: 'center',
            vAlign: 'center'
        },
        children: [
            {
                id: 'layoutable-title',
                type: 'label:text',
                text: 'Layoutable Children Demonstration'
            } as SLabel,
            {
                id: 'comparison-container',
                type: 'comp:compartment',
                layout: 'hbox',
                layoutOptions: {
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 10,
                    paddingRight: 10,
                    hAlign: 'center',
                    vAlign: 'center'
                },
                children: [
                    // Left side: Regular nodes (ignore parent layout)
                    {
                        id: 'regular-container',
                        type: 'node:demo-card',
                        size: { width: 240, height: 120 },
                        layout: 'vbox',
                        layoutOptions: {
                            paddingTop: 10,
                            paddingBottom: 10,
                            paddingLeft: 10,
                            paddingRight: 10,
                            hAlign: 'center',
                            vAlign: 'center'
                        },
                        children: [
                            {
                                id: 'regular-title',
                                type: 'label:text',
                                text: 'Regular Nodes'
                            } as SLabel,
                            {
                                id: 'regular-subtitle',
                                type: 'label:text',
                                text: '(ignore parent layout)'
                            } as SLabel,
                            {
                                id: 'regular-node-1',
                                type: 'node:regular',
                                position: { x: 20, y: 60 }, // Explicit position - ignores layout
                                size: { width: 60, height: 25 },
                                children: [{
                                    id: 'regular-1-label',
                                    type: 'label:text',
                                    text: 'Fixed Pos'
                                } as SLabel]
                            } as SNode,
                            {
                                id: 'regular-node-2',
                                type: 'node:regular',
                                position: { x: 100, y: 80 }, // Explicit position - ignores layout
                                size: { width: 60, height: 25 },
                                children: [{
                                    id: 'regular-2-label',
                                    type: 'label:text',
                                    text: 'Fixed Pos'
                                } as SLabel]
                            } as SNode
                        ]
                    } as SNode,
                    // Right side: Layoutable nodes (respect parent layout)
                    {
                        id: 'layoutable-container',
                        type: 'node:demo-card',
                        size: { width: 240, height: 120 },
                        layout: 'vbox',
                        layoutOptions: {
                            paddingTop: 10,
                            paddingBottom: 10,
                            paddingLeft: 10,
                            paddingRight: 10,
                            hAlign: 'center',
                            vAlign: 'center'
                        },
                        children: [
                            {
                                id: 'layoutable-subtitle-title',
                                type: 'label:text',
                                text: 'Layoutable Nodes'
                            } as SLabel,
                            {
                                id: 'layoutable-subtitle',
                                type: 'label:text',
                                text: '(respect parent layout)'
                            } as SLabel,
                            {
                                id: 'layoutable-node-1',
                                type: 'node:basic', // Has layoutableChildFeature enabled
                                size: { width: 80, height: 25 },
                                children: [{
                                    id: 'layoutable-1-label',
                                    type: 'label:text',
                                    text: 'Auto Layout'
                                } as SLabel]
                            } as SNode,
                            {
                                id: 'layoutable-node-2',
                                type: 'node:basic', // Has layoutableChildFeature enabled
                                size: { width: 80, height: 25 },
                                children: [{
                                    id: 'layoutable-2-label',
                                    type: 'label:text',
                                    text: 'Auto Layout'
                                } as SLabel]
                            } as SNode
                        ]
                    } as SNode
                ]
            } as SCompartment
        ]
    } as SNode;
}

function setupInteractiveControls(modelSource: LocalModelSource) {
    // Layout type controls
    const layoutRadios = document.querySelectorAll('input[name="layout"]');
    layoutRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                updateInteractiveCard(modelSource, { layout: target.value as 'vbox' | 'hbox' | 'stack' });
            }
        });
    });

    // Alignment controls
    const hAlignRadios = document.querySelectorAll('input[name="hAlign"]');
    hAlignRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                updateInteractiveCard(modelSource, { hAlign: target.value as 'left' | 'center' | 'right' });
            }
        });
    });

    const vAlignRadios = document.querySelectorAll('input[name="vAlign"]');
    vAlignRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                updateInteractiveCard(modelSource, { vAlign: target.value as 'top' | 'center' | 'bottom' });
            }
        });
    });

    // Padding controls
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(property => {
        const input = document.getElementById(property) as HTMLInputElement;
        if (input) {
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const value = parseInt(target.value);
                updateInteractiveCard(modelSource, { [property]: value });
            });
        }
    });

    // Size controls
    ['minWidth', 'minHeight'].forEach(property => {
        const input = document.getElementById(property) as HTMLInputElement;
        if (input) {
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const value = parseInt(target.value);
                updateInteractiveCard(modelSource, { [property]: value });
            });
        }
    });

    // Resize container checkbox
    const resizeCheckbox = document.getElementById('resizeContainer') as HTMLInputElement;
    if (resizeCheckbox) {
        resizeCheckbox.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            updateInteractiveCard(modelSource, { resizeContainer: target.checked });
        });
    }

    // Preset buttons
    document.getElementById('preset-card')?.addEventListener('click', () => {
        applyPreset(modelSource, 'card');
    });

    document.getElementById('preset-dashboard')?.addEventListener('click', () => {
        applyPreset(modelSource, 'dashboard');
    });

    document.getElementById('preset-menu')?.addEventListener('click', () => {
        applyPreset(modelSource, 'menu');
    });

    document.getElementById('reset-defaults')?.addEventListener('click', () => {
        applyPreset(modelSource, 'default');
    });
}

function updateInteractiveCard(modelSource: LocalModelSource, updates: any) {
    const model = modelSource.model;
    const card = model.children?.find(child => child.id === 'interactive-card') as any;

    if (card) {
        // Update layout property
        if (updates.layout) {
            card.layout = updates.layout;
        }

        // Update layout options
        if (card.layoutOptions) {
            Object.assign(card.layoutOptions, updates);
        }

        // Update the model to trigger re-rendering
        modelSource.updateModel(model);
    }
}

function applyPreset(modelSource: LocalModelSource, preset: string) {
    const presets = {
        default: {
            layout: 'vbox',
            hAlign: 'center',
            vAlign: 'center',
            paddingTop: 10,
            paddingRight: 15,
            paddingBottom: 10,
            paddingLeft: 15,
            minWidth: 150,
            minHeight: 100,
            resizeContainer: true
        },
        card: {
            layout: 'vbox',
            hAlign: 'center',
            vAlign: 'top',
            paddingTop: 15,
            paddingRight: 20,
            paddingBottom: 15,
            paddingLeft: 20,
            minWidth: 180,
            minHeight: 120,
            resizeContainer: true
        },
        dashboard: {
            layout: 'hbox',
            hAlign: 'left',
            vAlign: 'center',
            paddingTop: 8,
            paddingRight: 12,
            paddingBottom: 8,
            paddingLeft: 12,
            minWidth: 200,
            minHeight: 60,
            resizeContainer: true
        },
        menu: {
            layout: 'hbox',
            hAlign: 'left',
            vAlign: 'center',
            paddingTop: 5,
            paddingRight: 10,
            paddingBottom: 5,
            paddingLeft: 10,
            minWidth: 120,
            minHeight: 40,
            resizeContainer: true
        }
    };

    const presetConfig = presets[preset as keyof typeof presets];
    if (presetConfig) {
        updateInteractiveCard(modelSource, presetConfig);
        updateControlsFromPreset(presetConfig);
    }
}

function updateControlsFromPreset(preset: any) {
    // Update radio buttons and inputs to reflect the preset values
    Object.keys(preset).forEach(key => {
        const value = preset[key];

        if (key === 'layout' || key === 'hAlign' || key === 'vAlign') {
            const radio = document.querySelector(`input[name="${key}"][value="${value}"]`) as HTMLInputElement;
            if (radio) radio.checked = true;
        } else if (typeof value === 'number') {
            const input = document.getElementById(key) as HTMLInputElement;
            if (input) input.value = value.toString();
        } else if (typeof value === 'boolean') {
            const checkbox = document.getElementById(key) as HTMLInputElement;
            if (checkbox) checkbox.checked = value;
        }
    });
}
