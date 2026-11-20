/********************************************************************************
 * Copyright (c) 2026 TypeFox and others.
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

import { Container, ContainerModule, interfaces } from 'inversify';
import { Action, RequestAction, ResponseAction, SModelRoot, getBasicType } from 'sprotty-protocol';
import { IActionDispatcher } from '../base/actions/action-dispatcher.js';
import { ActionHandlerRegistry, IActionHandler, configureActionHandler } from '../base/actions/action-handler.js';
import { ICommandConstructor, configureCommand } from '../base/commands/command-registration.js';
import {
    CommandStackOptions, configureCommandStackOptions
} from '../base/commands/command-stack-options.js';
import { CustomFeatures, SModelRegistry } from '../base/model/smodel-factory.js';
import { SModelElementImpl } from '../base/model/smodel.js';
import { registerModelElement } from '../base/model/smodel-utils.js';
import { TYPES } from '../base/types.js';
import {
    IView, ViewRegistry, configureModelElement, configureView, overrideModelElement
} from '../base/views/view.js';
import { ViewerOptions, configureViewerOptions } from '../base/views/viewer-options.js';
import { SRoutingHandleImpl } from '../features/routing/model.js';
import {
    SCompartmentImpl, SEdgeImpl, SGraphImpl, SLabelImpl, SNodeImpl, SPortImpl
} from '../graph/sgraph.js';
import {
    PolylineEdgeView, SCompartmentView, SGraphView, SLabelView, SRoutingHandleView
} from '../graph/views.js';
import { LocalModelSource } from '../model-source/local-model-source.js';
import { ModelSource } from '../model-source/model-source.js';
import { ConsoleLogger, ILogger, LogLevel } from '../utils/logging.js';
import { loadDefaultModules } from './modules.js';
import { RectangularNodeView } from './svg-views.js';

/**
 * The model class and view to use for a model element type, optionally with custom features.
 */
export interface ElementRegistration {
    /**
     * The model class. When omitted, it is inferred from the type's prefix — the part before the
     * first `:` — as listed in `inferredModelClasses`: `node:task` gets `SNodeImpl`, `label:info`
     * gets `SLabelImpl`. A type whose prefix is not listed there must name its model class.
     */
    model?: new () => SModelElementImpl

    /** The view that renders elements of this type. */
    view: interfaces.ServiceIdentifier<IView>

    /** Features to enable or disable on top of the model class's defaults. */
    features?: CustomFeatures
}

/**
 * The model classes inferred for an `ElementRegistration` without a `model`, keyed by type prefix.
 * Both `comp` (the prefix used throughout the examples) and `compartment` (the default type) map to
 * `SCompartmentImpl`.
 */
export const inferredModelClasses: Readonly<Record<string, new () => SModelElementImpl>> = Object.freeze({
    'graph': SGraphImpl,
    'node': SNodeImpl,
    'port': SPortImpl,
    'edge': SEdgeImpl,
    'label': SLabelImpl,
    'comp': SCompartmentImpl,
    'compartment': SCompartmentImpl,
    'routing-point': SRoutingHandleImpl,
    'volatile-routing-point': SRoutingHandleImpl
});

export interface SprottyDiagramOptions<S extends ModelSource = LocalModelSource> {
    /**
     * Model element types to register, keyed by type string. Entries for one of the default types
     * (see `defaultElements()`) replace the default registration; all others are added.
     *
     * An entry without `model` whose type prefix is not in `inferredModelClasses` makes
     * `createSprottyDiagram` throw.
     */
    elements?: Record<string, ElementRegistration>

    /** Viewer options to apply on top of `defaultViewerOptions()`. */
    viewerOptions?: Partial<ViewerOptions>

    /** Command stack options to apply on top of `defaultCommandStackOptions()`. */
    commandStackOptions?: Partial<CommandStackOptions>

    /**
     * The model source implementation to bind. Defaults to `LocalModelSource`.
     *
     * The type given here is what `SprottyDiagram.modelSource` reports, and it decides whether the
     * diagram carries `setModel` and `updateModel` — those exist on `LocalModelSource` only.
     */
    modelSource?: interfaces.Newable<S>

    /**
     * How much the console logger reports. Defaults to `LogLevel.warn`, which keeps the warning
     * about a missing view but drops the per-render and per-command trace.
     */
    logLevel?: LogLevel

