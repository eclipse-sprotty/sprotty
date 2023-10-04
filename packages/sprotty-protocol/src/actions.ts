/********************************************************************************
 * Copyright (c) 2021 TypeFox and others.
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

import { SModelRoot, SModelElement, Viewport } from './model';
import { Bounds, Point, Dimension } from './utils/geometry';
import { JsonAny, JsonMap } from './utils/json';
import { hasOwnProperty } from './utils/object';

/**
 * Wrapper for actions when transferring them between client and server.
 * The `clientId` is used to identify the specific diagram instance in the client.
 */
export interface ActionMessage {
    clientId: string
    action: Action
}

export function isActionMessage(object: unknown): object is ActionMessage {
    return hasOwnProperty(object, 'action');
}

/**
 * An action describes a change to the model declaratively.
 * It is a plain data structure, and as such transferable between server and client.
 */
export interface Action {
    kind: string;
}

export function isAction(object?: unknown): object is Action {
    return hasOwnProperty<string, string>(object, 'kind', 'string');
}

/**
 * A request action is tied to the expectation of receiving a corresponding response action.
 * The `requestId` property is used to match the received response with the original request.
 */
export interface RequestAction<Res extends ResponseAction> extends Action {
    requestId: string

    /**
     * Used to ensure correct typing. Clients must not use this property
     */
    readonly _?: Res;
}

export function isRequestAction(object?: Action): object is RequestAction<ResponseAction> {
    return hasOwnProperty<string, string>(object, 'requestId', 'string');
}

let requestContext = '';
let nextRequestId = 1;
/**
 * Generate a unique `requestId` for a request action.
 */
export function generateRequestId(): string {
    return `${requestContext}_${nextRequestId++}`;
}

/**
 * Configure the context in which request actions are created. This is typically either
 * 'client' or 'server' to avoid collisions of request IDs.
 */
export function setRequestContext(context: string): void {
    requestContext = context;
}

/**
 * A response action is sent to respond to a request action. The `responseId` must match
 * the `requestId` of the preceding request. In case the `responseId` is empty or undefined,
 * the action is handled as standalone, i.e. it was fired without a preceding request.
 */
export interface ResponseAction extends Action {
    responseId: string;
}

/**
 * A response action is sent to respond to a request action. The `responseId` must match
 * the `requestId` of the preceding request. In case the `responseId` is empty or undefined,
 * the action is handled as standalone, i.e. it was fired without a preceding request.
 */

export function isResponseAction(object?: Action): object is ResponseAction {
    return hasOwnProperty<string, string>(object, 'responseId', 'string') && object.responseId !== '';
}

/**
 * A reject action is fired to indicate that a request must be rejected.
 */
export interface RejectAction extends ResponseAction {
    kind: typeof RejectAction.KIND
    message: string
    detail?: JsonAny
}
export namespace RejectAction {
    export const KIND = 'rejectRequest';

    export function create(options: { message: string, detail?: JsonAny, requestId: string }): RejectAction {
        return {
            kind: KIND,
            message: options.message,
            detail: options.detail,
            responseId: options.requestId
        };
    }
}

/**
 * Sent from the client to the model source (e.g. a DiagramServer) in order to request a model. Usually this
 * is the first message that is sent to the source, so it is also used to initiate the communication.
 * The response is a SetModelAction or an UpdateModelAction.
 */
export interface RequestModelAction extends RequestAction<SetModelAction> {
    kind: typeof RequestModelAction.KIND
    options?: JsonMap
}
export namespace RequestModelAction {
    export const KIND = 'requestModel';

    export function create(options?: JsonMap): RequestModelAction {
        return {
            kind: KIND,
            options,
            requestId: generateRequestId()
        };
    }
}

/**
 * Sent from the model source to the client in order to set the model. If a model is already present, it is replaced.
 */
export interface SetModelAction extends ResponseAction {
    kind: typeof SetModelAction.KIND
    newRoot: SModelRoot
}
export namespace SetModelAction {
    export const KIND = 'setModel';

    export function create(newRoot: SModelRoot, requestId: string = ''): SetModelAction {
        return {
            kind: KIND,
            newRoot,
            responseId: requestId
        };
    }
}

