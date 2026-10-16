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

import { ContainerModule, injectable } from 'inversify';
import { Action } from 'sprotty-protocol';
import { describe, expect, it } from 'vitest';
import { IActionDispatcher } from '../base/actions/action-dispatcher.js';
import { ActionHandlerRegistry, IActionHandler } from '../base/actions/action-handler.js';
import { CommandStackOptions } from '../base/commands/command-stack-options.js';
import { Command, CommandExecutionContext } from '../base/commands/command.js';
import { SModelRegistry } from '../base/model/smodel-factory.js';
import { SModelRootImpl } from '../base/model/smodel.js';
import { TYPES } from '../base/types.js';
import { ViewRegistry, configureModelElement, configureView } from '../base/views/view.js';
import { ViewerOptions } from '../base/views/viewer-options.js';
import { selectFeature } from '../features/select/model.js';
import { SGraphView } from '../graph/views.js';
import { SNodeImpl } from '../graph/sgraph.js';
import { LocalModelSource } from '../model-source/local-model-source.js';
import { ModelSource } from '../model-source/model-source.js';
import { ILogger, ConsoleLogger, LogLevel, NullLogger } from '../utils/logging.js';
import { createSprottyDiagram, defaultElements } from './create-diagram.js';
import { RectangularNodeView } from './svg-views.js';

@injectable()
class CustomNodeView extends RectangularNodeView { }

@injectable()
class CustomModelSource extends LocalModelSource { }

@injectable()
class TestCommand extends Command {
    static readonly KIND = 'test-command';
    execute(context: CommandExecutionContext): SModelRootImpl { return context.root; }
    undo(context: CommandExecutionContext): SModelRootImpl { return context.root; }
    redo(context: CommandExecutionContext): SModelRootImpl { return context.root; }
}

@injectable()
class TestActionHandler implements IActionHandler {
    handle(action: Action): void { }
}

@injectable()
class OtherActionHandler implements IActionHandler {
    handle(action: Action): void { }
}

/** Collects the messages a sealed diagram warns about, so they can be asserted on. */
class RecordingLogger extends NullLogger {
    readonly warnings: string[] = [];
    override warn(thisArg: any, message: string): void { this.warnings.push(message); }
}

/**
 * Rebind the logger of an existing diagram. Only possible because the diagram resolves its services
 * lazily: an eagerly built model source would already hold the console logger.
 */
function recordWarnings(container: { load: (m: ContainerModule) => void }): RecordingLogger {
    const logger = new RecordingLogger();
    container.load(new ContainerModule((bind, unbind, isBound, rebind) => {
        rebind(TYPES.ILogger).toConstantValue(logger);
    }));
    return logger;
}