    /**
     * Additional container modules, loaded after the defaults and before `elements`.
     *
     * A module passed here must register only its own subtypes: registering one of the default
     * types collides with the default registration and fails at first render. See
     * `docs/adr/0007-simplified-diagram-api.md`.
     */
    modules?: ContainerModule[]
}

/**
 * A configured diagram: the services an application interacts with, the verbs it calls on them, and
 * the container that wires them together.
 */
export interface SprottyDiagramBase<S extends ModelSource> {

    /**
     * The dependency injection container. Everything the options and the methods below do not cover is bound and
     * resolved here; ordinary applications should not need it.
     */
    readonly container: Container

    /** The model source bound by the `modelSource` option, typed as it was given. */
    readonly modelSource: S

    /** The action dispatcher. The diagram forwards to it, so this is only needed to pass it on. */
    readonly actionDispatcher: IActionDispatcher

    /**
     * Register a model element type on a diagram that already exists.
     *
     * Registering a type that is already known — one of the defaults, or one added earlier —
     * replaces it. Unlike the declarative `elements` option, where a duplicate is a collision
     * between two sources and therefore an error, these calls are ordered statements and the last
     * one wins.
     *
     * Must be called before the model element registry or the view registry is built. Dispatching
     * the first action builds them, and so does reading `modelSource` or `actionDispatcher` — or
     * resolving anything from `container` that depends on them. A late call is ignored with a
     * warning; see `addActionHandler`.
     */
    addModelElement(type: string, modelConstr: new () => SModelElementImpl,
        viewConstr: interfaces.ServiceIdentifier<IView>, features?: CustomFeatures): void

    /**
     * Register a command on a diagram that already exists.
     *
     * Must be called before the diagram dispatches its first action; see `addActionHandler`.
     */
    addCommand<T extends Action>(commandConstr: ICommandConstructor<T>): void

    /**
     * Register an action handler on a diagram that already exists.
     *
     * An action kind may have several handlers; each call adds one rather than replacing the
     * previous.
     *
     * Registrations are read once, when the action handler registry is built — by the first
     * dispatched action, or by anything resolved from `container` that depends on it. A
     * registration made after that point is not applied; the diagram logs a warning naming it and
     * carries on.
     */
    addActionHandler(kind: string, handlerConstr: interfaces.ServiceIdentifier<IActionHandler>): void
}

/**
 * The model verbs a diagram carries when its model source is a `LocalModelSource`.
 *
 * The abstract `ModelSource` defines the event-cycle contract only — `model`, `handle`,
 * `commitModel` — and deliberately omits model mutation: with a `DiagramServerProxy` the client is
 * not the author of the model, and asks for one with `RequestModelAction` instead. So these verbs
 * are absent rather than failing at runtime.
 *
 * The false branch is `unknown` because `A & unknown` is `A`; an empty object type would either be
 * flagged by lint or, as `Record<string, never>`, collapse every property of the intersection.
 */
export type LocalModelVerbs<S extends ModelSource> = S extends LocalModelSource
    ? {
        /** Set the model without incremental update. */
        setModel(root: SModelRoot): Promise<void>

        /**
         * Apply an incremental update to the model with an animation showing the transition. If
         * `root` is undefined, the current root is submitted; in that case it is assumed to have
         * been modified before.
         */
        updateModel(root?: SModelRoot): Promise<void>
    }
    : unknown;

/**
 * The handle returned by `createSprottyDiagram`.
 *
 * Being an `IActionDispatcher` itself, a diagram can be passed anywhere one is expected.
 */
export type SprottyDiagram<S extends ModelSource = LocalModelSource> =
    SprottyDiagramBase<S> & IActionDispatcher & LocalModelVerbs<S>;

/**
 * The model element types registered by `createSprottyDiagram` when no override is given. Each call
 * returns a fresh object, so changing it affects nobody else.
 *
 * This covers the base graph vocabulary plus the routing handles, which `routingModule` creates
 * whenever an edge is selected for routing. Every element type the default modules can create must
 * appear here, otherwise the diagram paints a `MissingView` for it.
 */
export function defaultElements(): Record<string, ElementRegistration> {
    return {
        'graph': { model: SGraphImpl, view: SGraphView },
        'node': { model: SNodeImpl, view: RectangularNodeView },
        'edge': { model: SEdgeImpl, view: PolylineEdgeView },
        'label': { model: SLabelImpl, view: SLabelView },
        'port': { model: SPortImpl, view: RectangularNodeView },
        'compartment': { model: SCompartmentImpl, view: SCompartmentView },
        'routing-point': { model: SRoutingHandleImpl, view: SRoutingHandleView },
        'volatile-routing-point': { model: SRoutingHandleImpl, view: SRoutingHandleView }
    };
}

