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

  function erlang_abracadabra() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;

      const module_name = getModuleName(document.fileName);

      const module_regex = /-\s*module\s*\(/;
      const export_regex = /-\s*export\s*\(/;
      const export_all_regex = /-\s*compile\s*\(\s*export_all/;

      let def_module = -1;
      let def_export = -1;
      let def_export_all = -1;
      editor.edit((editBuilder) => {
        for (let i = 0; i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const text = line.text;
          //console.log("line: ",i,text)
          if (def_export == -1 && export_regex.test(text)) {
            //console.log("export_regex: ",i);
            def_export = i;
          }
          if (def_export_all == -1 && export_all_regex.test(text)) {
            //console.log("export_all_regex: ",i);
            def_export_all = i;
          } else if (def_module == -1 && module_regex.test(text)) {
            //console.log("module_regex: ",i);
            def_module = i;

            const regex = /-\s*module\s*\(\s*(\w+)\s*\)/;
            const match = regex.exec(text);
            if (match && match[1]) {
              const oldName = match[1];
              if (oldName != module_name) {
                const newText = text.replace(oldName, module_name);
                const range = new vscode.Range(i, 0, i, text.length);
                editBuilder.replace(range, newText);
              }
            }
          }
        }
        //console.log("def_module: " + def_module);
        //console.log("def_export: " + def_export);
        //console.log("def_export_all: " + def_export_all);

        if (def_module == -1) {
          const position = new vscode.Position(0, 0);
          editBuilder.insert(position, `-module(${module_name}).\n`);
          def_module = 0;
        }

        if (def_export == -1 && def_export_all == -1) {
          const position = new vscode.Position(def_module + 1, 0);
          editBuilder.insert(position, `-compile(export_all).\n`);
          def_module = 0;
        }
      });
    }
  }


  //
  let cmd_erlang_abracadabra = vscode.commands.registerCommand(
    "vscode-gleam-qol.erlang_abracadabra",
    erlang_abracadabra
  );
  context.subscriptions.push(cmd_erlang_abracadabra);
}