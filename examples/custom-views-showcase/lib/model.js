"use strict";
/********************************************************************************
 * Copyright (c) 2025 TypeFox and others.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLabel = exports.StyledEdge = exports.StatefulNode = exports.ComplexNode = exports.EnhancedNode = exports.BasicShapeNode = void 0;
const sprotty_1 = require("sprotty");
/**
 * Basic custom node - demonstrates simple custom view creation
 */
class BasicShapeNode extends sprotty_1.SNodeImpl {
    constructor() {
        super(...arguments);
        this.shape = 'circle';
    }
}
exports.BasicShapeNode = BasicShapeNode;
BasicShapeNode.DEFAULT_FEATURES = sprotty_1.SNodeImpl.DEFAULT_FEATURES;
/**
 * Enhanced node - demonstrates extending base views
 */
class EnhancedNode extends sprotty_1.SNodeImpl {
    constructor() {
        super(...arguments);
        this.status = 'normal';
        this.showBorder = false;
        this.cornerRadius = 0;
    }
}
exports.EnhancedNode = EnhancedNode;
EnhancedNode.DEFAULT_FEATURES = sprotty_1.SNodeImpl.DEFAULT_FEATURES;
/**
 * Complex node - demonstrates compositional views
 */
class ComplexNode extends sprotty_1.SNodeImpl {
    constructor() {
        super(...arguments);
        this.title = '';
        this.showHeader = true;
        this.showFooter = false;
    }
}
exports.ComplexNode = ComplexNode;
ComplexNode.DEFAULT_FEATURES = sprotty_1.SNodeImpl.DEFAULT_FEATURES;
/**
 * Stateful node - demonstrates conditional rendering
 */
class StatefulNode extends sprotty_1.SNodeImpl {
    constructor() {
        super(...arguments);
        this.state = 'idle';
    }
}
exports.StatefulNode = StatefulNode;
StatefulNode.DEFAULT_FEATURES = sprotty_1.SNodeImpl.DEFAULT_FEATURES;
/**
 * Custom edge - demonstrates edge view creation
 */
class StyledEdge extends sprotty_1.SEdgeImpl {
    constructor() {
        super(...arguments);
        this.style = 'solid';
        this.thickness = 2;
        this.animated = false;
    }
}
exports.StyledEdge = StyledEdge;
StyledEdge.DEFAULT_FEATURES = sprotty_1.SEdgeImpl.DEFAULT_FEATURES;
/**
 * Custom label for demonstration
 */
class CustomLabel extends sprotty_1.SLabelImpl {
    constructor() {
        super(...arguments);
        this.fontSize = 12;
    }
}
exports.CustomLabel = CustomLabel;
CustomLabel.DEFAULT_FEATURES = sprotty_1.SLabelImpl.DEFAULT_FEATURES;
//# sourceMappingURL=model.js.map