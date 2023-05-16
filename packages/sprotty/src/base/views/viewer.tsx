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

/** @jsx html */
import { inject, injectable, multiInject, optional } from 'inversify';
import { attributesModule, classModule, eventListenersModule, init, Module, propsModule, styleModule, VNode } from 'snabbdom';
import { Action } from 'sprotty-protocol/lib/actions';
import { html } from '../../lib/jsx'; // must be html here, as we're creating a div
import { getWindowScroll } from '../../utils/browser';
import { ILogger } from '../../utils/logging';
import { IActionDispatcher } from '../actions/action-dispatcher';
import { InitializeCanvasBoundsAction } from '../features/initialize-canvas';
import { SModelElementImpl, SModelRootImpl, SParentElementImpl } from '../model/smodel';
import { EMPTY_ROOT } from '../model/smodel-factory';
import { TYPES } from '../types';
import { isThunk } from './thunk-view';
import { IViewArgs, RenderingContext, RenderingTargetKind, ViewRegistry } from './view';
import { ViewerOptions } from './viewer-options';
import { IVNodePostprocessor } from './vnode-postprocessor';
import { copyClassesFromElement, copyClassesFromVNode, setAttr, setClass } from './vnode-utils';


export interface IViewer {
    update(model: SModelRootImpl, cause?: Action): void
}

export interface IViewerProvider {
    readonly modelViewer: IViewer
    readonly hiddenModelViewer: IViewer
    readonly popupModelViewer: IViewer
}

export class ModelRenderer implements RenderingContext {

    constructor(readonly viewRegistry: ViewRegistry,
        readonly targetKind: RenderingTargetKind,
        private postprocessors: IVNodePostprocessor[],
        protected args: IViewArgs = {}) {
    }

    decorate(vnode: VNode, element: Readonly<SModelElementImpl>): VNode {
        if (isThunk(vnode)) {
            return vnode;
        }
        return this.postprocessors.reduce(
            (n: VNode, processor: IVNodePostprocessor) => processor.decorate(n, element),
            vnode);
    }

    renderElement(element: Readonly<SModelElementImpl>): VNode | undefined {
        const view = this.viewRegistry.get(element.type);
        const vnode = view.render(element, this, this.args);
        if (vnode) {
            return this.decorate(vnode, element);
        } else {
            return undefined;
        }
    }

    renderChildren(element: Readonly<SParentElementImpl>, args?: IViewArgs): VNode[] {
        const context = args ?
            new ModelRenderer(
                this.viewRegistry,
                this.targetKind,
                this.postprocessors,
                { ...args, parentArgs: this.args }
            ) : this;
        return element.children
            .map(child => context.renderElement(child))
            .filter(vnode => vnode !== undefined) as VNode[];
    }

    postUpdate(cause?: Action) {
        this.postprocessors.forEach(processor => processor.postUpdate(cause));
    }
}

export type ModelRendererFactory = (
    targetKind: RenderingTargetKind,
    postprocessors: IVNodePostprocessor[],
    args?: IViewArgs
) => ModelRenderer;

export type Patcher = (oldRoot: VNode | Element, newRoot: VNode) => VNode;

@injectable()
export class PatcherProvider {

    readonly patcher: Patcher;

    constructor() {
        this.patcher = init(this.createModules());
    }

    protected createModules(): Module[] {
        return [
            propsModule,
            attributesModule,
            classModule,
            styleModule,
            eventListenersModule
        ];
    }

}

/**
 * The component that turns the model into an SVG DOM.
 * Uses a VDOM based on snabbdom.js for performance.
 */
@injectable()
export class ModelViewer implements IViewer {

    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;
    @inject(TYPES.ILogger) protected logger: ILogger;
    @inject(TYPES.IActionDispatcher) protected actiondispatcher: IActionDispatcher;

    constructor(@inject(TYPES.ModelRendererFactory) modelRendererFactory: ModelRendererFactory,
        @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider,
        @multiInject(TYPES.IVNodePostprocessor) @optional() postprocessors: IVNodePostprocessor[]) {
        this.renderer = modelRendererFactory('main', postprocessors);
        this.patcher = patcherProvider.patcher;
    }

    protected readonly renderer: ModelRenderer;
    protected readonly patcher: Patcher;

    protected lastVDOM: VNode;

    update(model: Readonly<SModelRootImpl>, cause?: Action): void {
        this.logger.log(this, 'rendering', model);
        const newVDOM = <div id={this.options.baseDiv}>
            {this.renderer.renderElement(model)}
        </div>;
        if (this.lastVDOM !== undefined) {
            const hadFocus = this.hasFocus();
            copyClassesFromVNode(this.lastVDOM, newVDOM);
            this.lastVDOM = this.patcher.call(this, this.lastVDOM, newVDOM);
            this.restoreFocus(hadFocus);
        } else if (typeof document !== 'undefined') {
            const placeholder = document.getElementById(this.options.baseDiv);
            if (placeholder !== null) {
                if (typeof window !== 'undefined') {
                    window.addEventListener('resize', () => {
                        this.onWindowResize(newVDOM);
                    });
                }
                copyClassesFromElement(placeholder, newVDOM);
                setClass(newVDOM, this.options.baseClass, true);
                this.lastVDOM = this.patcher.call(this, placeholder, newVDOM);
            } else {
                this.logger.error(this, 'element not in DOM:', this.options.baseDiv);
            }
        }
        this.renderer.postUpdate(cause);
    }

    protected hasFocus(): boolean {
        if (typeof document !== 'undefined' && document.activeElement && this.lastVDOM.children && this.lastVDOM.children.length > 0) {
            const lastRootVNode = this.lastVDOM.children[0];
            if (typeof lastRootVNode === 'object') {
                const lastElement = (lastRootVNode as VNode).elm;
                return document.activeElement === lastElement;
            }
        }
        return false;
    }

