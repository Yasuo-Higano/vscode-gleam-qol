import * as vscode from 'vscode';
import {activate as activateGleamRepl} from './gleam_repl';
import {activate as activateContextMenu} from './context_menu';

export function activate(context: vscode.ExtensionContext) {
    console.log("gleam-qol:extension activated");
    //activateGleamRepl(context);
    activateContextMenu(context);
}
