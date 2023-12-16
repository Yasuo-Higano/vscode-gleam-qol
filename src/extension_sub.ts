import * as path from "path";
//import * as fs from "fs";

// --------------------------------------------------------------------------------------------------------------------------------
// vscode independents
// --------------------------------------------------------------------------------------------------------------------------------
export function removePostFixFromPath(path: string, postFix: string): string {
  const index = path.lastIndexOf(postFix);

  // postFixがpath内に存在しない場合、もとのpathを返す
  if (index === -1) {
    return path;
  }

  // pathから拡張子の手前にあるpostFixを取り除く
  const pathWithoutPostFix =
    path.substring(0, index) + path.substring(index + postFix.length);

  return pathWithoutPostFix;
}

// モジュール名を取得する
export function getModuleName(srcPath: string) {
  let parsedPath = path.parse(srcPath);
  return parsedPath.name;
}

// 拡張子を取得する (例: ".erl")
export function getPathExt(srcPath: string) {
  let parsedPath = path.parse(srcPath);
  return parsedPath.ext;
}

export function setPathExt(srcPath: string, newExt: string) {
  let parsedPath = path.parse(srcPath);
  //parsedPath.base = parsedPath.name + parsedPath.ext;
  parsedPath.base = parsedPath.name + newExt;
  return path.format(parsedPath);
}

function replaceAll(str: string, from: string, to: string) {
  let replaced = str.replace(from, to);
  if (replaced === str) {
    return replaced;
  }
  return replaceAll(replaced, from, to);
}

export function erlangPathToGleamPath(workspaceRoot: string, erlPath: string) {
  let relativePath = path.relative(workspaceRoot, erlPath);
  console.log("erlangPathToGleamPath erlPath: " + relativePath);
  console.log("erlangPathToGleamPath relative: " + relativePath);
  return setPathExt(
    workspaceRoot + "/" + replaceAll(relativePath, "@", "/"),
    ".gleam"
  );
}

export function gleamPathToErlangPath(
  workspaceRoot: string,
  gleamPath: string
) {
  let relativePath = path.relative(workspaceRoot, gleamPath);
  return setPathExt(
    workspaceRoot + "/" + replaceAll(relativePath, "/", "@"),
    ".erl"
  );
}

export function gleamPathToErlangModulePath(
  workspaceRoot: string,
  gleamPath: string
) {
  let relativePath = path.relative(workspaceRoot, gleamPath);
  return setPathExt(replaceAll(relativePath, "/", "@"), "");
}

export function setRootSrcDir(
  workspaceRoot: string,
  targetPath: string,
  rootName: string
) {
  let relativePath = path.relative(workspaceRoot, targetPath);
  let components = relativePath.split("/");
  components[0] = rootName;
  return workspaceRoot + components.join("/");
}
export function setSrcDir(workspaceRoot: string, targetPath: string) {
  return setRootSrcDir(workspaceRoot, targetPath, "src");
}

export function addPostFix(srcPath: string, postFix: string) {
  let parsedPath = path.parse(srcPath);
  //parsedPath.name = parsedPath.name + postFix;
  parsedPath.base = parsedPath.name + postFix + parsedPath.ext;
  return path.format(parsedPath);
}

export function removePostFix(srcPath: string, postFix: string) {
  let parsedPath = path.parse(srcPath);
  if (parsedPath.name.endsWith(postFix)) {
    parsedPath.name = parsedPath.name.replace(postFix, "");
  }
  parsedPath.base = parsedPath.name + parsedPath.ext;
  return path.format(parsedPath);
}

export function getFileNameWithoutExtension(fullPath: string): string {
  const baseName = "" + fullPath.split("/").pop(); // フルパスからファイル名を取得
  const fileNameWithoutExtension = baseName.replace(/\.[^/.]+$/, ""); // 拡張子を削除
  return "" + fileNameWithoutExtension;
}

// remove arity from function name of erlang
// ex: "foo/1" -> "foo"
export function removeArity(function_name: string): string {
  return function_name.split("/")[0];
}

// --------------------------------------------------------------------------------------------------------------------------------
// vscode dependents
// --------------------------------------------------------------------------------------------------------------------------------
import * as vscode from "vscode";

export function getSymbolUnderCursor() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const position = editor.selection.active;
    const line = position.line;
    const character = position.character;

    // Get text at the cursor position
    const lineText = editor.document.lineAt(line).text;

    //
    function isNamePathChar(chr: string) {
      return chr.match(/[a-zA-Z0-9_@\.]/);
    }
    function searchLeftDelimiter(lineText: string, ip: number): number {
      for (let i = ip; i >= 0; i--) {
        let chr = lineText.charAt(i);
        if (isNamePathChar(chr)) {
          continue;
        }
        return i;
      }
      return -1;
    }

    function searchRightDelimiter(lineText: string, ip: number): number {
      for (let i = ip; i < lineText.length; i++) {
        let chr = lineText.charAt(i);
        if (isNamePathChar(chr)) {
          continue;
        }
        return i;
      }
      return -1;
    }

    let li = searchLeftDelimiter(lineText, character);
    let ri = searchRightDelimiter(lineText, character);
    if (li === -1 || ri === -1) {
      return "";
    }
    let symbol = lineText.substring(li + 1, ri);
    console.log("symbol: ", symbol);
    return symbol;
  }
}

export function findModuleNameDotFunctionName(lineText: string): string {
  let regexp = /([a-zA-Z0-9_@]+)\.([a-zA-Z0-9_@]+)/g;
  let match = regexp.exec(lineText);
  if (match) {
    return match[0];
  }
  return "";
}

// find all 'module_name.function_name' patterns in the document
export function findAllModuleNameDotFunctionName(
  document: vscode.TextDocument
): string[] {
  let moduleNameDotFunctionNameSet: Set<string> = new Set();
  for (let i = 0; i < document.lineCount; i++) {
    let lineText = document.lineAt(i).text;
    let moduleNameDotFunctionName = findModuleNameDotFunctionName(lineText);
    if (moduleNameDotFunctionName) {
      moduleNameDotFunctionNameSet.add(moduleNameDotFunctionName);
    }
  }
  return Array.from(moduleNameDotFunctionNameSet.values()).sort().reverse();
}