    protected restoreFocus(focus: boolean) {
        if (focus && this.lastVDOM.children && this.lastVDOM.children.length > 0) {
            const lastRootVNode = this.lastVDOM.children[0];
            if (typeof lastRootVNode === 'object') {
                const lastElement = (lastRootVNode as VNode).elm;
                if (lastElement && typeof (lastElement as any).focus === 'function')
                    (lastElement as any).focus();
            }
        }
    }

    protected onWindowResize(vdom: VNode): void {
        const baseDiv = document.getElementById(this.options.baseDiv);
        if (baseDiv !== null) {
            const newBounds = this.getBoundsInPage(baseDiv as Element);
            this.actiondispatcher.dispatch(InitializeCanvasBoundsAction.create(newBounds));
        }
    }

    protected getBoundsInPage(element: Element) {
        const bounds = element.getBoundingClientRect();
        const scroll = getWindowScroll();
        return {
            x: bounds.left + scroll.x,
            y: bounds.top + scroll.y,
            width: bounds.width,
            height: bounds.height
        };
    }

}

/**
 * Viewer for the _hidden_ model. This serves as an intermediate step to compute bounds
 * of elements. The model is rendered in a section that is not visible to the user,
 * and then the bounds are extracted from the DOM.
 */
@injectable()
export class HiddenModelViewer implements IViewer {

    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;
    @inject(TYPES.ILogger) protected logger: ILogger;

    constructor(@inject(TYPES.ModelRendererFactory) modelRendererFactory: ModelRendererFactory,
        @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider,
        @multiInject(TYPES.HiddenVNodePostprocessor) @optional() hiddenPostprocessors: IVNodePostprocessor[]) {
        this.hiddenRenderer = modelRendererFactory('hidden', hiddenPostprocessors);
        this.patcher = patcherProvider.patcher;
    }

    protected readonly hiddenRenderer: ModelRenderer;
    protected readonly patcher: Patcher;

    protected lastHiddenVDOM: VNode;

    update(hiddenModel: Readonly<SModelRootImpl>, cause?: Action): void {
        this.logger.log(this, 'rendering hidden');

        let newVDOM: VNode;
        if (hiddenModel.type === EMPTY_ROOT.type) {
            newVDOM = <div id={this.options.hiddenDiv}></div>;
        } else {
            const hiddenVNode = this.hiddenRenderer.renderElement(hiddenModel);
            if (hiddenVNode) {
                setAttr(hiddenVNode, 'opacity', 0);
            }
            newVDOM = <div id={this.options.hiddenDiv}>
                {hiddenVNode}
            </div>;
        }

        if (this.lastHiddenVDOM !== undefined) {
            copyClassesFromVNode(this.lastHiddenVDOM, newVDOM);
            this.lastHiddenVDOM = this.patcher.call(this, this.lastHiddenVDOM, newVDOM);
        } else {
            let placeholder = document.getElementById(this.options.hiddenDiv);
            if (placeholder === null) {
                placeholder = document.createElement('div');
                document.body.appendChild(placeholder);
            } else {
                copyClassesFromElement(placeholder, newVDOM);
            }
            setClass(newVDOM, this.options.baseClass, true);
            setClass(newVDOM, this.options.hiddenClass, true);
            this.lastHiddenVDOM = this.patcher.call(this, placeholder, newVDOM);
        }
        this.hiddenRenderer.postUpdate(cause);
    }

}

@injectable()
export class PopupModelViewer implements IViewer {

    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;
    @inject(TYPES.ILogger) protected logger: ILogger;

    constructor(@inject(TYPES.ModelRendererFactory) protected readonly modelRendererFactory: ModelRendererFactory,
        @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider,
        @multiInject(TYPES.PopupVNodePostprocessor) @optional() popupPostprocessors: IVNodePostprocessor[]) {
        this.popupRenderer = this.modelRendererFactory('popup', popupPostprocessors);
        this.patcher = patcherProvider.patcher;
    }

    protected readonly popupRenderer: ModelRenderer;
    protected readonly patcher: Patcher;

    protected lastPopupVDOM: VNode;

    update(model: Readonly<SModelRootImpl>, cause?: Action): void {
        this.logger.log(this, 'rendering popup', model);

        const popupClosed = model.type === EMPTY_ROOT.type;
        let newVDOM: VNode;
        if (popupClosed) {
            newVDOM = <div id={this.options.popupDiv}></div>;
        } else {
            const position = model.canvasBounds;
            const inlineStyle = {
                top: position.y + 'px',
                left: position.x + 'px'
            };
            newVDOM = <div id={this.options.popupDiv} style={inlineStyle}>
                {this.popupRenderer.renderElement(model)}
            </div>;
        }

        if (this.lastPopupVDOM !== undefined) {
            copyClassesFromVNode(this.lastPopupVDOM, newVDOM);
            setClass(newVDOM, this.options.popupClosedClass, popupClosed);
            this.lastPopupVDOM = this.patcher.call(this, this.lastPopupVDOM, newVDOM);
        } else if (typeof document !== 'undefined') {
            let placeholder = document.getElementById(this.options.popupDiv);
            if (placeholder === null) {
                placeholder = document.createElement('div');
                document.body.appendChild(placeholder);
            } else {
                copyClassesFromElement(placeholder, newVDOM);
            }
            setClass(newVDOM, this.options.popupClass, true);
            setClass(newVDOM, this.options.popupClosedClass, popupClosed);
            this.lastPopupVDOM = this.patcher.call(this, placeholder, newVDOM);
        }
        this.popupRenderer.postUpdate(cause);
    }

}
