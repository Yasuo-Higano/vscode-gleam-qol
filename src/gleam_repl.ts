import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log("gleam-qol:gleam_repl activated");

    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        decorate(activeEditor);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        console.log("onDidChangeActiveTextEditor: ", editor);
        activeEditor = editor;
        if (editor) {
            decorate(editor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        console.log("onDidChangeTextDocument: ", event.document);
        if (activeEditor && event.document === activeEditor.document) {
            decorate(activeEditor);
        }
    }, null, context.subscriptions);

    function decorate(editor: vscode.TextEditor) {
        const decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' おしまい', // ここに表示したい文字列を書く
                color: 'red' // 文字色を指定する
            }
        });

        const regEx = /.+$/gm;
        const text = editor.document.getText();
        const decorations = [];
        let match;
        while (match = regEx.exec(text)) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: '行末に文字を表示' };
            decorations.push(decoration);
        }
        editor.setDecorations(decorationType, decorations);
    }
}