/**
 * Sent from the model source to the client in order to update the model. If no model is present yet,
 * this behaves the same as a SetModelAction. The transition from the old model to the new one can be animated.
 */
export interface UpdateModelAction {
    kind: typeof UpdateModelAction.KIND
    newRoot?: SModelRoot
    matches?: Match[]
    animate?: boolean
    cause?: Action
}
export namespace UpdateModelAction {
    export const KIND = 'updateModel';

    export function create(input: SModelRoot | Match[], options: { animate?: boolean, cause?: Action } = {}): UpdateModelAction {
        if (Array.isArray(input)) {
            return {
                kind: KIND,
                matches: input,
                animate: options.animate,
                cause: options.cause
            };
        } else {
            return {
                kind: KIND,
                newRoot: input,
                animate: options.animate,
                cause: options.cause
            };
        }
    }
}

export interface Match {
    left?: SModelElement
    right?: SModelElement
    leftParentId?: string
    rightParentId?: string
}

/**
 * Triggered when the user hovers the mouse pointer over an element to get a popup with details on
 * that element. This action is sent from the client to the model source, e.g. a DiagramServer.
 * The response is a SetPopupModelAction.
 */
export interface RequestPopupModelAction extends RequestAction<SetPopupModelAction> {
    kind: typeof RequestPopupModelAction.KIND
    elementId: string
    bounds: Bounds
}
export namespace RequestPopupModelAction {
    export const KIND = 'requestPopupModel';

    export function create(options: { elementId: string, bounds: Bounds }): RequestPopupModelAction {
        return {
            kind: KIND,
            elementId: options.elementId,
            bounds: options.bounds,
            requestId: generateRequestId()
        };
    }
}

/**
 * Sent from the model source to the client to display a popup in response to a RequestPopupModelAction.
 * This action can also be used to remove any existing popup by choosing EMPTY_ROOT as root element.
 */
export interface SetPopupModelAction extends ResponseAction {
    kind: typeof SetPopupModelAction.KIND
    newRoot: SModelRoot
}
export namespace SetPopupModelAction {
    export const KIND = 'setPopupModel';

    export function create(newRoot: SModelRoot, requestId: string = ''): SetPopupModelAction {
        return {
            kind: KIND,
            newRoot,
            responseId: requestId
        };
    }
}

/**
 * Sent from the model source (e.g. a DiagramServer) to the client to update the bounds of some
 * (or all) model elements.
 */
export interface SetBoundsAction extends Action {
    kind: typeof SetBoundsAction.KIND
    bounds: ElementAndBounds[]
}
export namespace SetBoundsAction {
    export const KIND = 'setBounds';

    export function create(bounds: ElementAndBounds[]): SetBoundsAction {
        return {
            kind: KIND,
            bounds
        };
    }
}

/**
 * Sent from the model source to the client to request bounds for the given model. The model is
 * rendered invisibly so the bounds can derived from the DOM. The response is a ComputedBoundsAction.
 * This hidden rendering round-trip is necessary if the client is responsible for parts of the layout
 * (see `needsClientLayout` viewer option).
 */
export interface RequestBoundsAction extends RequestAction<ComputedBoundsAction> {
    kind: typeof RequestBoundsAction.KIND
    newRoot: SModelRoot
}
export namespace RequestBoundsAction {
    export const KIND = 'requestBounds';

    export function create(newRoot: SModelRoot): RequestBoundsAction {
        return {
            kind: KIND,
            newRoot,
            requestId: generateRequestId()
        };
    }
}

/**
 * Sent from the client to the model source (e.g. a DiagramServer) to transmit the result of bounds
 * computation as a response to a RequestBoundsAction. If the server is responsible for parts of
 * the layout (see `needsServerLayout` viewer option), it can do so after applying the computed bounds
 * received with this action. Otherwise there is no need to send the computed bounds to the server,
 * so they can be processed locally by the client.
 */
export interface ComputedBoundsAction extends ResponseAction {
    kind: typeof ComputedBoundsAction.KIND
    bounds: ElementAndBounds[]
    revision?: number
    alignments?: ElementAndAlignment[]
}
export namespace ComputedBoundsAction {
    export const KIND = 'computedBounds';

