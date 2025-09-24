"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sprotty_1 = require("sprotty");
const sprotty_protocol_1 = require("sprotty-protocol");
const di_config_1 = __importDefault(require("./di.config"));
async function runCustomViewsShowcase() {
    console.log('Starting Custom Views Showcase...');
    const container = (0, di_config_1.default)();
    console.log('Container created');
    const modelSource = container.get(sprotty_1.TYPES.ModelSource);
    const dispatcher = container.get(sprotty_1.TYPES.IActionDispatcher);
    console.log('Services retrieved');
    // Create sample data demonstrating all view types
    const sampleModel = {
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
                    }
                ]
            },
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
                    }
                ]
            },
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
                    }
                ]
            },
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
                    }
                ]
            },
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
                    }
                ]
            },
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
                    }
                ]
            },
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
                    }
                ]
            },
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
                    }
                ]
            },
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
                    }
                ]
            },
            // Stateful nodes row
            {
                type: 'node:stateful',
                id: 'stateful1',
                position: { x: 50, y: 450 },
                size: { width: 120, height: 60 },
                state: 'idle',
                message: 'Ready to start'
            },
            {
                type: 'node:stateful',
                id: 'stateful2',
                position: { x: 200, y: 450 },
                size: { width: 120, height: 60 },
                state: 'loading',
                progress: 65,
                message: 'Processing...'
            },
            {
                type: 'node:stateful',
                id: 'stateful3',
                position: { x: 350, y: 450 },
                size: { width: 120, height: 60 },
                state: 'success',
                message: 'Completed!'
            },
            {
                type: 'node:stateful',
                id: 'stateful4',
                position: { x: 500, y: 450 },
                size: { width: 120, height: 60 },
                state: 'error',
                message: 'Failed to connect'
            },
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
            },
            {
                type: 'edge:styled',
                id: 'edge2',
                sourceId: 'triangle1',
                targetId: 'enhanced2',
                style: 'dashed',
                thickness: 3,
                color: '#f57c00',
                animated: false
            },
            {
                type: 'edge:styled',
                id: 'edge3',
                sourceId: 'diamond1',
                targetId: 'enhanced3',
                style: 'dotted',
                thickness: 2,
                color: '#d32f2f',
                animated: true
            },
            {
                type: 'edge:styled',
                id: 'edge4',
                sourceId: 'complex1',
                targetId: 'complex2',
                style: 'solid',
                thickness: 4,
                color: '#388e3c',
                animated: false
            },
            {
                type: 'edge:styled',
                id: 'edge5',
                sourceId: 'enhanced1',
                targetId: 'stateful2',
                style: 'dashed',
                thickness: 2,
                color: '#7b1fa2',
                animated: true
            }
        ]
    };
    // Initialize the model
    modelSource.setModel(sampleModel);
    // Fit the diagram to screen with padding after a short delay to ensure rendering is complete
    setTimeout(() => {
        dispatcher.dispatch(sprotty_protocol_1.FitToScreenAction.create([], { padding: 20 }));
    }, 100);
    console.log('Model set with', sampleModel.children.length, 'children');
    console.log('Container div:', document.getElementById('sprotty-custom-views'));
    // Add some interactivity for demonstration
    let loadingProgress = 65;
    setInterval(() => {
        var _a;
        // Update the loading node progress
        loadingProgress = (loadingProgress + 5) % 100;
        const currentModel = modelSource.model;
        const loadingNode = (_a = currentModel.children) === null || _a === void 0 ? void 0 : _a.find((child) => child.id === 'stateful2');
        if (loadingNode) {
            loadingNode.progress = loadingProgress;
            loadingNode.message = `Processing... ${loadingProgress}%`;
            // Change state when progress reaches 100
            if (loadingProgress === 0) {
                loadingNode.state = 'success';
                loadingNode.message = 'Processing complete!';
            }
            else if (loadingProgress >= 95) {
                loadingNode.state = 'loading';
            }
        }
        modelSource.updateModel(currentModel);
    }, 200);
    console.log('Custom Views Showcase loaded successfully!');
    console.log('This example demonstrates:');
    console.log('- Basic custom views (circle, triangle, diamond shapes)');
    console.log('- Enhanced views with decorations and status indicators');
    console.log('- Complex compositional views with headers and footers');
    console.log('- Stateful views with conditional rendering');
    console.log('- Custom edge views with different styles and animations');
    console.log('- Custom label views with backgrounds and borders');
}
exports.default = runCustomViewsShowcase;
//# sourceMappingURL=standalone.js.map