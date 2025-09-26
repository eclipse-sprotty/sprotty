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
exports.PerformanceInfo = exports.LayoutEdge = exports.LayoutAwareLabel = exports.LayoutCompartment = exports.HybridLayoutNode = exports.ServerLayoutNode = exports.ClientLayoutNode = void 0;
const sprotty_1 = require("sprotty");
/**
 * Client Layout Node - optimized for micro-layout with rich content
 */
class ClientLayoutNode extends sprotty_1.SNodeImpl {
    constructor() {
        super(...arguments);
        // Layout configuration
        this.layout = 'vbox';
    }
}
exports.ClientLayoutNode = ClientLayoutNode;
ClientLayoutNode.DEFAULT_FEATURES = [
    sprotty_1.selectFeature,
    sprotty_1.moveFeature,
    sprotty_1.hoverFeedbackFeature,
    sprotty_1.fadeFeature,
    sprotty_1.layoutContainerFeature,
    sprotty_1.boundsFeature
];
/**
 * Server Layout Node - minimal content, positioned by server algorithms
 */
class ServerLayoutNode extends sprotty_1.SNodeImpl {
}
exports.ServerLayoutNode = ServerLayoutNode;
ServerLayoutNode.DEFAULT_FEATURES = [
    sprotty_1.selectFeature,
    sprotty_1.moveFeature,
    sprotty_1.hoverFeedbackFeature,
    sprotty_1.fadeFeature,
    sprotty_1.boundsFeature
];
/**
 * Hybrid Layout Node - combines client content layout with server positioning
 */
class HybridLayoutNode extends sprotty_1.SNodeImpl {
    constructor() {
        super(...arguments);
        // Client layout for internal content
        this.layout = 'vbox';
    }
}
exports.HybridLayoutNode = HybridLayoutNode;
HybridLayoutNode.DEFAULT_FEATURES = [
    sprotty_1.selectFeature,
    sprotty_1.moveFeature,
    sprotty_1.hoverFeedbackFeature,
    sprotty_1.fadeFeature,
    sprotty_1.layoutContainerFeature,
    sprotty_1.boundsFeature
];
/**
 * Compartment for organizing content within nodes
 */
class LayoutCompartment extends sprotty_1.SCompartmentImpl {
    constructor() {
        super(...arguments);
        // Compartment-specific layout
        this.layout = 'vbox';
    }
}
exports.LayoutCompartment = LayoutCompartment;
LayoutCompartment.DEFAULT_FEATURES = [
    sprotty_1.layoutableChildFeature,
    sprotty_1.layoutContainerFeature,
    sprotty_1.boundsFeature
];
/**
 * Smart Label - adjusts to layout context
 */
class LayoutAwareLabel extends sprotty_1.SLabelImpl {
}
exports.LayoutAwareLabel = LayoutAwareLabel;
LayoutAwareLabel.DEFAULT_FEATURES = [
    sprotty_1.layoutableChildFeature,
    sprotty_1.boundsFeature
];
/**
 * Connection Edge - works with all layout strategies
 */
class LayoutEdge extends sprotty_1.SEdgeImpl {
}
exports.LayoutEdge = LayoutEdge;
LayoutEdge.DEFAULT_FEATURES = [
    sprotty_1.selectFeature,
    sprotty_1.hoverFeedbackFeature,
    sprotty_1.fadeFeature
];
/**
 * Performance Monitor - tracks layout computation times
 */
class PerformanceInfo {
    constructor() {
        this.layoutStrategy = 'client';
        this.nodeCount = 0;
        this.edgeCount = 0;
        this.boundsComputations = 0;
    }
}
exports.PerformanceInfo = PerformanceInfo;
//# sourceMappingURL=model.js.map