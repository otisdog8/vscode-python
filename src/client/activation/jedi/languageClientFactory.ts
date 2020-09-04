// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { inject, injectable } from 'inversify';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

import { EXTENSION_ROOT_DIR, PYTHON_LANGUAGE } from '../../common/constants';
import { Resource } from '../../common/types';
import { IInterpreterService } from '../../interpreter/contracts';
import { PythonEnvironment } from '../../pythonEnvironments/info';
import { ILanguageClientFactory } from '../types';

// tslint:disable:no-require-imports no-require-imports no-var-requires max-classes-per-file
const languageClientName = 'Python Tools';

@injectable()
export class JediLanguageClientFactory implements ILanguageClientFactory {
    constructor(@inject(IInterpreterService) private interpreterService: IInterpreterService) {}

    public async createLanguageClient(
        resource: Resource,
        _interpreter: PythonEnvironment | undefined,
        clientOptions: LanguageClientOptions
    ): Promise<LanguageClient> {
        const jediServerModulePath = path.join(EXTENSION_ROOT_DIR, 'pythonFiles', 'lib', 'jedi_language_server');
        const interpreter = await this.interpreterService.getActiveInterpreter(resource);
        const pythonPath = interpreter ? interpreter.path : 'python';
        const args = ['-m', `"${jediServerModulePath}"`];

        // If the extension is launched in debug mode, then the debug server options are used.
        const serverOptions: ServerOptions = {
            run: {
                module: pythonPath,
                transport: TransportKind.ipc,
                args
            },
            debug: {
                module: pythonPath,
                transport: TransportKind.ipc,
                args
            }
        };

        const vscodeLanguageClient = require('vscode-languageclient/node') as typeof import('vscode-languageclient/node');
        return new vscodeLanguageClient.LanguageClient(
            PYTHON_LANGUAGE,
            languageClientName,
            serverOptions,
            clientOptions
        );
    }
}
