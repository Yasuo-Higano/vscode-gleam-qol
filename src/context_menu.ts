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
import {activate as activate_gleam_generate_imports} from "./gleam_generate_imports"
import {activate as activate_gleam_beautify_imports} from "./gleam_beautify_imports"
import {activate as activate_erlang_abracadabra} from "./erlang_abracadabra"


function openDocument(path: string) {
  let openPath = vscode.Uri.file(path); // サニタイズされたパス
  vscode.workspace.openTextDocument(openPath).then((doc) => {
    vscode.window.showTextDocument(doc);
  });
}

async function getFunctionName() {
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    let cursorPosition = editor.selection.active;
    const doc = editor.document;

    const symbols: vscode.DocumentSymbol[] =
      await vscode.commands.executeCommand(
        "vscode.executeDocumentSymbolProvider",
        doc.uri
      );

    if (symbols) {
      let functionSymbol = getEnclosingFunctionSymbol(symbols, cursorPosition);
      if (functionSymbol) {
        let functionName = functionSymbol.name;
        return functionName;
      }
    }
  }
  return null;
}

function getEnclosingFunctionSymbol(
  symbols: vscode.DocumentSymbol[],
  position: vscode.Position
): vscode.DocumentSymbol | undefined {
  for (const symbol of symbols) {
    if (symbol.range.contains(position)) {
      if (symbol.kind === vscode.SymbolKind.Function) {
        return symbol;
      } else if (symbol.children.length > 0) {
        return getEnclosingFunctionSymbol(symbol.children, position);
      }
    }
  }

  return undefined;
}

function open_or_new_document(newFullPath: string) {
  fs.access(newFullPath, fs.constants.F_OK, (err) => {
    if (err) {
      // ファイルが存在しない場合、新規作成
      let dir = path.dirname(newFullPath);

      // ディレクトリが存在しない場合、ディレクトリを作成
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let file_header = "";
      switch (getPathExt(newFullPath)) {
        case ".gleam":
          file_header = "pub ";
          break;
        case ".erl":
          let module_name = getModuleName(newFullPath);
          file_header = `-module(${module_name}).\n-compile(export_all).\n\n`;
          break;
        default:
          break;
      }

      fs.writeFile(newFullPath, file_header, (err) => {
        if (err) {
          vscode.window.showErrorMessage("Failed to create file");
        } else {
          openDocument(newFullPath);
        }
      });
    } else {
      // ファイルが存在する場合、開く
      openDocument(newFullPath);
    }
  });
}

