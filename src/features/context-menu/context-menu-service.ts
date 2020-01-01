/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
import { LabeledAction } from "../../base/actions/action";

export interface MenuItem extends LabeledAction {
    /** Technical id of the menu item. */
    readonly id: string;
    /** String indicating the order. */
    readonly sortString?: string;
    /** String indicating the grouping (separators). Items with equal group will be in the same group. */
    readonly group?: string;
    /**
     * The optional parent id can be used to add this element as a child of another element provided by anohter menu provider.
     * The `parentId` must be fully qualified in the form of `a.b.c`, whereas `a`, `b` and `c` are referring to the IDs of other elements.
     * Note that this attribute will only be considered for root items of a provider and not for children of provided items.
     */
    readonly parentId?: string;
    /** Function determining whether the element is enabled. */
    readonly isEnabled?: () => boolean;
    /** Function determining whether the element is visible. */
    readonly isVisible?: () => boolean;
    /** Function determining whether the element is toggled on or off. */
    readonly isToggled?: () => boolean;
    /** Children of this item. If this item has children, they will be added into a submenu of this item. */
    children?: MenuItem[];
}

export type Anchor = MouseEvent | { x: number, y: number };

export function toAnchor(anchor: HTMLElement | { x: number, y: number }): Anchor {
    return anchor instanceof HTMLElement ? { x: anchor.offsetLeft, y: anchor.offsetTop } : anchor;
}

export interface IContextMenuService {
    show(items: MenuItem[], anchor: Anchor, onHide?: () => void): void;
}

export type IContextMenuServiceProvider = () => Promise<IContextMenuService>;
