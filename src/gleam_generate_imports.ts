// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import {
  removePostFix,
  setPathExt,
  erlangPathToGleamPath,
  gleamPathToErlangPath,
  getPathExt,
  gleamPathToErlangModulePath,
  getModuleName,
  getFileNameWithoutExtension,
  removeArity,
  findAllModuleNameDotFunctionName,
  getSymbolUnderCursor,
} from "./extension_sub";
import { send_to_clipboard, send_to_terminal } from "./send_to";


export function activate(context: vscode.ExtensionContext) {


  //
  function gleam_auto_import() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;

    let entries = findAllModuleNameDotFunctionName(document);

    // dictionary: module_name: [function_name,...]
    let modules = new Map<string, string[]>();
    for (let entry of entries) {
      let [module_name, function_name] = entry.split(".");
      if (modules.has(module_name)) {
        let function_names = modules.get(module_name);
        if (function_names) {
          function_names.push(function_name);
        }
      } else {
        modules.set(module_name, [function_name]);
      }
    }

    // comment out the overlapping import statements
    let target_imports: string[] = [];
    for (let module_name of modules.keys()) {
      target_imports.push(`import gleam/${module_name}`);
    }
    editor.edit((editBuilder) => {
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const text = line.text;
        for (let target_import of target_imports) {
          if (text.startsWith(target_import)) {
            const range = new vscode.Range(i, 0, i, text.length);
            editBuilder.replace(range, "//QoL: " + text);
          }
        }
      }

      // insert import statement to the top of the document
      let import_statements = "";
      //for (let [module_name, function_names] of modules) {
      //  import_statements += `import gleam/${module_name}.\{${function_names.join(
      //    ", "
      //  )}\}\n`;
      //}
      for (let module_name of modules.keys()) {
        import_statements += `import gleam/${module_name}\n`;
      }

      const position = new vscode.Position(0, 0);
      editBuilder.insert(position, import_statements);
    });
  }

  let cmd_gleam_auto_import = vscode.commands.registerCommand(
    "vscode-gleam-qol.gleam_auto_import",
    gleam_auto_import
  );
  context.subscriptions.push(cmd_gleam_auto_import);

}