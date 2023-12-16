import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "vscode-gleam-qol.gleam_beautify_import",
    function () {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const text = document.getText();

        // 各行に分割
        const lines = text.split("\n");

        // importで始まる行を抽出
        const importLines = lines.filter((line: string) => line.startsWith("import"));

        // import行をソート
        importLines.sort();

        // importで始まる行を除去
        const remainingLines = lines.filter(
          (line: string) => !line.startsWith("import")
        );

        // ソートされたimport行と残りの行を連結
        const sortedText =
          importLines.join("\n").trim() +
          "\n\n" +
          remainingLines.join("\n").trim();

        // ドキュメント全体を新しいテキストで置き換える
        editor.edit((editBuilder) => {
          const startPos = new vscode.Position(0, 0);
          const endPos = new vscode.Position(
            document.lineCount - 1,
            document.lineAt(document.lineCount - 1).text.length
          );
          const range = new vscode.Range(startPos, endPos);

          editBuilder.replace(range, sortedText);
        });
      }
    }
  );

  context.subscriptions.push(disposable);
}
