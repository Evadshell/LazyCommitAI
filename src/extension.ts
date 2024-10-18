 
import * as vscode from 'vscode';
 
export function activate(context: vscode.ExtensionContext) {
 
	console.log('Congratulations, your extension "lazycommitai" is now active!');
 
	const disposable = vscode.commands.registerCommand('lazycommitai.helloWorld', () => { 
		vscode.window.showInformationMessage('Hello World from LazyCommitAI!');
	});

	context.subscriptions.push(disposable);
}
 
export function deactivate() {}