    export function create(bounds: ElementAndBounds[], options: { revision?: number, alignments?: ElementAndAlignment[], requestId?: string } = {}): ComputedBoundsAction {
        return {
            kind: KIND,
            bounds,
            revision: options.revision,
            alignments: options.alignments,
            responseId: options.requestId ?? ''
        };
    }
}

/**
 * Associates new bounds with a model element, which is referenced via its id.
 */
export interface ElementAndBounds {
    elementId: string
    newPosition?: Point
    newSize: Dimension
}

/**
 * Associates a new alignment with a model element, which is referenced via its id.
 */
export interface ElementAndAlignment {
    elementId: string
    newAlignment: Point
}

/**
 * Transport logging data to be stored elsewhere.
 */
export interface LoggingAction extends Action {
    kind: typeof LoggingAction.KIND;
    severity: string
    time: string
    caller: string
    message: string
    params: string[]
}
export namespace LoggingAction {
    export const KIND = 'logging';

    export function create(options: { severity: string, time: string, caller: string, message: string, params: string[] }): LoggingAction {
        return {
            kind: KIND,
            ...options
        };
    }
}

/**
 * Triggered when the user changes the selection, e.g. by clicking on a selectable element. The resulting
 * SelectCommand changes the `selected` state accordingly, so the elements can be rendered differently.
 * This action is also forwarded to the diagram server, if present, so it may react on the selection change.
 * Furthermore, the server can send such an action to the client in order to change the selection programmatically.
 */
export interface SelectAction {
    kind: typeof SelectAction.KIND
    selectedElementsIDs: string[]
    deselectedElementsIDs: string[]
}
export namespace SelectAction {
    export const KIND = 'elementSelected';

    export function create(options: { selectedElementsIDs?: string[], deselectedElementsIDs?: string[] }): SelectAction {
        return {
            kind: KIND,
            selectedElementsIDs: options.selectedElementsIDs ?? [],
            deselectedElementsIDs: options.deselectedElementsIDs ?? []
        };
    }
}

/**
 * Programmatic action for selecting or deselecting all elements.
 * If `select` is true, all elements are selected, otherwise they are deselected.
 */
export interface SelectAllAction {
    kind: typeof SelectAllAction.KIND
    select: boolean
}
export namespace SelectAllAction {
    export const KIND = 'allSelected';

    export function create(options: { select?: boolean } = {}): SelectAllAction {
        return {
            kind: KIND,
            select: options.select ?? true
        };
    }
}

/**
 * Request action for retrieving the current selection.
 */
export interface GetSelectionAction extends RequestAction<SelectionResult> {
    kind: typeof GetSelectionAction.KIND
}
export namespace GetSelectionAction {
    export const KIND = 'getSelection';

    export function create(): GetSelectionAction {
        return {
            kind: KIND,
            requestId: generateRequestId()
        };
    }
}

/**
 * Result for a `GetSelectionAction`.
 */
export interface SelectionResult extends ResponseAction {
    kind: typeof SelectionResult.KIND
    selectedElementsIDs: string[]
}
export namespace SelectionResult {
    export const KIND = 'selectionResult';

    export function create(selectedElementsIDs: string[], requestId: string): SelectionResult {
        return {
            kind: KIND,
            selectedElementsIDs,
            responseId: requestId
        };
    }
}

/**
 * Sent from the client to the model source to recalculate a diagram when elements
 * are collapsed/expanded by the client.
 */
export interface CollapseExpandAction {
    kind: typeof CollapseExpandAction.KIND
    expandIds: string[]
    collapseIds: string[]
}
export namespace CollapseExpandAction {
    export const KIND = 'collapseExpand';

    export function create(options: { expandIds?: string[], collapseIds?: string[] }): CollapseExpandAction {
        return {
            kind: KIND,
            expandIds: options.expandIds ?? [],
            collapseIds: options.collapseIds ?? []
        };
    }
}

/**
 * Programmatic action for expanding or collapsing all elements.
 * If `expand` is true, all elements are expanded, otherwise they are collapsed.
 */
