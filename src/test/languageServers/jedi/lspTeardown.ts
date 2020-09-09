// Licensed under the MIT License.

import * as fs from 'fs-extra';
import * as path from 'path';

// Rewrite settings json so we're not overriding the experiment values
const settingsJsonPath = path.join(__dirname, '..', '..', '..', '..', 'src', 'test', '.vscode', 'settings.json');
const settingsJsonPromise = import('../../.vscode/settings.json');
// tslint:disable-next-line: no-floating-promises
settingsJsonPromise.then((settingsJson) => {
    // tslint:disable-next-line: no-any
    return fs.writeFile(settingsJsonPath, JSON.stringify(settingsJson, undefined, ' '));
});
