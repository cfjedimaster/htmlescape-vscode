/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let previewUri = vscode.Uri.parse('html-escape://cfjedimaster/html-escape');

    class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
        private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

        public provideTextDocumentContent(uri: vscode.Uri): string {
            return this.createEscapedHTML();
        }

        get onDidChange(): vscode.Event<vscode.Uri> {
            return this._onDidChange.event;
        }

        public update(uri: vscode.Uri) {
            this._onDidChange.fire(uri);
        }

        private createEscapedHTML() {
            let editor = vscode.window.activeTextEditor;
            return this.extractSnippet();
        }

        private extractSnippet(): string {
            let editor = vscode.window.activeTextEditor;
			//if we have a selection, use that, otherwise, whole document
			console.log('is it empty? '+editor.selection.isEmpty);
			if(editor.selection.isEmpty) {
	            return this.snippet(editor.document.getText());
			} else {
				console.log('return selection');
				//there must be a better way of doing this
	            let selStart = editor.document.offsetAt(editor.selection.anchor);
				let selEnd = editor.document.offsetAt(editor.selection.end);
				return this.snippet(editor.document.getText().slice(selStart,selEnd));
			}
        }

        private errorSnippet(error: string): string {
            return `
                <body>
                    ${error}
                </body>`;
        }

        private snippet(str: string): string {

            str = str.replace(/&/g, "&amp;");
            str = str.replace(/</g, "&lt;");
            str = str.replace(/>/g, "&gt;");
            str = str.replace(/"/g, "&quot;");
            str = str.replace(/'/g, "&#x27;");
            str = str.replace(/\//g, "&#x2F;");
			
			//Required since we're rendering in HTML itself...
			str = str.replace(/&/g, "&amp;");

			return `
            <style>
            body {
                margin-top:10px;
                margin-left:10px;
                margin-right:10px;
            }
            
            textarea {
                width:95%;
                height:500px;
            }
            </style>
			<body>
			<textarea>${str}</textarea>
			</body>
			`
        }
    }

    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('html-escape', provider);

    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
        if (e.textEditor === vscode.window.activeTextEditor) {
            provider.update(previewUri);
        }
    })

    let disposable = vscode.commands.registerCommand('extension.showHtmlEscape', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Escaped HTML').then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });

    let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(200,200,200,.35)' });

    vscode.commands.registerCommand('extension.showHtmlEscape', (uri: vscode.Uri, propStart: number, propEnd: number) => {

        for (let editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() === uri.toString()) {
                let start = editor.document.positionAt(propStart);
                let end = editor.document.positionAt(propEnd + 1);

                editor.setDecorations(highlight, [new vscode.Range(start, end)]);
                setTimeout(() => editor.setDecorations(highlight, []), 1500);
            }
        }
    });

    context.subscriptions.push(disposable, registration);
}

export function deactivate() {
}