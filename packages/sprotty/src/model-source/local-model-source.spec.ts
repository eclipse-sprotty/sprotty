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

import "reflect-metadata";
import "mocha";
import { expect } from "chai";
import { Container, injectable } from "inversify";
import { Deferred } from "../utils/async";
import { TYPES } from "../base/types";
import { SModelRootSchema } from "../base/model/smodel";
import { Action, RequestAction, ResponseAction, isResponseAction } from "../base/actions/action";
import { SetModelAction } from "../base/features/set-model";
import { ViewerOptions, overrideViewerOptions } from "../base/views/viewer-options";
import { ComputedBoundsAction, RequestBoundsAction } from "../features/bounds/bounds-manipulation";
import { IActionDispatcher } from "../base/actions/action-dispatcher";
import { UpdateModelAction } from "../features/update/update-model";
import { LocalModelSource } from "./local-model-source";
import defaultContainerModule from "../base/di.config";
import { ComputedBoundsApplicator } from "./model-source";

describe('LocalModelSource', () => {

    @injectable()
    class MockActionDispatcher implements IActionDispatcher {
        readonly actions: Action[] = [];
        readonly requests: { requestId: string, deferred: Deferred<ResponseAction> }[] = [];

        dispatchAll(actions: Action[]): Promise<void> {
            for (const action of actions) {
                this.dispatch(action);
            }
            return Promise.resolve();
        }

        dispatch(action: Action): Promise<void> {
            if (isResponseAction(action)) {
                const request = this.requests.find(r => r.requestId === action.responseId);
                if (request !== undefined) {
                    request.deferred.resolve(action);
                    return Promise.resolve();
                }
                return Promise.reject(`No matching request for response ${action}`);
            }
            this.actions.push(action);
            return Promise.resolve();
        }

        request<Req extends RequestAction<Res>, Res extends ResponseAction>(action: Req): Promise<Res> {
            if (!action.requestId) {
                return Promise.reject(new Error('Request without requestId'));
            }
            const deferred = new Deferred<Res>();
            this.requests.push({ requestId: action.requestId, deferred });
            this.dispatch(action);
            return deferred.promise;
        }
    }

    function setup(options: Partial<ViewerOptions>) {
        const container = new Container();
        container.load(defaultContainerModule);
        container.bind(TYPES.ModelSource).to(LocalModelSource);
        container.bind(ComputedBoundsApplicator).toSelf().inSingletonScope();
        container.rebind(TYPES.IActionDispatcher).to(MockActionDispatcher).inSingletonScope();
        overrideViewerOptions(container, options);
        return container;
    }

    it('sets the model in fixed mode', () => {
        const container = setup({ needsClientLayout: false });
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        const dispatcher = container.get<MockActionDispatcher>(TYPES.IActionDispatcher);

        const root1: SModelRootSchema = {
            type: 'root',
            id: 'root'
        };
        modelSource.setModel(root1);
        const root2: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'blob',
                    id: 'foo'
                }
            ]
        };
        modelSource.updateModel(root2);

        expect(dispatcher.actions).to.have.lengthOf(2);
        const action0 = dispatcher.actions[0] as SetModelAction;
        expect(action0).to.be.instanceOf(SetModelAction);
        expect(action0.newRoot).to.equal(root1);
        const action1 = dispatcher.actions[1] as UpdateModelAction;
        expect(action1).to.be.instanceOf(UpdateModelAction);
        expect(action1.newRoot).to.equal(root2);
    });

    it('requests bounds in dynamic mode', async () => {
        const container = setup({ needsClientLayout: true });
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        const dispatcher = container.get<MockActionDispatcher>(TYPES.IActionDispatcher);

        const root1: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'child1'
                }
            ]
        };
        const promise1 = modelSource.setModel(root1);
        expect(dispatcher.requests).to.have.lengthOf(1);
        dispatcher.dispatch(new ComputedBoundsAction([
            {
                elementId: 'child1',
                newPosition: { x: 10, y: 10 },
                newSize: { width: 20, height: 20 }
            }
        ], undefined, undefined, dispatcher.requests[0].requestId));
        const root2: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'bar'
                }
            ]
        };
        await promise1;

        const promise2 = modelSource.updateModel(root2);
        expect(dispatcher.requests).to.have.lengthOf(2);
        dispatcher.dispatch(new ComputedBoundsAction([
            {
                elementId: 'bar',
                newPosition: { x: 10, y: 10 },
                newSize: { width: 20, height: 20 }
            }
        ], undefined, undefined, dispatcher.requests[1].requestId));
        await promise2;

        expect(dispatcher.actions).to.have.lengthOf(4);
        const action0 = dispatcher.actions[0] as RequestBoundsAction;
        expect(action0).to.be.instanceOf(RequestBoundsAction);
        expect(action0.newRoot).to.equal(root1);
        const action1 = dispatcher.actions[1] as SetModelAction;
        expect(action1).to.be.instanceOf(SetModelAction);
        expect(action1.newRoot).to.deep.equal({
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'child1',
                    position: { x: 10, y: 10 },
                    size: { width: 20, height: 20 }
                }
            ]
        });
        const action2 = dispatcher.actions[2] as RequestBoundsAction;
        expect(action2).to.be.instanceOf(RequestBoundsAction);
        expect(action2.newRoot).to.equal(root2);
        const action3 = dispatcher.actions[3] as UpdateModelAction;
        expect(action3).to.be.instanceOf(UpdateModelAction);
    });

    it('adds and removes elements', () => {
        const container = setup({ needsClientLayout: false });
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        const dispatcher = container.get<MockActionDispatcher>(TYPES.IActionDispatcher);

        modelSource.setModel({ type: 'root', id: 'root' });
        modelSource.addElements([
            {
                type: 'node',
                id: 'child1'
            },
            {
                type: 'node',
                id: 'child2'
            }
        ]);
        expect(modelSource.model).to.deep.equal({
            type: 'root',
            id: 'root',
            children: [
                {
                type: 'node',
                id: 'child1'
                },
                {
                    type: 'node',
                    id: 'child2'
                }
            ]
        });
        modelSource.removeElements(['child1']);
        expect(modelSource.model).to.deep.equal({
            type: 'root',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'child2'
                }
            ]
        });

        expect(dispatcher.actions).to.have.lengthOf(3);
        const action1 = dispatcher.actions[1] as UpdateModelAction;
        expect(action1.matches).to.deep.equal([
            {
                right: {
                    type: 'node',
                    id: 'child1'
                },
                rightParentId: 'root'
            },
            {
                right: {
                    type: 'node',
                    id: 'child2'
                },
                rightParentId: 'root'
            }
        ]);
        const action2 = dispatcher.actions[2] as UpdateModelAction;
        expect(action2.matches).to.deep.equal([
            {
                left: {
                    type: 'node',
                    id: 'child1'
                },
                leftParentId: 'root'
            }
        ]);
    });

    it('resolves promises in fixed mode', async () => {
        const container = setup({ needsClientLayout: false });
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        const dispatcher = container.get<MockActionDispatcher>(TYPES.IActionDispatcher);

        const root1: SModelRootSchema = {
            type: 'root',
            id: 'root'
        };
        await modelSource.setModel(root1);

        const root2: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [{ type: 'blob', id: 'foo' }]
        };
        await modelSource.updateModel(root2);

        expect(dispatcher.actions).to.have.lengthOf(2);
    });

    it('resolves promises in dynamic mode', async () => {
        const container = setup({ needsClientLayout: true });
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        const dispatcher = container.get<MockActionDispatcher>(TYPES.IActionDispatcher);

        const root1: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [{ type: 'node', id: 'child1' }]
        };
        const promise1 = modelSource.setModel(root1);
        expect(dispatcher.requests).to.have.lengthOf(1);
        dispatcher.dispatch(new ComputedBoundsAction([
            {
                elementId: 'child1',
                newPosition: { x: 10, y: 10 },
                newSize: { width: 20, height: 20 }
             }
        ], undefined, undefined, dispatcher.requests[0].requestId));
        await promise1;

        const root2: SModelRootSchema = {
            type: 'root',
            id: 'root',
            children: [{ type: 'node', id: 'bar' }]
        };
        const promise2 = modelSource.updateModel(root2);
        expect(dispatcher.requests).to.have.lengthOf(2);
        dispatcher.dispatch(new ComputedBoundsAction([
            {
                elementId: 'bar',
                newPosition: { x: 10, y: 10 },
                newSize: { width: 20, height: 20 }
            }
        ], undefined, undefined, dispatcher.requests[1].requestId));
        await promise2;

        expect(dispatcher.actions).to.have.lengthOf(4);
    });
});
