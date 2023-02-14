import Generator from 'yeoman-generator';
import chalk from 'chalk';
import path from 'path';

const TEMPLATE_DIR = '../sprotty-local-template';
const USER_DIR = '.';

const PROJECT_NAME = /<%= project-name %>/g;
const HTML_ELEMENT_ID = /<%= html-element-id %>/g;

const PROJECT_PATH = /<%= project-path %>/g;

interface Answers {
    projectName: string;
    mainElementId: string;
    generateStatic: boolean;
}

function description(...d: string[]): string {
    return chalk.reset(chalk.dim(d.join(' ') + '\n')) + chalk.blueBright('?');
}

export class SprottyGenerator extends Generator {
    private answers: Answers;

    constructor(args: string | string[], options: Generator.GeneratorOptions) {
        super(args, options);
    }

    writing(): void {
        this.sourceRoot(path.join(__dirname, TEMPLATE_DIR));

        for (const path of ['.', '.vscode', '.eslintrc.json', '.vscodeignore']) {
            this.fs.copy(
                this.templatePath(path),
                this._projectPath(path),
                {
                    process: content =>
                        this._replaceTemplateWords(content),
                    processDestinationPath: path =>
                        this._replaceTemplateNames(path),
                }
            );
        }
    }

    install(): void {
        const extensionPath = this._projectPath();

        const opts = { cwd: extensionPath };
        this.spawnCommandSync('npm', ['install'], opts);
        this.spawnCommandSync('npm', ['run', 'langium:generate'], opts);
        this.spawnCommandSync('npm', ['run', 'build'], opts);
    }

    async prompting(): Promise<void> {
        this.answers = await this.prompt([
            {
                type: 'input',
                name: 'projectName',
                prefix: description(
                    'Welcome to Sprotty!',
                    'This tool generates a new Sprotty Project',
                    'The prject name is an identifier used in the extension marketplace or package registry.'
                ),
                message: 'Your project name:',
                default: 'hello-world',
            },
            {
                type: 'input',
                name: 'mainElementId',
                message: 'ID of your main html element for the sprotty diagram:',
                default: 'sprotty-diagram',
            },
            {
                type: 'confirm',
                name: 'generateStatic',
                message: 'generate static folder with index.html and styles.css',
            },
        ])
    }

    _projectPath(...path: string[]): string {
        return this.destinationPath(USER_DIR, this.answers.projectName, ...path);
    }

    _replaceTemplateWords(content: Buffer): string {
        return content.toString()
            .replace(PROJECT_NAME, this.answers.projectName)
            .replace(HTML_ELEMENT_ID, this.answers.mainElementId);
    }

    _replaceTemplateNames(path: string): string {
        return path.replace(PROJECT_PATH, this.answers.projectName);
    }

}