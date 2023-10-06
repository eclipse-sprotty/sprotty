/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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

import { SModelElementImpl } from '../../base/model/smodel';
import { SShapeElementImpl, boundsFeature } from '../bounds/model';
import { hoverFeedbackFeature, popupFeature } from '../hover/model';

export const decorationFeature = Symbol('decorationFeature');

/**
 * Feature extension interface for {@link decorationFeature}.
 */
export interface Decoration {
}

export function isDecoration<T extends SModelElementImpl>(e: T): e is T & Decoration {
    return e.hasFeature(decorationFeature);
}

export class SDecoration extends SShapeElementImpl implements Decoration {
    static readonly DEFAULT_FEATURES = [decorationFeature, boundsFeature, hoverFeedbackFeature, popupFeature];
}

export type SIssueSeverity = 'error' | 'warning' | 'info';

export class SIssueMarker extends SDecoration {
    issues: SIssue[];
}

export class SIssue {
    message: string;
    severity: SIssueSeverity;
}
