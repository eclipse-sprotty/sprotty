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

import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'inversify';
import { VNode } from 'snabbdom';
import {
    RenderingContext,
    ViewRegistry,
    SModelElementImpl
} from 'sprotty';
import defaultModule from 'sprotty/lib/base/di.config';
import { ReactHostView, ReactComponentRegistry, hasSize } from './react-host-view';
import { ReactPortalService, ReactNodeProps } from './react-portal-service';
import { REACT_TYPES } from './types';
import { SReactNode } from './react-model';
import * as React from 'react';

// Mock React component for testing
const MockComponent: React.FC<ReactNodeProps> = ({ model }) => {
    return React.createElement('div', null, model.id);
};

// Create a minimal rendering context
function createMockContext(): RenderingContext {
    return {
        viewRegistry: {} as ViewRegistry,
        targetKind: 'main',
        decorate: (vnode: VNode, _element: any) => vnode,
        renderElement: (_element: any) => undefined,
        renderChildren: (_element: any) => []
    };
}

describe('ReactHostView', () => {
    let container: Container;
    let view: ReactHostView;

    beforeEach(() => {
        container = new Container();
        container.load(defaultModule);

        // Bind portal service
        container.bind(REACT_TYPES.ReactPortalService).to(ReactPortalService).inSingletonScope();

        // Bind component registry with mock component
        container.bind(REACT_TYPES.ReactComponentRegistration).toConstantValue({
            type: 'react:node',
            component: MockComponent
        });
        container.bind(REACT_TYPES.ReactComponentRegistry).to(ReactComponentRegistry).inSingletonScope();

        // Bind and get the view
        container.bind(ReactHostView).toSelf();
        view = container.get(ReactHostView);
    });

    describe('render', () => {
        it('should return undefined if not visible', () => {
            const model = new SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 100, height: 50 };

            // Create a mock context that makes the element invisible
            const context = createMockContext();
            vi.spyOn(view, 'isVisible').mockReturnValue(false);

            const result = view.render(model, context);
            expect(result).toBeUndefined();
        });

        it('should return undefined if no component is registered', () => {
            const model = new SReactNode();
            model.id = 'node1';
            model.type = 'unregistered:type';
            model.size = { width: 100, height: 50 };

            const context = createMockContext();
            // Mock isVisible to return true so we can test component lookup
            vi.spyOn(view, 'isVisible').mockReturnValue(true);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = view.render(model, context);

            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('No React component registered')
            );
        });

        it('should render a VNode with foreignObject structure', () => {
            const model = new SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 150, height: 80 };

            const context = createMockContext();
            // Mock isVisible to return true
            vi.spyOn(view, 'isVisible').mockReturnValue(true);

            const result = view.render(model, context);

            expect(result).toBeDefined();
            expect(result?.sel).toBe('g');
            expect(result?.children).toHaveLength(1);

            const foreignObject = result?.children?.[0] as VNode;
            expect(foreignObject.sel).toBe('foreignObject');
            expect(foreignObject.data?.attrs?.width).toBe(150);
            expect(foreignObject.data?.attrs?.height).toBe(80);
        });

        it('should use default size if model has no size', () => {
            // Create model without size property set
            const model = new SModelElementImpl();
            model.id = 'node1';
            model.type = 'react:node';

            const context = createMockContext();
            // Mock isVisible to return true
            vi.spyOn(view, 'isVisible').mockReturnValue(true);

            const result = view.render(model, context);

            const foreignObject = result?.children?.[0] as VNode;
            expect(foreignObject.data?.attrs?.width).toBe(100); // default
            expect(foreignObject.data?.attrs?.height).toBe(50); // default
        });

        it('should add lifecycle hooks to the inner div', () => {
            const model = new SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 100, height: 50 };

            const context = createMockContext();
            // Mock isVisible to return true
            vi.spyOn(view, 'isVisible').mockReturnValue(true);

            const result = view.render(model, context);

            const foreignObject = result?.children?.[0] as VNode;
            const div = foreignObject?.children?.[0] as VNode;

            expect(div.data?.hook?.insert).toBeDefined();
            expect(div.data?.hook?.update).toBeDefined();
            expect(div.data?.hook?.destroy).toBeDefined();
        });

        it('should set selected class when model is selected', () => {
            const model = new SReactNode();
            model.id = 'node1';
            model.type = 'react:node';
            model.size = { width: 100, height: 50 };
            (model as any).selected = true;

            const context = createMockContext();
            // Mock isVisible to return true
            vi.spyOn(view, 'isVisible').mockReturnValue(true);

            const result = view.render(model, context);

            const foreignObject = result?.children?.[0] as VNode;
            const div = foreignObject?.children?.[0] as VNode;

            expect(div.data?.class?.selected).toBe(true);
        });
    });

    describe('hasSize', () => {
        it('should return true for model with size', () => {
            const model = new SReactNode();
            model.size = { width: 100, height: 50 };

            expect(hasSize(model)).toBe(true);
        });

        it('should return false for model without size property', () => {
            // SModelElementImpl doesn't have a size property by default
            const model = new SModelElementImpl();
            model.id = 'test';

            expect(hasSize(model)).toBe(false);
        });

        it('should return false for invalid size', () => {
            const model = { size: { width: 'invalid' } } as any;
            expect(hasSize(model)).toBe(false);

            const model2 = { size: 'not-an-object' } as any;
            expect(hasSize(model2)).toBe(false);
        });
    });
});

describe('ReactComponentRegistry', () => {
    let registry: ReactComponentRegistry;

    beforeEach(() => {
        registry = new ReactComponentRegistry([]);
    });

    it('should register components', () => {
        registry.register('test:type', MockComponent);
        expect(registry.has('test:type')).toBe(true);
        expect(registry.get('test:type')).toBe(MockComponent);
    });

    it('should return undefined for unregistered types', () => {
        expect(registry.has('unknown')).toBe(false);
        expect(registry.get('unknown')).toBeUndefined();
    });

    it('should initialize with provided registrations', () => {
        const registryWithInit = new ReactComponentRegistry([
            { type: 'node:a', component: MockComponent },
            { type: 'node:b', component: MockComponent }
        ]);

        expect(registryWithInit.has('node:a')).toBe(true);
        expect(registryWithInit.has('node:b')).toBe(true);
    });
});
