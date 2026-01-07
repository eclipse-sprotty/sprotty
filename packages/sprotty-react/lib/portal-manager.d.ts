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
import { ReactPortalService } from './react-portal-service';
/**
 * Props for the PortalManager component.
 */
export interface PortalManagerProps {
    /** The ReactPortalService to read portal entries from */
    portalService: ReactPortalService;
    /** Whether to wrap rendered components in EventTrap (default: true) */
    useEventTrap?: boolean;
}
/**
 * Component that manages and renders all React Portals for diagram nodes.
 *
 * The PortalManager subscribes to the ReactPortalService and renders a
 * React Portal for each registered entry. This enables React components
 * to be rendered within Sprotty's SVG diagram while maintaining their
 * position in the React component tree (and thus Context access).
 *
 * Key features:
 * - Subscribes to ReactPortalService for portal registry changes
 * - Creates React Portals targeting foreignObject DOM nodes
 * - Optionally wraps components in EventTrap to prevent Sprotty conflicts
 * - Uses React.memo for performance optimization
 *
 * @example
 * ```tsx
 * // Inside SprottyDiagram
 * <PortalManager portalService={portalService} />
 * ```
 */
export declare const PortalManager: React.FC<PortalManagerProps>;
//# sourceMappingURL=portal-manager.d.ts.map