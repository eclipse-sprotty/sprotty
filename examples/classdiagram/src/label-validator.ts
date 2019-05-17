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
import { IEditLabelValidator, EditableLabel, SModelElement, EditLabelValidationResult, Severity } from "../../../src";
import { injectable } from "inversify";

@injectable()
export class ClassDiagramLabelValidator implements IEditLabelValidator {
    async validate(value: string, label: EditableLabel & SModelElement): Promise<EditLabelValidationResult> {
        if (value.length < 1) {
            return {
                severity: <Severity>'error',
                message: 'Name must not be empty'
            };
        } else if (value.indexOf('!') !== -1) {
            return {
                severity: <Severity>'warning',
                message: 'Name should not contain exclamation marks'
            };
        }
        return {
            severity: <Severity>'ok', message: undefined
        };
    }
}