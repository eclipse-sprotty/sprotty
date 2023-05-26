/********************************************************************************
 * Copyright (c) 2017-2018 TypeFox and others.
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

import { inject, injectable } from "inversify";
import {
    Action, generateRequestId, RequestAction, ResponseAction, ComputedBoundsAction as ProtocolComputedBoundsAction} from 'sprotty-protocol/lib/actions';
import * as protocol from "sprotty-protocol/lib/actions";
import { SModelRoot as SModelRootSchema } from 'sprotty-protocol/lib/model';
import { Bounds, Dimension, Point } from "sprotty-protocol/lib/utils/geometry";
import { CommandExecutionContext, CommandResult, CommandReturn, HiddenCommand, SystemCommand } from "../../base/commands/command";
import { SModelElementImpl } from "../../base/model/smodel";
import { TYPES } from "../../base/types";
import { Alignable, BoundsAware, isBoundsAware } from './model';

export interface ResolvedElementAndBounds {
    element: SModelElementImpl & BoundsAware
    oldBounds: Bounds
    newPosition?: Point
    newSize: Dimension
}

export interface ResolvedElementAndAlignment {
    element: SModelElementImpl & Alignable
    oldAlignment: Point
    newAlignment: Point
}

@injectable()
export class SetBoundsCommand extends SystemCommand {
    static readonly KIND: string = protocol.SetBoundsAction.KIND;

    protected bounds: ResolvedElementAndBounds[] = [];

    constructor(@inject(TYPES.Action) protected readonly action: protocol.SetBoundsAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.action.bounds.forEach(
            b => {
                const element = context.root.index.getById(b.elementId);
                if (element && isBoundsAware(element)) {
                    this.bounds.push({
                        element: element,
                        oldBounds: element.bounds,
                        newPosition: b.newPosition,
                        newSize: b.newSize
                    });
                }
            }
        );
        return this.redo(context);
    }

    undo(context: CommandExecutionContext): CommandReturn {
        this.bounds.forEach(
            b => b.element.bounds = b.oldBounds
        );
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        this.bounds.forEach(
            b => {
                if (b.newPosition)
                    b.element.bounds = {
                        ...b.newPosition,
                        ...b.newSize,
                    };
                else
                    // keep the position
                    b.element.bounds = {
                        x: b.element.bounds.x,
                        y: b.element.bounds.y,
                        ...b.newSize
                    };
            }
        );
        return context.root;
    }
}

@injectable()
export class RequestBoundsCommand extends HiddenCommand {
    static readonly KIND: string = protocol.RequestBoundsAction.KIND;

    constructor(@inject(TYPES.Action) protected action: protocol.RequestBoundsAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        return {
            model: context.modelFactory.createRoot(this.action.newRoot),
            modelChanged: true,
            cause: this.action
        };
    }

    get blockUntil(): (action: Action) => boolean {
        return action => action.kind === ProtocolComputedBoundsAction.KIND;
    }
}

// Compatibility deprecation layer (will be removed with the graduation 1.0.0 release)

/**
 * Sent from the model source (e.g. a DiagramServer) to the client to update the bounds of some
 * (or all) model elements.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class SetBoundsAction implements Action, protocol.SetBoundsAction {
    static readonly KIND = 'setBounds';
    readonly kind = SetBoundsAction.KIND;

    constructor(public readonly bounds: ElementAndBounds[]) {
    }
}

/**
 * Sent from the model source to the client to request bounds for the given model. The model is
 * rendered invisibly so the bounds can derived from the DOM. The response is a ComputedBoundsAction.
 * This hidden rendering round-trip is necessary if the client is responsible for parts of the layout
 * (see `needsClientLayout` viewer option).
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class RequestBoundsAction implements RequestAction<ComputedBoundsAction>, protocol.RequestBoundsAction {
    static readonly KIND = 'requestBounds';
    readonly kind = RequestBoundsAction.KIND;

    constructor(public readonly newRoot: SModelRootSchema,
        public readonly requestId: string = '') { }

    /** Factory function to dispatch a request with the `IActionDispatcher` */
    static create(newRoot: SModelRootSchema): RequestAction<ComputedBoundsAction> {
        return new RequestBoundsAction(newRoot, generateRequestId());
    }
}

/**
 * Sent from the client to the model source (e.g. a DiagramServer) to transmit the result of bounds
 * computation as a response to a RequestBoundsAction. If the server is responsible for parts of
 * the layout (see `needsServerLayout` viewer option), it can do so after applying the computed bounds
 * received with this action. Otherwise there is no need to send the computed bounds to the server,
 * so they can be processed locally by the client.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class ComputedBoundsAction implements ResponseAction, protocol.ComputedBoundsAction {
    static readonly KIND = 'computedBounds';
    readonly kind = ComputedBoundsAction.KIND;

    constructor(public readonly bounds: ElementAndBounds[],
        public readonly revision?: number,
        public readonly alignments?: ElementAndAlignment[],
        public readonly responseId = '') { }
}

/**
 * Associates new bounds with a model element, which is referenced via its id.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export interface ElementAndBounds extends protocol.ElementAndBounds {
    elementId: string
    newPosition?: Point
    newSize: Dimension
}

/**
 * Associates a new alignment with a model element, which is referenced via its id.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export interface ElementAndAlignment extends protocol.ElementAndAlignment{
    elementId: string
    newAlignment: Point
}

/**
 * Request a layout of the diagram or the selected elements only.
 *
 * @deprecated Use the declaration from `sprotty-protocol` instead.
 */
export class LayoutAction implements Action, protocol.LayoutAction {
    static readonly KIND = 'layout';
    readonly kind = LayoutAction.KIND;

    layoutType: string;
    elementIds: string[];
}
