'use strict';

import * as vscode from 'vscode';
import * as escapeHtml from 'escape-html'

/** 
 * Shorties to vscode.Uri.toString 
 * 
 */
class Key {
    static fromUri(uri: vscode.Uri): string {
        return uri.toString();
    }

    static fromDoc(document: vscode.TextDocument): string {
        return this.fromUri(document.uri);
    }

    static fromEditor(editor: vscode.TextEditor): string {
        return this.fromDoc(editor.document);
    }
}

/** 
 * Watching for vscode.workspace.onDidChangeTextDocument for particular document
 * and redirects the event to onDidChange.
 * 
 */
class DocumentWatcher {
    private readonly _subscriptions: Array<vscode.Disposable>;

    private readonly _uri: vscode.Uri;
    private readonly _onDidChange: vscode.EventEmitter<vscode.TextDocument>;

    constructor(uri: vscode.Uri) {
        this._subscriptions = new Array<vscode.Disposable>();

        this._uri = uri;
        this._onDidChange = new vscode.EventEmitter<vscode.TextDocument>();

        vscode.workspace.onDidChangeTextDocument(e => {
            if (Key.fromDoc(e.document) == Key.fromUri(this._uri)) {
                this._onDidChange.fire(e.document);
            }
        }, this, this._subscriptions)
    }

    get onDidChange(): vscode.Event<vscode.TextDocument> {
        return this._onDidChange.event;
    }

    public dispose(): void {
        this._subscriptions.forEach(subscription => subscription.dispose());
        this._onDidChange.dispose();
    }
}

/**  
 * Represents a connection between two documents. Each time the connection changed (i.e. a decoration applied)
 * or source document watcher raises an event the connection raises own onDidChange event.
 * 
*/
class DocumentConnection {
    private readonly _subscriptions: Array<vscode.Disposable>;

    private readonly _destination: vscode.Uri;
    private readonly _source: vscode.Uri;
    private readonly _watcher: DocumentWatcher;
    
    private readonly _onDidChange: vscode.EventEmitter<vscode.Uri>

    private _decorator: HtmlEscapeTextDecorator;
    private _opened: boolean;

    constructor(destination: vscode.Uri, source: vscode.Uri) {
        this._subscriptions = new Array<vscode.Disposable>();

        this._destination = destination;
        this._source = source;

        this._watcher = new DocumentWatcher(source);
        this._onDidChange = new vscode.EventEmitter<vscode.Uri>();

        this._watcher.onDidChange(() => {

            this._pulse();

        }, this, this._subscriptions);
    }

    get destination(): vscode.Uri {
        return this._destination;
    }

    get source(): vscode.Uri {
        return this._source;
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public decorate(decorator: HtmlEscapeTextDecorator): void {
        this._decorator = decorator;
        if (this._opened) {
            this._pulse();
        }
    }

    public read(): string {
        let document = vscode.workspace.textDocuments.find(doc => Key.fromDoc(doc) == Key.fromUri(this._source));
        if (document) {
            return this._decorator.read(document);
        }
        return null;
    }

    public open(): void {
        this._opened = true;
        this._pulse();
    }

    public dispose(): void {
        this._subscriptions.forEach(subscription => subscription.dispose());
        this._watcher.dispose();
    }

    private _pulse(): void {
        this._onDidChange.fire(this._destination);
    }
}

/**
 * vscode.TextDocument text decorator. When selects the content (portions) of the document and escapes them.
 */
class HtmlEscapeTextDecorator {
    private _portions: Array<vscode.Selection>;

    constructor(portions?: Array<vscode.Selection>) {
        this._portions = portions;
    }
    
    public read(document: vscode.TextDocument): string {
        let portions = this._portions;
        if (portions == null || (portions.length == 1 && portions[0].isEmpty)) {
            portions = [
                new vscode.Selection(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end)
            ];
        }

        let outputText = new Array<string>();

        portions.forEach((portion, index) => {
            if (index > 0) {
                let cap = (portions[index].start.line - portions[index - 1].end.line) - 1;
                for (let i = 0; i < cap; ++i) {
                    outputText.push('');
                }
            }

            let v = escapeHtml(document.getText(portion));

            outputText.push(v);
        });

        switch (document.eol) {
            case vscode.EndOfLine.CRLF: return outputText.join('\r\n');
            case vscode.EndOfLine.LF: return outputText.join('\n');
            default: return outputText.join('');
        }
    }
}

/**
 * The content provider that allows to stream HTML escaped content of the existing
 * document to one of its 'preview' documents.
 * 
 */
export class HtmlEscapeTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    static readonly scheme: string = 'html-escape';
    static readonly previewDocument: string = 'preview-document';

    private _disposables: Array<vscode.Disposable>;

    private _connections: Map<string, DocumentConnection>;

    private _onDidChangeEvent: vscode.EventEmitter<vscode.Uri>;

    constructor() {
        this._disposables = new Array<vscode.Disposable>();

        this._connections = new Map<string, DocumentConnection>();

        this._onDidChangeEvent = new vscode.EventEmitter<vscode.Uri>();

        this._disposables.push(this._onDidChangeEvent);
    }

    dispose() : void {
        this._disposables.forEach(item => item.dispose());
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChangeEvent.event;
    }

    public provideTextDocumentContent(uri: vscode.Uri): string {
        let connection = this._connections.get(Key.fromUri(uri));
        if (connection) {
            return connection.read();
        }
        return '';
    }

    public show(previewUri: vscode.Uri, uri: vscode.Uri, portions?: Array<vscode.Selection>) {
        let connection = this._connections.get(Key.fromUri(previewUri));
        if (connection) {
            if (Key.fromUri(connection.source) == Key.fromUri(uri)) {
                connection.decorate(new HtmlEscapeTextDecorator(portions));
                return;
            }
            connection.dispose();
        }

        connection = new DocumentConnection(previewUri, uri);

        this._connections.set(Key.fromUri(previewUri), connection);
        
        connection.onDidChange(uri => {
            
            this._onDidChangeEvent.fire(uri);
            
        }, this);
        connection.decorate(new HtmlEscapeTextDecorator(portions));
        connection.open();        
    }
}

export function createPreviewUri(name: string, id: string): vscode.Uri {
    return vscode.Uri.parse(`${HtmlEscapeTextDocumentContentProvider.scheme}://${HtmlEscapeTextDocumentContentProvider.previewDocument}/${name}?id=${id}`)
}