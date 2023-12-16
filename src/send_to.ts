import * as vscode from "vscode";
import * as cp from 'copy-paste';

export function send_to_clipboard(text: string) {
    cp.copy(text, (err) => {
        if (err) {
            vscode.window.showErrorMessage('Failed to copy text to clipboard');
        } else {
            vscode.window.showInformationMessage('Text copied to clipboard');
        }
    });
}

export function send_to_terminal(text: string,cr=true) {
    let terminal = vscode.window.activeTerminal;
    if (terminal) {
        terminal.sendText(text,cr);
        vscode.window.showInformationMessage('Text sent to terminal');
    } else {
        vscode.window.showErrorMessage('No active terminals');
    }
}
