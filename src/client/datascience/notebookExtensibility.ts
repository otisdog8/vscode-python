import { injectable } from 'inversify';
import { Event, EventEmitter } from 'vscode';
import type { NotebookCell } from 'vscode-proposed';
import { INotebookExtensibility } from './types';

@injectable()
export class NotebookExtensibility implements INotebookExtensibility {
    private notebookOpened = new EventEmitter<void>();

    private kernelExecute = new EventEmitter<NotebookCell>();

    private kernelRestart = new EventEmitter<void>();

    public get onNotebookOpened(): Event<void> {
        return this.notebookOpened.event;
    }

    public get onKernelExecute(): Event<NotebookCell> {
        return this.kernelExecute.event;
    }

    public get onKernelRestart(): Event<void> {
        return this.kernelRestart.event;
    }

    public fireKernelRestart(): void {
        this.kernelRestart.fire();
    }

    public fireKernelExecute(cell: NotebookCell): void {
        this.kernelExecute.fire(cell);
    }

    public fireNotebookOpened(): void {
        this.notebookOpened.fire();
    }
}