export interface CollapseExpandAllAction {
    kind: typeof CollapseExpandAllAction.KIND
    expand: boolean
}
export namespace CollapseExpandAllAction {
    export const KIND = 'collapseExpandAll';

    export function create(options: { expand?: boolean } = {}): CollapseExpandAllAction {
        return {
            kind: KIND,
            expand: options.expand ?? true
        };
    }
}

export interface OpenAction {
    kind: typeof OpenAction.KIND
    elementId: string
}
export namespace OpenAction {
    export const KIND = 'open';

    export function create(elementId: string): OpenAction {
        return {
            kind: KIND,
            elementId
        };
    }
}

/**
 * Request a layout of the diagram or the selected elements only.
 */
export interface LayoutAction {
    kind: typeof LayoutAction.KIND
    layoutType?: string
    elementIds?: string[]
}
export namespace LayoutAction {
    export const KIND = 'layout';

    export function create(options: { layoutType?: string, elementIds?: string[] } = {}): LayoutAction {
        return {
            kind: KIND,
            layoutType: options.layoutType,
            elementIds: options.elementIds
        };
    }
}

/**
 * Triggered when the user requests the viewer to center on the current model. The resulting
 * CenterCommand changes the scroll setting of the viewport accordingly.
 * It also resets the zoom to its default if retainZoom is false.
 * This action can also be sent from the model source to the client in order to perform such a
 * viewport change programmatically.
 */
export interface CenterAction extends Action {
    kind: typeof CenterAction.KIND
    elementIds: string[]
    animate: boolean
    retainZoom: boolean
    zoomScale?: number
}
export namespace CenterAction {
    export const KIND = 'center';

    export function create(elementIds: string[], options: { animate?: boolean, retainZoom?: boolean, zoomScale?: number } = {}): CenterAction {
        return {
            kind: KIND,
            elementIds,
            animate: options.animate ?? true,
            retainZoom: options.retainZoom ?? false,
            zoomScale: options.zoomScale
        };
    }
}

/**
 * Triggered when the user requests the viewer to fit its content to the available drawing area.
 * The resulting FitToScreenCommand changes the zoom and scroll settings of the viewport so the model
 * can be shown completely. This action can also be sent from the model source to the client in order
 * to perform such a viewport change programmatically.
 */
export interface FitToScreenAction extends Action {
    kind: typeof FitToScreenAction.KIND;
    elementIds: string[]
    padding?: number
    maxZoom?: number
    animate: boolean
}
export namespace FitToScreenAction {
    export const KIND = 'fit';

    export function create(elementIds: string[], options: { padding?: number, maxZoom?: number, animate?: boolean } = {}): FitToScreenAction {
        return {
            kind: KIND,
            elementIds,
            padding: options.padding,
            maxZoom: options.maxZoom,
            animate: options.animate ?? true
        };
    }
}

/**
 * Directly set the diagram viewport to the given scroll and zoom values.
 * The ID of the viewport element to manipulate must be given with the action
 * (usually it is the root element's ID).
 */
export interface SetViewportAction extends Action {
    kind: typeof SetViewportAction.KIND;
    elementId: string
    newViewport: Viewport
    animate: boolean
}
export namespace SetViewportAction {
    export const KIND = 'viewport';

    export function create(elementId: string, newViewport: Viewport, options: { animate?: boolean } = {}): SetViewportAction {
        return {
            kind: KIND,
            elementId,
            newViewport,
            animate: options.animate ?? true
        };
    }
}

/**
 * Request action for retrieving the current viewport and canvas bounds.
 */
export interface GetViewportAction extends RequestAction<ViewportResult> {
    kind: typeof GetViewportAction.KIND;
}
export namespace GetViewportAction {
    export const KIND = 'getViewport';

    export function create(): GetViewportAction {
        return {
            kind: KIND,
            requestId: generateRequestId()
        };
    }
}

/**
 * Response to a `GetViewportAction`.
 */
export interface ViewportResult extends ResponseAction {
    kind: typeof ViewportResult.KIND;
    viewport: Viewport
    canvasBounds: Bounds
}
export namespace ViewportResult {
    export const KIND = 'viewportResult';

    export function create(viewport: Viewport, canvasBounds: Bounds, requestId: string): ViewportResult {
        return {
            kind: KIND,
            viewport,
            canvasBounds,
            responseId: requestId
        };
    }
}

