'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let previewUri = vscode.Uri.parse('html-escape://cfjedimaster/html-escape');

    class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
        private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

        public provideTextDocumentContent(uri: vscode.Uri): string {
            return this.createEscapedHtml();
        }

        get onDidChange(): vscode.Event<vscode.Uri> {
            return this._onDidChange.event;
        }

        public update(uri: vscode.Uri) {
            this._onDidChange.fire(uri);
        }

        private createEscapedHtml() {
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

        private snippet(str): string {

            str = str.replace(/&/g, "&amp;");
            str = str.replace(/</g, "&lt;");
            str = str.replace(/>/g, "&gt;");
            str = str.replace(/"/g, "&quot;");
            str = str.replace(/'/g, "&#x27;");
            str = str.replace(/\//g, "&#x2F;");
			
			//Required since we're rendering in HTML itself...
			str = str.replace(/&/g, "&amp;");

			return `
			<body><h1>Escaped HTML</h1>
			<textarea style='width:100%;height:100%'>${str}</textarea>
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
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two).then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });

    });
    context.subscriptions.push(disposable, registration);
}

export function deactivate() {
}