describe('createSprottyDiagram', () => {

    describe('defaults', () => {

        it('logs to the console at warn level, so a missing baseDiv is reported', () => {
            const container = createSprottyDiagram().container;
            expect(container.get<ILogger>(TYPES.ILogger)).to.be.an.instanceOf(ConsoleLogger);
            expect(container.get<LogLevel>(TYPES.LogLevel)).to.equal(LogLevel.warn);
        });

        it('takes a log level, keeping the console logger', () => {
            const container = createSprottyDiagram({ logLevel: LogLevel.log }).container;
            expect(container.get<LogLevel>(TYPES.LogLevel)).to.equal(LogLevel.log);
            expect(container.get<ILogger>(TYPES.ILogger)).to.be.an.instanceOf(ConsoleLogger);
        });

        it('honours LogLevel.none, which is falsy and must not fall back to the default', () => {
            const container = createSprottyDiagram({ logLevel: LogLevel.none }).container;
            expect(container.get<LogLevel>(TYPES.LogLevel)).to.equal(LogLevel.none);
        });

        it('binds LocalModelSource as a singleton', () => {
            const container = createSprottyDiagram().container;
            const source = container.get<ModelSource>(TYPES.ModelSource);
            expect(source).to.be.an.instanceOf(LocalModelSource);
            expect(container.get<ModelSource>(TYPES.ModelSource)).to.equal(source);
        });

        it('leaves the framework viewer options untouched', () => {
            const options = createSprottyDiagram().container.get<ViewerOptions>(TYPES.ViewerOptions);
            expect(options.baseDiv).to.equal('sprotty');
            expect(options.needsClientLayout).to.equal(true);
        });

        it('leaves the framework command stack options untouched', () => {
            const container = createSprottyDiagram().container;
            const options = container.get<CommandStackOptions>(TYPES.CommandStackOptions);
            expect(options.defaultDuration).to.equal(250);
            expect(options.undoHistoryLimit).to.equal(50);
        });

        it('registers a model class and a view for every default type', () => {
            const container = createSprottyDiagram().container;
            const models = container.get<SModelRegistry>(TYPES.SModelRegistry);
            const views = container.get<ViewRegistry>(TYPES.ViewRegistry);
            for (const type of Object.keys(defaultElements)) {
                expect(models.hasKey(type), `model ${type}`).to.equal(true);
                expect(views.hasKey(type), `view ${type}`).to.equal(true);
            }
        });

        it('registers the routing handles the always-loaded routing module creates', () => {
            const views = createSprottyDiagram().container.get<ViewRegistry>(TYPES.ViewRegistry);
            expect(views.hasKey('routing-point')).to.equal(true);
            expect(views.hasKey('volatile-routing-point')).to.equal(true);
        });

        it('names the compartment type "compartment"', () => {
            const views = createSprottyDiagram().container.get<ViewRegistry>(TYPES.ViewRegistry);
            expect(views.hasKey('compartment')).to.equal(true);
            expect(views.hasKey('comp')).to.equal(false);
        });
    });

    describe('elements', () => {

        it('adds a new type', () => {
            const diagram = createSprottyDiagram({
                elements: { 'node:custom': [SNodeImpl, CustomNodeView] }
            });
            const views = diagram.container.get<ViewRegistry>(TYPES.ViewRegistry);
            expect(views.get('node:custom')).to.be.an.instanceOf(CustomNodeView);
        });

        it('replaces a default type instead of throwing', () => {
            const diagram = createSprottyDiagram({
                elements: { 'node': [SNodeImpl, CustomNodeView] }
            });
            const views = diagram.container.get<ViewRegistry>(TYPES.ViewRegistry);
            expect(views.get('node')).to.be.an.instanceOf(CustomNodeView);
        });

        it('applies custom features', () => {
            const marker = Symbol('marker');
            const diagram = createSprottyDiagram({
                elements: { 'node:featured': [SNodeImpl, CustomNodeView, { enable: [marker] }] }
            });
            const models = diagram.container.get<SModelRegistry>(TYPES.SModelRegistry);
            expect(models.get('node:featured', undefined).features?.has(marker)).to.equal(true);
        });
    });

    describe('modelSource', () => {

        it('binds the given implementation', () => {
            const diagram = createSprottyDiagram({ modelSource: CustomModelSource });
            expect(diagram.container.get<ModelSource>(TYPES.ModelSource))
                .to.be.an.instanceOf(CustomModelSource);
        });
    });

    describe('viewerOptions', () => {

        it('merges over the framework defaults rather than replacing them', () => {
            const diagram = createSprottyDiagram({
                viewerOptions: { baseDiv: 'my-diagram', needsClientLayout: false }
            });
            const options = diagram.container.get<ViewerOptions>(TYPES.ViewerOptions);
            expect(options.baseDiv).to.equal('my-diagram');
            expect(options.needsClientLayout).to.equal(false);
            expect(options.hiddenDiv).to.equal('sprotty-hidden');
        });
    });

    describe('commandStackOptions', () => {

        it('merges over the framework defaults rather than replacing them', () => {
            const diagram = createSprottyDiagram({
                commandStackOptions: { undoHistoryLimit: 5 }
            });
            const options = diagram.container.get<CommandStackOptions>(TYPES.CommandStackOptions);
            expect(options.undoHistoryLimit).to.equal(5);
            expect(options.defaultDuration).to.equal(250);
        });
    });

    describe('modules', () => {

        it('loads additional modules', () => {
            const diagram = createSprottyDiagram({
                modules: [new ContainerModule((bind, unbind, isBound) => {
                    configureModelElement({ bind, isBound }, 'node:from-module', SNodeImpl, CustomNodeView);
                })]
            });
            const views = diagram.container.get<ViewRegistry>(TYPES.ViewRegistry);
            expect(views.get('node:from-module')).to.be.an.instanceOf(CustomNodeView);
        });

        it('throws when a module registers a default type, per the layering contract', () => {
            const diagram = createSprottyDiagram({
                modules: [new ContainerModule((bind, unbind, isBound) => {
                    configureModelElement({ bind, isBound }, 'graph', SNodeImpl, SGraphView);
                })]
            });
            expect(() => diagram.container.get<ViewRegistry>(TYPES.ViewRegistry))
                .to.throw(/already registered/);
        });
    });

    it('exposes a container that further modules can be loaded onto', () => {
        const diagram = createSprottyDiagram();
        diagram.container.load(new ContainerModule(bind => {
            bind(TYPES.ISnapper).toConstantValue({ snap: (p: unknown) => p });
        }));
        expect(diagram.container.isBound(TYPES.ISnapper)).to.equal(true);
    });

    it('is a pure factory: this suite runs without a DOM at all', () => {
        expect(typeof document).to.equal('undefined');
        expect(() => createSprottyDiagram()).to.not.throw();
    });
});

