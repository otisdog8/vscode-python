'use strict';

import {
    CancellationToken,
    DocumentSymbol,
    DocumentSymbolProvider,
    Location,
    Range,
    SymbolInformation,
    SymbolKind,
    TextDocument,
    Uri
} from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

function flattenSymbolTree(tree: DocumentSymbol, uri: Uri, containerName: string = ''): SymbolInformation[] {
    const flattened: SymbolInformation[] = [];

    const range = new Range(
        tree.range.start.line,
        tree.range.start.character,
        tree.range.end.line,
        tree.range.end.character
    );
    // For whatever reason, the values of VS Code's SymbolKind enum
    // are off-by-one relative to the LSP:
    //  https://microsoft.github.io/language-server-protocol/specification#document-symbols-request-leftwards_arrow_with_hook
    const kind: SymbolKind = tree.kind - 1;
    const info = new SymbolInformation(
        tree.name,
        // Type coercion is a bit fuzzy when it comes to enums, so we
        // play it safe by explicitly converting.
        // tslint:disable-next-line:no-any
        (SymbolKind as any)[(SymbolKind as any)[kind]],
        containerName,
        new Location(uri, range)
    );
    flattened.push(info);

    if (tree.children && tree.children.length > 0) {
        // FYI: Jedi doesn't fully-qualify the container name so we
        // don't bother here either.
        //const fullName = `${containerName}.${tree.name}`;
        for (const child of tree.children) {
            const flattenedChild = flattenSymbolTree(child, uri, tree.name);
            flattened.push(...flattenedChild);
        }
    }

    return flattened;
}

/**
 * Provides Python symbols to VS Code (from the language server).
 *
 * See:
 *   https://code.visualstudio.com/docs/extensionAPI/vscode-api#DocumentSymbolProvider
 */
export class LanguageServerSymbolProvider implements DocumentSymbolProvider {
    constructor(private readonly languageClient: LanguageClient) {}

    public async provideDocumentSymbols(
        document: TextDocument,
        token: CancellationToken
    ): Promise<SymbolInformation[]> {
        const uri = document.uri;
        const args = { textDocument: { uri: uri.toString() } };
        const raw = await this.languageClient.sendRequest<DocumentSymbol[]>('textDocument/documentSymbol', args, token);
        const symbols: SymbolInformation[] = [];
        for (const tree of raw) {
            const flattened = flattenSymbolTree(tree, uri);
            symbols.push(...flattened);
        }
        return Promise.resolve(symbols);
    }
}
