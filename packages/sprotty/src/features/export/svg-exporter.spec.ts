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

/**
 * @vitest-environment happy-dom
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { SModelRootImpl } from '../../base/model/smodel';
import { SvgExporter } from './svg-exporter';

class TestSvgExporter extends SvgExporter {
    createSvgForTest(svgElement: SVGSVGElement): string {
        return this.createSvg(svgElement, undefined as unknown as SModelRootImpl);
    }

    protected override getBounds(): { x: number; y: number; width: number; height: number } {
        return { x: 0, y: 0, width: 100, height: 50 };
    }
}

function expectComputedRootStyleToBeSkipped(property: string, value: string): void {
    const source = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(source);

    const computedSourceStyle = {
        0: property,
        1: 'color',
        length: 2,
        getPropertyValue: (key: string) => key === property ? value : 'red'
    } as unknown as CSSStyleDeclaration;
    const computedTargetStyle = {
        length: 0,
        getPropertyValue: () => ''
    } as unknown as CSSStyleDeclaration;
    vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(element =>
        element === source ? computedSourceStyle : computedTargetStyle
    );

    const result = new TestSvgExporter().createSvgForTest(source);

    expect(result).toContain('color:red');
    expect(result).not.toContain(`${property}:`);
}

describe('SvgExporter', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        document.body.replaceChildren();
    });

    it('does not copy the computed width to the exported root', () => {
        expectComputedRootStyleToBeSkipped('width', '3px');
    });

    it('does not copy the computed height to the exported root', () => {
        expectComputedRootStyleToBeSkipped('height', '3px');
    });

    it('does not copy the computed opacity to the exported root', () => {
        expectComputedRootStyleToBeSkipped('opacity', '0.5');
    });

    it('does not copy the computed inline size to the exported root', () => {
        expectComputedRootStyleToBeSkipped('inline-size', '3px');
    });

    it('does not copy the computed block size to the exported root', () => {
        expectComputedRootStyleToBeSkipped('block-size', '3px');
    });
});