describe('SprottyDiagram services', () => {

    it('reports the model source, typed as the option gave it', () => {
        const diagram = createSprottyDiagram({ modelSource: CustomModelSource });
        expect(diagram.modelSource).to.be.an.instanceOf(CustomModelSource);
    });

    it('returns the same model source on repeated access, being a singleton', () => {
        const diagram = createSprottyDiagram();
        expect(diagram.modelSource).to.equal(diagram.modelSource);
        expect(diagram.modelSource).to.equal(diagram.container.get(TYPES.ModelSource));
    });

    it('returns the same action dispatcher on repeated access', () => {
        const diagram = createSprottyDiagram();
        expect(diagram.actionDispatcher).to.equal(diagram.actionDispatcher);
        expect(diagram.actionDispatcher).to.equal(diagram.container.get(TYPES.IActionDispatcher));
    });

    it('resolves nothing until a service is asked for, so a later rebind still takes effect', () => {
        const diagram = createSprottyDiagram();
        const logger = new RecordingLogger();
        diagram.container.load(new ContainerModule((bind, unbind, isBound, rebind) => {
            rebind(TYPES.ILogger).toConstantValue(logger);
        }));
        expect(diagram.container.get<ILogger>(TYPES.ILogger)).to.equal(logger);
    });

    it('is itself an action dispatcher, so it can be passed as one', () => {
        const diagram = createSprottyDiagram();
        const dispatcher: IActionDispatcher = diagram;
        expect(typeof dispatcher.dispatch).to.equal('function');
        expect(typeof dispatcher.dispatchAll).to.equal('function');
        expect(typeof dispatcher.request).to.equal('function');
    });
});

describe('SprottyDiagram.addModelElement', () => {

    it('adds a new element type', () => {
        const diagram = createSprottyDiagram();
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        expect(diagram.container.get<ViewRegistry>(TYPES.ViewRegistry).get('node:custom'))
            .to.be.an.instanceOf(CustomNodeView);
        expect(diagram.container.get<SModelRegistry>(TYPES.SModelRegistry).get('node:custom', undefined))
            .to.be.an.instanceOf(SNodeImpl);
    });

    it('replaces a default element type instead of colliding with it', () => {
        const diagram = createSprottyDiagram();
        diagram.addModelElement('node', SNodeImpl, CustomNodeView);
        expect(diagram.container.get<ViewRegistry>(TYPES.ViewRegistry).get('node'))
            .to.be.an.instanceOf(CustomNodeView);
    });

    it('replaces a type it added itself, so the last call wins', () => {
        const diagram = createSprottyDiagram();
        diagram.addModelElement('node:custom', SNodeImpl, RectangularNodeView);
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        expect(diagram.container.get<ViewRegistry>(TYPES.ViewRegistry).get('node:custom'))
            .to.be.an.instanceOf(CustomNodeView);
    });

    it('applies custom features', () => {
        const diagram = createSprottyDiagram();
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView, { enable: [selectFeature] });
        const element = diagram.container.get<SModelRegistry>(TYPES.SModelRegistry)
            .get('node:custom', undefined);
        expect(element.features?.has(selectFeature)).to.equal(true);
    });

    it('checks the two registries independently, so a view-only type can be completed', () => {
        const diagram = createSprottyDiagram();
        configureView(diagram.container, 'node:custom', CustomNodeView);
        diagram.addModelElement('node:custom', SNodeImpl, RectangularNodeView);
        expect(diagram.container.get<ViewRegistry>(TYPES.ViewRegistry).get('node:custom'))
            .to.be.an.instanceOf(RectangularNodeView);
        expect(diagram.container.get<SModelRegistry>(TYPES.SModelRegistry).get('node:custom', undefined))
            .to.be.an.instanceOf(SNodeImpl);
    });

    it('leaves the container open: a module loaded afterwards still contributes', () => {
        const diagram = createSprottyDiagram();
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        diagram.container.load(new ContainerModule((bind, unbind, isBound) => {
            configureModelElement({ bind, isBound }, 'node:late', SNodeImpl, CustomNodeView);
        }));
        expect(diagram.container.get<ViewRegistry>(TYPES.ViewRegistry).hasKey('node:late'))
            .to.equal(true);
    });
});