const defaultTypes: ReadonlySet<string> = new Set(Object.keys(defaultElements()));

/**
 * Create a diagram that is ready to render, without writing a `ContainerModule`.
 *
 * With no options the diagram warns to the console, takes its model from a `LocalModelSource`,
 * renders into the `sprotty` element, and knows the default element types. Pass options to add
 * element types, change the viewer or command stack options, swap the model source, raise or lower
 * the log level, or load further modules.
 *
 * ```ts
 * const diagram = createSprottyDiagram({
 *     elements: {
 *         'node:task': { model: TaskNode, view: TaskView },
 *         'label:info': { view: SLabelView }  // model inferred from the prefix: SLabelImpl
 *     }
 * });
 * await diagram.setModel(model);
 * await diagram.dispatch(FitToScreenAction.create([]));
 * ```
 *
 * The `container` property is an ordinary Inversify container: anything the options and the `addX`
 * methods do not cover can be bound by loading another module onto it afterwards. Nothing is
 * resolved eagerly, so it stays open until the registries are built — by the first dispatched
 * action, or by reading a service that depends on them.
 *
 * Styling is not part of the diagram. Import `sprotty/css/sprotty.css` and, for the default element
 * types to be visible, `sprotty/css/default-diagram.css`.
 */
export function createSprottyDiagram<S extends ModelSource = LocalModelSource>(
        options: SprottyDiagramOptions<S> = {}): SprottyDiagram<S> {
    // Resolve inferred model classes first, so an unknown prefix throws before anything is built.
    const elements = options.elements ? resolveElements(options.elements) : undefined;
    const container = new Container();
    loadDefaultModules(container);
    container.load(createDefaultsModule(options));
    if (options.modules) {
        container.load(...options.modules);
    }
    if (elements) {
        container.load(createElementsModule(elements));
    }
    // The implementation always carries the model verbs; the type exposes them only for a
    // `LocalModelSource`, and TypeScript cannot narrow an unresolved conditional. This is the one
    // cast that assertion needs.
    return new SprottyDiagramImpl<S>(container) as unknown as SprottyDiagram<S>;
}

class SprottyDiagramImpl<S extends ModelSource> implements SprottyDiagramBase<S>, IActionDispatcher {

    /** Whether the action handler registry, which commands and action handlers feed, has been built. */
    private handlersSealed = false;

    /** Whether the model element registry or the view registry has been built. */
    private elementsSealed = false;

    /**
     * The flags follow the registries themselves rather than the calls made on this object, so a
     * registry built through `container` — directly or as a dependency — seals just the same. All
     * three are singletons, so each activation fires once.
     */
    constructor(readonly container: Container) {
        container.onActivation(ActionHandlerRegistry, (_context, registry) => {
            this.handlersSealed = true;
            return registry;
        });
        container.onActivation<SModelRegistry>(TYPES.SModelRegistry, (_context, registry) => {
            this.elementsSealed = true;
            return registry;
        });
        container.onActivation<ViewRegistry>(TYPES.ViewRegistry, (_context, registry) => {
            this.elementsSealed = true;
            return registry;
        });
    }

    get modelSource(): S {
        return this.container.get<S>(TYPES.ModelSource);
    }

    get actionDispatcher(): IActionDispatcher {
        return this.container.get<IActionDispatcher>(TYPES.IActionDispatcher);
    }

    dispatch(action: Action): Promise<void> {
        return this.actionDispatcher.dispatch(action);
    }

    dispatchAll(actions: Action[]): Promise<void> {
        return this.actionDispatcher.dispatchAll(actions);
    }

    request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res> {
        return this.actionDispatcher.request(action);
    }

    setModel(root: SModelRoot): Promise<void> {
        return this.localModelSource.setModel(root);
    }

    updateModel(root?: SModelRoot): Promise<void> {
        return this.localModelSource.updateModel(root);
    }