/**
 * Action to render the selected elements in front of others by manipulating the z-order.
 */
export interface BringToFrontAction extends Action {
    kind: typeof BringToFrontAction.KIND;
    elementIDs: string[]
}
export namespace BringToFrontAction {
    export const KIND = 'bringToFront';

    export function create(elementIDs: string[]): BringToFrontAction {
        return {
            kind: KIND,
            elementIDs
        };
    }
}

/**
 * Undo the previous operation on the stack of operations.
 */
export interface UndoAction extends Action {
    kind: typeof UndoAction.KIND;
}
export namespace UndoAction {
    export const KIND = 'undo';

    export function create(): UndoAction {
        return {
            kind: KIND
        };
    }
}

/**
 * Redo a previously undone operation.
 */
export interface RedoAction extends Action {
    kind: typeof RedoAction.KIND;
}
export namespace RedoAction {
    export const KIND = 'redo';

    export function create(): RedoAction {
        return {
            kind: KIND
        };
    }
}

/**
 * Move an arbitrary set of elements to new positions.
 */
export interface MoveAction extends Action {
    kind: typeof MoveAction.KIND
    moves: ElementMove[]
    animate: boolean
    finished: boolean
}
export namespace MoveAction {
    export const KIND = 'move';

    export function create(moves: ElementMove[], options: { animate?: boolean, finished?: boolean } = {}): MoveAction {
        return {
            kind: KIND,
            moves,
            animate: options.animate ?? true,
            finished: options.finished ?? false
        };
    }
}

export interface ElementMove {
    elementId: string
    elementType?: string
    fromPosition?: Point
    toPosition: Point
}

/**
 * Triggered when the user puts the mouse pointer over an element.
 */
export interface HoverFeedbackAction extends Action {
    kind: typeof HoverFeedbackAction.KIND
    mouseoverElement: string
    mouseIsOver: boolean
}
export namespace HoverFeedbackAction {
    export const KIND = 'hoverFeedback';

    export function create(options: { mouseoverElement: string, mouseIsOver: boolean }): HoverFeedbackAction {
        return {
            kind: KIND,
            mouseoverElement: options.mouseoverElement,
            mouseIsOver: options.mouseIsOver
        };
    }
}

/**
 * Create an element with the given schema and add it to the diagram.
 */
export interface CreateElementAction extends Action {
    kind: typeof CreateElementAction.KIND
    containerId: string
    elementSchema: SModelElement
}
export namespace CreateElementAction {
    export const KIND = 'createElement';

    export function create(elementSchema: SModelElement, options: { containerId: string }): CreateElementAction {
        return {
            kind: KIND,
            elementSchema,
            containerId: options.containerId
        };
    }
}

/**
 * Delete a set of elements identified by their IDs.
 */
export interface DeleteElementAction extends Action {
    kind: typeof DeleteElementAction.KIND
    elementIds: string[]
}
export namespace DeleteElementAction {
    export const KIND = 'delete';

    export function create(elementIds: string[]): DeleteElementAction {
        return {
            kind: KIND,
            elementIds
        };
    }
}

/**
 * Apply a text change to a label element.
 */
export interface ApplyLabelEditAction extends Action {
    kind: typeof ApplyLabelEditAction.KIND;
    labelId: string,
    text: string
}
export namespace ApplyLabelEditAction {
    export const KIND = 'applyLabelEdit';

    export function create(labelId: string, text: string): ApplyLabelEditAction {
        return {
            kind: KIND,
            labelId,
            text
        };
    }
}

/**
 * Change the source or target node of a routable element (edge of a graph).
 */
export interface ReconnectAction extends Action {
    kind: typeof ReconnectAction.KIND
    routableId: string
    newSourceId?: string
    newTargetId?: string
}
export namespace ReconnectAction {
    export const KIND = 'reconnect';

    export function create(options: { routableId: string, newSourceId?: string, newTargetId?: string }): ReconnectAction {
        return {
            kind: KIND,
            routableId: options.routableId,
            newSourceId: options.newSourceId,
            newTargetId: options.newTargetId
        };
    }
}
