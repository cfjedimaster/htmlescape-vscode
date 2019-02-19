'use strict';

import * as vscode from 'vscode';
import * as htmlEsc from './html-escape/html-escape';
 
export function activate(context: vscode.ExtensionContext) {
    const id: string = '30E6F79F-8885-4955-91BB-3FA8ED71ECF8';
    const name: string = 'Escaped Html';
    const previewUri: vscode.Uri = htmlEsc.createPreviewUri(name, id);

    const provider = new htmlEsc.HtmlEscapeTextDocumentContentProvider();

    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(htmlEsc.HtmlEscapeTextDocumentContentProvider.scheme, provider));

    context.subscriptions.push(vscode.commands.registerCommand('extension.showHtmlEscape', async () => {
        let previewDocument = await vscode.workspace.openTextDocument(previewUri);
        let previewEditorShowOptions: vscode.TextDocumentShowOptions = {
            viewColumn: vscode.ViewColumn.Beside, 
            preview: true,
            preserveFocus: true,
            selection: new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0))
        };

        await vscode.window.showTextDocument(previewDocument, previewEditorShowOptions);

        let activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor && activeTextEditor.document.uri.scheme != htmlEsc.HtmlEscapeTextDocumentContentProvider.scheme) {
            provider.show(previewUri, activeTextEditor.document.uri, activeTextEditor.selections);
        }
    }));

    vscode.window.onDidChangeActiveTextEditor(async activeTextEditor => {
        if (activeTextEditor && activeTextEditor.document.uri.scheme != htmlEsc.HtmlEscapeTextDocumentContentProvider.scheme) {
            provider.show(previewUri, activeTextEditor.document.uri, activeTextEditor.selections);
        }
    }, this, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection(async event => {
        let editor = event.textEditor;
        if (editor && editor.document.uri.scheme != htmlEsc.HtmlEscapeTextDocumentContentProvider.scheme) {
            provider.show(previewUri, editor.document.uri, event.selections);
        }
    }, this, context.subscriptions);
}

export function deactivate() {
}
