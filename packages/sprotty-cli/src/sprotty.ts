/********************************************************************************
 * Copyright (c) 2024 TypeFox and others.
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

import { Command } from 'commander';
import puppeteer from 'puppeteer';

interface ExportOptions {
    output?: string
    directory?: string
}

export function sprottyCli(argv: string[]): void {
    const program = new Command();

    program.command('export')
        .argument('<url>', 'The url of the Sprotty page')
        .option('-o, --output <outputFile>', 'The output file', 'diagram.svg')
        .option('-d, --directory <outputDirectory>', 'The output directory', undefined)
        .action(async (url: string, options: ExportOptions) => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            if (options.directory) {
                const client = await page.createCDPSession();
                await client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: options.directory
                });
            }
            await page.goto(url);
            await page.evaluate((evalOptions) => {
                // trigger the export
                document.dispatchEvent(new CustomEvent('export', {detail: {fileName: evalOptions.output}}));
            }, options);

            // wait for the download to finish before closing the browser
            await page.waitForNetworkIdle();
            await browser.close();
        });

    program.parse(argv);

}

// run the command
sprottyCli(process.argv);