function transformPath(
  workspaceRoot: string,
  docPath: string,
  srcDir: string,
  srcExt: string,
  dstDir: string,
  dstExt: string,
  postFix: string
) {
  let relativePath = "/" + path.relative(workspaceRoot, docPath);
  console.log(`relativePath: ${relativePath}`);

  let chooseFirst = true;
  if (srcDir === dstDir) {
    console.log("srcDir === dstDir");
    if (getPathExt(docPath) === srcExt) {
      console.log("getPathExt(docPath) === srcExt");
      chooseFirst = true;
    } else {
      console.log("getPathExt(docPath) != srcExt");
      chooseFirst = false;
    }
  } else {
    if (relativePath.indexOf(srcDir) !== -1) {
      console.log("relativePath.indexOf(srcDir) !== -1");
      chooseFirst = true;
    } else {
      console.log("relativePath.indexOf(srcDir) == -1");
      chooseFirst = false;
    }
  }

  let newPath = "";
  if (chooseFirst) {
    console.log("** chooseFirst **");
    newPath = relativePath.replace(srcDir, dstDir);

    // ファイルパスの拡張子の前に "_test" を追加
    let parsedPath = path.parse(newPath);
    parsedPath.name += postFix;
    //parsedPath.base = parsedPath.name + parsedPath.ext;
    parsedPath.base = parsedPath.name + dstExt;
    newPath = path.format(parsedPath);
  } else {
    console.log("** chooseSecond **");
    newPath = relativePath.replace(dstDir, srcDir);

    // 拡張子の前にある_testを削除
    //newPath = newPath.replace(/(_test)(?=\.[^.]+$)/, "");
    newPath = removePostFix(newPath, postFix);
    newPath = setPathExt(newPath, srcExt);
  }
  console.log(`newPath: ${newPath}`);

  let newFullPath = path.join(workspaceRoot, newPath).replace("//", "/");
  console.log(`newFullPath: ${newFullPath}`);

  return newFullPath;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-gleam-qol" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "vscode-gleam-qol.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from vscode-gleam-qol!"
      );
    }
  );
  context.subscriptions.push(disposable);

  function generate_erlang_path_sender(send: (text: string) => void) {
    return async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;

        let docPath = document.fileName;
        let workspaceFolders = vscode.workspace.workspaceFolders;
        let function_name = await getFunctionName();
        console.log(`function_name: ${function_name}`);
        if (workspaceFolders) {
          let workspaceRoot = workspaceFolders[0].uri.fsPath + "/src";
          if (getPathExt(docPath) === ".gleam") {
            let module = gleamPathToErlangModulePath(workspaceRoot, docPath);
            let erlang_path = module;
            if (function_name != null) {
              erlang_path = module + ":" + function_name;
            }
            send(erlang_path);
          } else {
            //let module_name = getFileNameWithoutExtension( docPath );
            let module_name = getModuleName(docPath);
            let erlang_path = module_name;
            if (function_name != null) {
              function_name = removeArity(function_name);
              erlang_path = module_name + ":" + function_name;
            }
            send(erlang_path);
          }
        }
      }
    };
  }


  //
  let cmd_copy_erlang_path = vscode.commands.registerCommand(
    "vscode-gleam-qol.copy_erlang_path",
    generate_erlang_path_sender(send_to_clipboard)
  );
  context.subscriptions.push(cmd_copy_erlang_path);
  //
  let cmd_send_erlang_path_to_terminal = vscode.commands.registerCommand(
    "vscode-gleam-qol.send_erlang_path_to_terminal",
    generate_erlang_path_sender((doc) => send_to_terminal(doc, false))
  );
  context.subscriptions.push(cmd_send_erlang_path_to_terminal);
  //

  //

  let jump_to_ffi_or_gleam = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;

      let docPath = document.fileName;
      let workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        let workspaceRoot = workspaceFolders[0].uri.fsPath;
        if (getPathExt(docPath) === ".erl") {
          docPath = setPathExt(
            erlangPathToGleamPath(workspaceRoot, docPath),
            ".erl"
          );
        }

        let newFullPath = transformPath(
          workspaceRoot,
          docPath,
          "/src/",
          ".gleam",
          "/src/",
          ".erl",
          "_ffi"
        );
        if (getPathExt(newFullPath) === ".erl") {
          console.log(`newFullPath: ${newFullPath}`);
          console.log(`workspaceRoot: ${workspaceRoot}`);
          newFullPath = gleamPathToErlangPath(
            workspaceRoot + "/src",
            newFullPath
          );
          console.log(`newFullPath 2: ${newFullPath}`);
        }
        open_or_new_document(newFullPath);

        let function_name = getFunctionName();
        console.log(`function_name: ${function_name}`);
      }
    }
  };

  //
  let cmd_jump_to_erlang_ffi = vscode.commands.registerCommand(
    "vscode-gleam-qol.jump_to_erlang_ffi",
    jump_to_ffi_or_gleam
  );
  context.subscriptions.push(cmd_jump_to_erlang_ffi);

  //
  let cmd_jump_to_gleam = vscode.commands.registerCommand(
    "vscode-gleam-qol.jump_to_gleam",
    jump_to_ffi_or_gleam
  );
  context.subscriptions.push(cmd_jump_to_gleam);
  //

  let jump_to_test_or_src = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;

      let docPath = document.fileName;
      let workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        let workspaceRoot = workspaceFolders[0].uri.fsPath;
        let newFullPath = transformPath(
          workspaceRoot,
          docPath,
          "/src/",
          ".gleam",
          "/test/",
          ".gleam",
          "_test"
        );
        open_or_new_document(newFullPath);

        let function_name = getFunctionName();
        console.log(`function_name: ${function_name}`);
      }
    }
  };

  //
  let cmd_jump_to_test = vscode.commands.registerCommand(
    "vscode-gleam-qol.jump_to_test",
    jump_to_test_or_src
  );
  context.subscriptions.push(cmd_jump_to_test);

  //
  let cmd_jump_to_src = vscode.commands.registerCommand(
    "vscode-gleam-qol.jump_to_src",
    jump_to_test_or_src
  );
  context.subscriptions.push(cmd_jump_to_src);

  //
  activate_gleam_generate_imports(context);
  activate_gleam_beautify_imports(context);
  activate_erlang_abracadabra(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
