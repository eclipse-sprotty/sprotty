/********************************************************************************
 * Copyright (c) 2023 TypeFox and others.
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

import Generator from 'yeoman-generator';
import chalk from 'chalk';
import path from 'path';

const TEMPLATE_DIR = '../sprotty-local-template';
const USER_DIR = '.';

const PROJECT_NAME = /<%= project-name %>/g;
const HTML_ELEMENT_ID = /<%= html-element-id %>/g;
const OUT_PATH = /<%= out-path %>/g;

const PROJECT_PATH = /<%= project-path %>/g;

interface Answers {
    projectName: string;
    mainElementId: string;
    generateStatic: boolean;
}

function description(...d: string[]): string {
    return chalk.reset(chalk.dim(d.join(' ') + '\n')) + chalk.blueBright('?');
}

class SprottyGenerator extends Generator {
    private answers: Answers;

    writing(): void {
        this.sourceRoot(path.join(__dirname, TEMPLATE_DIR));

        for (const file of ['package.json', 'tsconfig.json', 'src']) {
            this.fs.copy(
                this.templatePath(file),
                this._projectPath(file),
                {
                    process: content =>
                        this._replaceTemplateWords(content),
                    processDestinationPath: destPath =>
                        this._replaceTemplateNames(destPath),
                }
            );
        }
        console.log('generate static: ' + this.answers.generateStatic);
        if (this.answers.generateStatic) {
            this.fs.copy(
                this.templatePath('static'),
                this._projectPath('static'),
                {
                    process: content =>
                        this._replaceTemplateWords(content),
                    processDestinationPath: destPath =>
                        this._replaceTemplateNames(destPath),
                }
            );
        }
    }

    install(): void {
        const extensionPath = this._projectPath();

        const opts = { cwd: extensionPath };
        this.spawnCommandSync('npm', ['install'], opts);
        this.spawnCommandSync('npm', ['run', 'build'], opts);
    }

    async prompting(): Promise<void> {
        this.answers = await this.prompt([
            {
                type: 'input',
                name: 'projectName',
                prefix: description(
                    'Welcome to Sprotty!\n' +
                    'This tool generates a new Sprotty project.\n' +
                    'The project name identifies the npm package and can be used by other packages to depend on this project.'
                ),
                message: 'Your project name:',
                default: 'hello-world',
            },
            {
                type: 'input',
                name: 'mainElementId',
                prefix: description('Your Sprotty diagram will be rendered inside this element.'),
                message: 'Main HTML element ID:',
                default: 'sprotty-diagram',
            },
            {
                type: 'confirm',
                name: 'generateStatic',
                prefix: description('Generate a static folder with index.html and styles.css for simple dev setup.'),
                message: 'Generate static folder',
            },
        ]);
    }

    _projectPath(...projectPath: string[]): string {
        return this.destinationPath(USER_DIR, this.answers.projectName, ...projectPath);
    }

    _replaceTemplateWords(content: Buffer): string {
        return content.toString()
            .replace(PROJECT_NAME, this.answers.projectName)
            .replace(HTML_ELEMENT_ID, this.answers.mainElementId)
            .replace(OUT_PATH, this.answers.generateStatic ? 'static' : 'out');
    }

    _replaceTemplateNames(templatePath: string): string {
        return templatePath.replace(PROJECT_PATH, this.answers.projectName);
    }

}

export = SprottyGenerator;
