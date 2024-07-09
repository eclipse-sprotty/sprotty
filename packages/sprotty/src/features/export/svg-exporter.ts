/********************************************************************************
 * Copyright (c) 2017-2024 TypeFox and others.
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

import { inject, injectable, multiInject, optional } from 'inversify';
import { Action, ExportSvgOptions, RequestExportSvgAction, ResponseAction } from 'sprotty-protocol/lib/actions';
import { Bounds } from 'sprotty-protocol/lib/utils/geometry';
import { ActionDispatcher } from '../../base/actions/action-dispatcher';
import { SModelRootImpl } from '../../base/model/smodel';
import { TYPES } from '../../base/types';
import { ViewerOptions } from '../../base/views/viewer-options';
import { ILogger } from '../../utils/logging';
import { isBoundsAware } from '../bounds/model';
import { ISvgExportPostProcessor } from './svg-export-postprocessor';

/**
 * @deprecated Use the definition from `sprotty-protocol` instead.
 */
export interface ExportSvgAction extends ResponseAction {
    kind: typeof ExportSvgAction.KIND;
    svg: string;
    responseId: string;
    options?: ExportSvgOptions;
}
export namespace ExportSvgAction {
    export const KIND = 'exportSvg';

    export function create(svg: string, requestId: string, options?: ExportSvgOptions): ExportSvgAction {
        return {
            kind: KIND,
            svg,
            responseId: requestId,
            options
        };
    }
}

@injectable()
export class SvgExporter {

    @inject(TYPES.ViewerOptions) protected options: ViewerOptions;
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: ActionDispatcher;
    @inject(TYPES.ILogger) protected log: ILogger;
    @multiInject(TYPES.ISvgExportPostprocessor) @optional() protected postprocessors: ISvgExportPostProcessor[] = [];

    export(root: SModelRootImpl, request?: RequestExportSvgAction): void {
        if (typeof document !== 'undefined') {
            const hiddenDiv = document.getElementById(this.options.hiddenDiv);
            if (hiddenDiv === null) {
                this.log.warn(this, `Element with id ${this.options.hiddenDiv} not found. Nothing to export.`);
                return;

            }

            const svgElement = hiddenDiv.querySelector('svg');
            if (svgElement === null) {
                this.log.warn(this, `No svg element found in ${this.options.hiddenDiv} div. Nothing to export.`);
                return;
            }
            const svg = this.createSvg(svgElement, root, request?.options ?? {}, request);
            this.actionDispatcher.dispatch(ExportSvgAction.create(svg, request ? request.requestId : '', request?.options));
        }
    }

    protected createSvg(svgElementOrig: SVGSVGElement, root: SModelRootImpl, options?: ExportSvgOptions, cause?: Action): string {
        const serializer = new XMLSerializer();
        const svgCopy = serializer.serializeToString(svgElementOrig);
        const iframe: HTMLIFrameElement = document.createElement('iframe');
        document.body.appendChild(iframe);
        if (!iframe.contentWindow)
            throw new Error('IFrame has no contentWindow');
        const docCopy = iframe.contentWindow.document;
        docCopy.open();
        docCopy.write(svgCopy);
        docCopy.close();
        const svgElementNew = docCopy.querySelector('svg')!;
        svgElementNew.removeAttribute('opacity');
        if (!options?.skipCopyStyles) {
            // inline-size copied from sprotty-hidden svg shrinks the svg so it is not visible.
            this.copyStyles(svgElementOrig, svgElementNew, ['width', 'height', 'opacity', 'inline-size']);
        }
        svgElementNew.setAttribute('version', '1.1');
        const bounds = this.getBounds(root, docCopy);

        svgElementNew.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
        svgElementNew.setAttribute('width', `${bounds.width}`);
        svgElementNew.setAttribute('height', `${bounds.height}`);

        this.postprocessors.forEach(postprocessor => {
            postprocessor.postUpdate(svgElementNew, cause);
        });

        const svgCode = serializer.serializeToString(svgElementNew);
        document.body.removeChild(iframe);

        return svgCode;
    }

    protected copyStyles(source: Element, target: Element, skippedProperties: string[]) {
        const sourceStyle = getComputedStyle(source);
        const targetStyle = getComputedStyle(target);
        let diffStyle = '';
        for (let i = 0; i < sourceStyle.length; i++) {
            const key = sourceStyle[i];
            if (skippedProperties.indexOf(key) === -1) {
                const value = sourceStyle.getPropertyValue(key);
                if (targetStyle.getPropertyValue(key) !== value) {
                    diffStyle += key + ':' + value + ';';
                }
            }
        }
        if (diffStyle !== '')
            target.setAttribute('style', diffStyle);
        // IE doesn't return anything on source.children
        for (let i = 0; i < source.childNodes.length; ++i) {
            const sourceChild = source.childNodes[i];
            const targetChild = target.childNodes[i];
            if (sourceChild instanceof Element)
                this.copyStyles(sourceChild, targetChild as Element, []);
        }
    }

    protected getBounds(root: SModelRootImpl, document: Document) {
        const svgElement = document.querySelector('svg');
        if (svgElement) {
            return svgElement.getBBox();
        }

        const allBounds: Bounds[] = [Bounds.EMPTY];
        root.children.forEach(element => {
            if (isBoundsAware(element)) {
                allBounds.push(element.bounds);
            }
        });
        return allBounds.reduce((one, two) => Bounds.combine(one, two));
    }
}
