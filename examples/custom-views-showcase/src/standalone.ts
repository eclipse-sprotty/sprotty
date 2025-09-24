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
import { SGraph, SNode, SEdge, SLabel, FitToScreenAction } from 'sprotty-protocol';
import createContainer from './di.config';

export default async function runCustomViewsShowcase() {
    console.log('Starting Custom Views Showcase...');

    const container = createContainer();
    console.log('Container created');

    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
    const dispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    console.log('Services retrieved');

    // Create sample data demonstrating all view types
    const sampleModel: SGraph = {
        type: 'graph',
        id: 'custom-views-demo',
        children: [
            // Basic shapes row
            {
                type: 'node:basic-circle',
                id: 'circle1',
                position: { x: 50, y: 50 },
                size: { width: 80, height: 80 },
                shape: 'circle',
                color: '#e3f2fd',
                children: [
                    {
                        type: 'label:custom',
                        id: 'circle1-label',
                        text: 'Circle',
                        position: { x: 40, y: 45 },
                        fontSize: 12
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:basic-triangle',
                id: 'triangle1',
                position: { x: 180, y: 50 },
                size: { width: 80, height: 80 },
                shape: 'triangle',
                color: '#fce4ec',
                children: [
                    {
                        type: 'label:custom',
                        id: 'triangle1-label',
                        text: 'Triangle',
                        position: { x: 40, y: 60 },
                        fontSize: 12
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:basic-diamond',
                id: 'diamond1',
                position: { x: 310, y: 50 },
                size: { width: 80, height: 80 },
                shape: 'diamond',
                color: '#e8f5e8',
                children: [
                    {
                        type: 'label:custom',
                        id: 'diamond1-label',
                        text: 'Diamond',
                        position: { x: 40, y: 45 },
                        fontSize: 12
                    } as SLabel
                ]
            } as SNode,

            // Enhanced nodes row
            {
                type: 'node:enhanced',
                id: 'enhanced1',
                position: { x: 50, y: 180 },
                size: { width: 100, height: 60 },
                status: 'normal',
                showBorder: false,
                cornerRadius: 5,
                children: [
                    {
                        type: 'label:custom',
                        id: 'enhanced1-label',
                        text: 'Normal',
                        position: { x: 50, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:enhanced',
                id: 'enhanced2',
                position: { x: 180, y: 180 },
                size: { width: 100, height: 60 },
                status: 'warning',
                showBorder: true,
                cornerRadius: 8,
                children: [
                    {
                        type: 'label:custom',
                        id: 'enhanced2-label',
                        text: 'Warning',
                        position: { x: 50, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:enhanced',
                id: 'enhanced3',
                position: { x: 310, y: 180 },
                size: { width: 100, height: 60 },
                status: 'error',
                showBorder: true,
                cornerRadius: 0,
                children: [
                    {
                        type: 'label:custom',
                        id: 'enhanced3-label',
                        text: 'Error',
                        position: { x: 50, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:enhanced',
                id: 'enhanced4',
                position: { x: 440, y: 180 },
                size: { width: 100, height: 60 },
                status: 'success',
                showBorder: true,
                cornerRadius: 15,
                children: [
                    {
                        type: 'label:custom',
                        id: 'enhanced4-label',
                        text: 'Success',
                        position: { x: 50, y: 35 },
                        fontSize: 14
                    } as SLabel
                ]
            } as SNode,

            // Complex nodes row
            {
                type: 'node:complex',
                id: 'complex1',
                position: { x: 50, y: 310 },
                size: { width: 150, height: 100 },
                title: 'Server Node',
                subtitle: 'Production',
                icon: '🖥️',
                showHeader: true,
                showFooter: true,
                headerColor: '#1976d2',
                children: [
                    {
                        type: 'label:custom',
                        id: 'complex1-body-label',
                        text: 'Status: Online',
                        position: { x: 75, y: 60 },
                        fontSize: 12,
                        backgroundColor: '#f5f5f5',
                        borderColor: '#ddd'
                    } as SLabel
                ]
            } as SNode,

            {
                type: 'node:complex',
                id: 'complex2',
                position: { x: 230, y: 310 },
                size: { width: 150, height: 100 },
                title: 'Database',
                icon: '🗄️',
                showHeader: true,
                showFooter: false,
                headerColor: '#388e3c',
                children: [
                    {
                        type: 'label:custom',
                        id: 'complex2-body-label',
                        text: 'Connections: 42',
                        position: { x: 75, y: 60 },
                        fontSize: 12
                    } as SLabel
                ]
            } as SNode,

            // Stateful nodes row
            {
                type: 'node:stateful',
                id: 'stateful1',
                position: { x: 50, y: 450 },
                size: { width: 120, height: 60 },
                state: 'idle',
                message: 'Ready to start'
            } as SNode,

            {
                type: 'node:stateful',
                id: 'stateful2',
                position: { x: 200, y: 450 },
                size: { width: 120, height: 60 },
                state: 'loading',
                progress: 65,
                message: 'Processing...'
            } as SNode,

            {
                type: 'node:stateful',
                id: 'stateful3',
                position: { x: 350, y: 450 },
                size: { width: 120, height: 60 },
                state: 'success',
                message: 'Completed!'
            } as SNode,

            {
                type: 'node:stateful',
                id: 'stateful4',
                position: { x: 500, y: 450 },
                size: { width: 140, height: 60 },
                state: 'error',
                message: 'Failed to connect'
            } as SNode,

            // Styled edges connecting various nodes
            {
                type: 'edge:styled',
                id: 'edge1',
                sourceId: 'circle1',
                targetId: 'enhanced1',
                style: 'solid',
                thickness: 2,
                color: '#1976d2',
                animated: false
            } as SEdge,

            {
                type: 'edge:styled',
                id: 'edge2',
                sourceId: 'triangle1',
                targetId: 'enhanced2',
                style: 'dashed',
                thickness: 3,
                color: '#f57c00',
                animated: false
            } as SEdge,

            {
                type: 'edge:styled',
                id: 'edge3',
                sourceId: 'diamond1',
                targetId: 'enhanced3',
                style: 'dotted',
                thickness: 2,
                color: '#d32f2f',
                animated: true
            } as SEdge,

            {
                type: 'edge:styled',
                id: 'edge4',
                sourceId: 'complex1',
                targetId: 'complex2',
                style: 'solid',
                thickness: 4,
                color: '#388e3c',
                animated: false
            } as SEdge
        ]
    };

    // Initialize the model
    modelSource.setModel(sampleModel);

    // Fit the diagram to screen with padding after a short delay to ensure rendering is complete
    setTimeout(() => {
        dispatcher.dispatch(FitToScreenAction.create([], { padding: 20 }));
    }, 100);

    console.log('Model set with', sampleModel.children.length, 'children');
    console.log('Container div:', document.getElementById('sprotty-custom-views'));

    // Note: Removed automatic progress animation to prevent infinite rendering loops
    // The stateful node demonstrates different states without dynamic updates

    console.log('Custom Views Showcase loaded successfully!');
    console.log('This example demonstrates:');
    console.log('- Basic custom views (circle, triangle, diamond shapes)');
    console.log('- Enhanced views with decorations and status indicators');
    console.log('- Complex compositional views with headers and footers');
    console.log('- Stateful views with conditional rendering');
    console.log('- Custom edge views with different styles and animations');
    console.log('- Custom label views with backgrounds and borders');
}
