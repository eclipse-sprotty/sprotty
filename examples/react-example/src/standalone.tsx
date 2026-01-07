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

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { TYPES, LocalModelSource } from 'sprotty';
import { FitToScreenAction } from 'sprotty-protocol';
import { SprottyDiagram } from 'sprotty-react';
import { createContainer } from './di.config';
import { createInitialModel } from './model';
import { ThemeProvider, ThemeToggleButton } from './theme';

/**
 * App component that provides theme context to both the toggle and diagram.
 */
interface AppProps {
    container: ReturnType<typeof createContainer>;
    initialModel: ReturnType<typeof createInitialModel>;
}

const App: React.FC<AppProps> = ({ container, initialModel }) => {
    const hasInitialFitRef = React.useRef(false);

    const handleModelChange = React.useCallback((model: any) => {
        console.log('Model changed:', model.id);

        // Fit to screen on initial load
        if (!hasInitialFitRef.current) {
            hasInitialFitRef.current = true;
            const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
            // Use setTimeout to ensure canvas bounds are initialized
            setTimeout(() => {
                modelSource.actionDispatcher.dispatch(FitToScreenAction.create([], { padding: 10 }));
            }, 100);
        }
    }, [container]);

    return (
        <ThemeProvider defaultTheme="dark">
            <ThemeTogglePortal />
            <SprottyDiagram
                container={container}
                initialModel={initialModel}
                onModelChange={handleModelChange}
            />
        </ThemeProvider>
    );
};

/**
 * Portal component that renders the theme toggle button in the page header.
 */
const ThemeTogglePortal: React.FC = () => {
    const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        // Create a container for the toggle button in the page header
        const header = document.querySelector('.page-header');
        if (header) {
            let toggleContainer = document.getElementById('theme-toggle-container');
            if (!toggleContainer) {
                toggleContainer = document.createElement('div');
                toggleContainer.id = 'theme-toggle-container';
                header.appendChild(toggleContainer);
            }
            setPortalContainer(toggleContainer);
        }
    }, []);

    if (!portalContainer) {
        return null;
    }

    return createPortal(
        <ThemeToggleButton />,
        portalContainer
    );
};

/**
 * Initialize and render the React example.
 */
export default function runReactExample(): void {
    // Create the Inversify container
    const container = createContainer();

    // Get the root element
    const rootElement = document.getElementById('sprotty-container');
    if (!rootElement) {
        console.error('Root element #sprotty-container not found');
        return;
    }

    // Get the model source
    const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);

    // Create the initial model
    const initialModel = createInitialModel();

    // Create React root and render
    const root = createRoot(rootElement);

    root.render(
        <App container={container} initialModel={initialModel} />
    );

    // Store references for debugging
    (window as any).sprottyContainer = container;
    (window as any).modelSource = modelSource;
}

