// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as fs from 'fs-extra';
import * as path from 'path';
import { JediLSP } from '../../../client/common/experiments/groups';

// Modify settings.json so that it turns on the LSP experiment
const settingsJsonPath = path.join(__dirname, '..', '..', '..', '..', 'src', 'test', '.vscode', 'settings.json');
const settingsJsonPromise = import('../../.vscode/settings.json');
// tslint:disable-next-line: no-floating-promises
settingsJsonPromise.then((settingsJson) => {
    // tslint:disable-next-line: no-any
    (<any>settingsJson)['python.experiments.optInto'] = [JediLSP.experiment];
    return fs.writeFile(settingsJsonPath, JSON.stringify(settingsJson, undefined, ' '));
});