describe('SprottyDiagram.addCommand', () => {

    it('makes the command reachable through its action kind', () => {
        const diagram = createSprottyDiagram();
        diagram.addCommand(TestCommand);
        const handlers = diagram.container.get(ActionHandlerRegistry).get(TestCommand.KIND);
        expect(handlers).to.have.lengthOf(1);
        expect(handlers[0].handle({ kind: TestCommand.KIND })).to.be.an.instanceOf(TestCommand);
    });
});

describe('SprottyDiagram.addActionHandler', () => {

    it('registers a handler for an action kind', () => {
        const diagram = createSprottyDiagram();
        diagram.addActionHandler('test', TestActionHandler);
        const handlers = diagram.container.get(ActionHandlerRegistry).get('test');
        expect(handlers).to.have.lengthOf(1);
        expect(handlers[0]).to.be.an.instanceOf(TestActionHandler);
    });

    it('adds handlers rather than replacing them', () => {
        const diagram = createSprottyDiagram();
        diagram.addActionHandler('test', TestActionHandler);
        diagram.addActionHandler('test', OtherActionHandler);
        expect(diagram.container.get(ActionHandlerRegistry).get('test')).to.have.lengthOf(2);
    });
});

describe('SprottyDiagram registration window', () => {

    /**
     * The first dispatched action builds the registries, which is what seals registration. The
     * diagram flags that synchronously, on the call, so these tests never await the dispatch — its
     * promise needs a rendered diagram to resolve.
     */
    function seal(diagram: { dispatch: (a: Action) => Promise<void> }): void {
        diagram.dispatch({ kind: 'test-seal' }).catch(() => { /* needs a DOM to complete */ });
    }

    it('does not warn while registration is still open', () => {
        const diagram = createSprottyDiagram();
        const logger = recordWarnings(diagram.container);
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        diagram.addCommand(TestCommand);
        diagram.addActionHandler('test', TestActionHandler);
        expect(logger.warnings).to.be.empty;
    });

    it('warns when an element type is registered after the first dispatch', () => {
        const diagram = createSprottyDiagram();
        const logger = recordWarnings(diagram.container);
        seal(diagram);
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        expect(logger.warnings).to.have.lengthOf(1);
        expect(logger.warnings[0]).to.contain(`addModelElement('node:custom')`);
        expect(logger.warnings[0]).to.contain('ignored');
    });

    it('warns for a late command and a late action handler too', () => {
        const diagram = createSprottyDiagram();
        const logger = recordWarnings(diagram.container);
        seal(diagram);
        diagram.addCommand(TestCommand);
        diagram.addActionHandler('test', TestActionHandler);
        expect(logger.warnings).to.have.lengthOf(2);
        expect(logger.warnings[0]).to.contain(`addCommand('${TestCommand.KIND}')`);
        expect(logger.warnings[1]).to.contain(`addActionHandler('test')`);
    });

    it('warns rather than throwing, so the diagram carries on', () => {
        const diagram = createSprottyDiagram();
        recordWarnings(diagram.container);
        seal(diagram);
        expect(() => diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView)).to.not.throw();
    });

    it('is sealed by setModel as well, which dispatches', () => {
        const diagram = createSprottyDiagram();
        const logger = recordWarnings(diagram.container);
        diagram.setModel({ type: 'graph', id: 'root' }).catch(() => { /* needs a DOM to complete */ });
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        expect(logger.warnings).to.have.lengthOf(1);
    });

    it('seals element types once the model source is read, which builds the model registry', () => {
        const diagram = createSprottyDiagram();
        const logger = recordWarnings(diagram.container);
        void diagram.modelSource;
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        expect(logger.warnings).to.have.lengthOf(1);
        expect(logger.warnings[0]).to.contain(`addModelElement('node:custom')`);
        expect(diagram.container.get<SModelRegistry>(TYPES.SModelRegistry).hasKey('node:custom'))
            .to.equal(false);
    });

    it('seals element types once the action dispatcher is read, too', () => {
        const diagram = createSprottyDiagram();
        const logger = recordWarnings(diagram.container);
        void diagram.actionDispatcher;
        diagram.addModelElement('node:custom', SNodeImpl, CustomNodeView);
        expect(logger.warnings).to.have.lengthOf(1);
    });

    it('keeps commands and action handlers open after a service is read, until the first dispatch', () => {
        const diagram = createSprottyDiagram();
        const logger = recordWarnings(diagram.container);
        void diagram.modelSource;
        diagram.addCommand(TestCommand);
        diagram.addActionHandler('test', TestActionHandler);
        expect(logger.warnings).to.be.empty;
        expect(diagram.container.get(ActionHandlerRegistry).get('test')).to.have.lengthOf(1);
    });
});
