import {setSrcDir,addPostFix,removePostFix,gleamPathToErlangPath,erlangPathToGleamPath} from "./extension_sub";

let srcPath = "/home/user/vscode-ext/test/dir/srcfile.gleam";
let workspaceRoot = "/home/user/vscode-ext/"; 

let newPath = setSrcDir(workspaceRoot,srcPath);
console.log(newPath);

let newPath2 = addPostFix(newPath,"_test");
console.log(newPath2);

let newPath3 = removePostFix(newPath2,"_test");
console.log(newPath3);

let newPath4 = gleamPathToErlangPath(workspaceRoot+"src/", newPath3);
console.log(newPath4);

let newPath5 = erlangPathToGleamPath(workspaceRoot+"src/", newPath4);
console.log(newPath5);