    addModelElement(type: string, modelConstr: new () => SModelElementImpl,
            viewConstr: interfaces.ServiceIdentifier<IView>, features?: CustomFeatures): void {
        this.warnIfSealed(this.elementsSealed, 'addModelElement', type);
        registerModelElement(this.container, type, modelConstr, features,
            hasRegisteredType(this.container, TYPES.SModelElementRegistration, type));
        configureView(this.container, type, viewConstr,
            hasRegisteredType(this.container, TYPES.ViewRegistration, type));
    }

    addCommand<T extends Action>(commandConstr: ICommandConstructor<T>): void {
        this.warnIfSealed(this.handlersSealed, 'addCommand', commandConstr.KIND);
        configureCommand(this.container, commandConstr);
    }

    addActionHandler(kind: string, handlerConstr: interfaces.ServiceIdentifier<IActionHandler>): void {
        this.warnIfSealed(this.handlersSealed, 'addActionHandler', kind);
        configureActionHandler(this.container, kind, handlerConstr);
    }

    /**
     * The model source as the `LocalModelSource` that `SprottyDiagram` has already established it
     * to be: the model verbs are typed away for any other model source, so only a caller who has
     * left TypeScript behind can reach these through something else.
     */
    private get localModelSource(): LocalModelSource {
        return this.modelSource as unknown as LocalModelSource;
    }

    private warnIfSealed(sealed: boolean, method: string, subject: string): void {
        if (sealed) {
            this.container.get<ILogger>(TYPES.ILogger).warn(this,
                `${method}('${subject}') was called after the registry it adds to was built. `
                + 'Registrations are read once, when the registries are built, so this one is '
                + 'ignored. Register before the first setModel or dispatch, and before reading '
                + 'modelSource, actionDispatcher, or a registry from the container.');
        }
    }
}

function createDefaultsModule(options: SprottyDiagramOptions<ModelSource>): ContainerModule {
    return new ContainerModule((bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };

        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
        rebind(TYPES.LogLevel).toConstantValue(options.logLevel ?? LogLevel.warn);
        bind(TYPES.ModelSource).to(options.modelSource ?? LocalModelSource).inSingletonScope();

        for (const [type, { model, view, features }] of Object.entries(resolveElements(defaultElements()))) {
            configureModelElement(context, type, model, view, features);
        }

        configureViewerOptions(context, options.viewerOptions ?? {});
        configureCommandStackOptions(context, options.commandStackOptions ?? {});
    });
}

/** An `ElementRegistration` whose model class is known, given or inferred. */
type ResolvedElementRegistration = ElementRegistration & { model: new () => SModelElementImpl };

/**
 * Fill in the model class of every entry that omits it, from its type prefix. Throws for a prefix
 * with no inferred class: silently falling back to a generic element would only surface later, as
 * an element that renders but lacks the behaviour its type suggests.
 */
function resolveElements(elements: Record<string, ElementRegistration>): Record<string, ResolvedElementRegistration> {
    const resolved: Record<string, ResolvedElementRegistration> = {};
    for (const [type, registration] of Object.entries(elements)) {
        const model = registration.model ?? inferredModelClasses[getBasicType({ type })];
        if (!model) {
            throw new Error(`Element type '${type}' has no model class. Pass 'model', or use a type `
                + `whose prefix has an inferred model class: ${Object.keys(inferredModelClasses).join(', ')}.`);
        }
        resolved[type] = { ...registration, model };
    }
    return resolved;
}

/**
 * Registrations are replayed in load order, so an entry for a default type has to be declared as an
 * override — the registry throws on a plain duplicate.
 */
function createElementsModule(elements: Record<string, ResolvedElementRegistration>): ContainerModule {
    return new ContainerModule((bind, unbind, isBound, rebind) => {
        const context = { bind, unbind, isBound, rebind };
        for (const [type, { model, view, features }] of Object.entries(elements)) {
            if (defaultTypes.has(type)) {
                overrideModelElement(context, type, model, view, features);
            } else {
                configureModelElement(context, type, model, view, features);
            }
        }
    });
}

/**
 * Whether a model element type already has a registration bound under `serviceIdentifier`.
 *
 * This reads the registration bindings, not the registry that consumes them, so it does not
 * instantiate `SModelRegistry` or `ViewRegistry`. The container therefore stays open: a
 * `ContainerModule` loaded after an `addX` call still contributes its registrations.
 */
function hasRegisteredType(container: Container, serviceIdentifier: symbol, type: string): boolean {
    return container.isBound(serviceIdentifier)
        && container.getAll<{ type: string }>(serviceIdentifier).some(r => r.type === type);
}
