// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid/v4';
import { IExtensions } from '../common/types';
import {
    CellState,
    ICell,
    IJupyterExecutionLogger,
    IJupyterExecutionLoggerRegistration,
    JupyterExecutionLoggerMessages
} from './types';

@injectable()
export class JupyterExecutionLoggerRegistration implements IJupyterExecutionLoggerRegistration {
    private loadedOtherExtensionsPromise: Promise<void> | undefined;

    private loggers = new Map<string, IJupyterExecutionLogger>();

    constructor(@inject(IExtensions) private readonly extensions: IExtensions) {}

    public async getLoggers(): Promise<ReadonlyArray<IJupyterExecutionLogger>> {
        await this.checkOtherExtensions();
        return Promise.all([...this.loggers.values()]);
    }

    public registerLogger(logger: IJupyterExecutionLogger): void {
        if (!this.loggers.has(logger.id)) {
            this.loggers.set(logger.id, logger);
        } else {
            throw new Error(`IJupyterExecutionLogger already exists with id ${logger.id}`);
        }
    }

    public postMessage(message: JupyterExecutionLoggerMessages, code?: string): void {
        this.loggers.forEach((logger) => {
            switch (message) {
                case JupyterExecutionLoggerMessages.notebookOpened:
                    logger.postOpenNotebook();
                    break;
                case JupyterExecutionLoggerMessages.cellExecuted:
                    if (code) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const cell: ICell = {
                            data: {
                                cell_type: 'code',
                                source: code,
                                metadata: {},
                                outputs: [],
                                execution_count: 0 // might need this
                            },
                            id: uuid(),
                            file: '',
                            line: 0,
                            state: CellState.finished // might need this
                        };
                        logger.postExecute(cell);
                    }
                    break;
                case JupyterExecutionLoggerMessages.kernelRestarted:
                    logger.postKernelRestart();
                    break;
                default:
                    break;
            }
        });
    }

    private checkOtherExtensions(): Promise<void> {
        if (!this.loadedOtherExtensionsPromise) {
            this.loadedOtherExtensionsPromise = this.loadOtherExtensions();
        }
        return this.loadedOtherExtensionsPromise;
    }

    private async loadOtherExtensions(): Promise<void> {
        const list = this.extensions.all
            .filter((e) => e.packageJSON?.contributes?.pythonExecutionLogger)
            .map((e) => (e.isActive ? Promise.resolve() : e.activate()));
        await Promise.all(list);
    }
}
