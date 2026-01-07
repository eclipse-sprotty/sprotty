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
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Available theme options.
 */
export type Theme = 'dark' | 'light';

/**
 * Theme context value interface.
 */
export interface ThemeContextValue {
    /** Current active theme */
    theme: Theme;
    /** Toggle between dark and light themes */
    toggleTheme: () => void;
    /** Set a specific theme */
    setTheme: (theme: Theme) => void;
}

/**
 * Theme context for accessing theme state throughout the application.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Props for the ThemeProvider component.
 */
export interface ThemeProviderProps {
    children: React.ReactNode;
    /** Initial theme (defaults to 'dark') */
    defaultTheme?: Theme;
}

/**
 * ThemeProvider component that manages theme state and applies it to the document.
 *
 * This provider sets a `data-theme` attribute on the document's root element,
 * allowing CSS to respond to theme changes via attribute selectors.
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="dark">
 *     <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    defaultTheme = 'dark'
}) => {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);

    // Apply theme to document root element
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Set initial theme on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', defaultTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState(current => current === 'dark' ? 'light' : 'dark');
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    const value: ThemeContextValue = {
        theme,
        toggleTheme,
        setTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

ThemeProvider.displayName = 'ThemeProvider';

/**
 * Default theme context value used when not inside a ThemeProvider.
 * This allows components to render for measurement (hidden rendering) without errors.
 */
const defaultThemeContext: ThemeContextValue = {
    theme: 'dark',
    toggleTheme: () => {},
    setTheme: () => {}
};

/**
 * Hook to access the current theme and theme controls.
 *
 * When used outside a ThemeProvider (e.g., during hidden rendering for bounds measurement),
 * returns a default context with 'dark' theme and no-op functions.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *     const { theme, toggleTheme } = useTheme();
 *
 *     return (
 *         <button onClick={toggleTheme}>
 *             Current: {theme}
 *         </button>
 *     );
 * };
 * ```
 *
 * @returns The theme context value with current theme and control functions
 */
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    // Return default context when not in a ThemeProvider (e.g., during hidden rendering)
    return context ?? defaultThemeContext;
}

/**
 * Theme toggle button component.
 *
 * Renders a button that toggles between dark and light themes.
 */
export const ThemeToggleButton: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
};

ThemeToggleButton.displayName = 'ThemeToggleButton';
