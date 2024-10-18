import * as vscode from 'vscode';
import { exec } from 'child_process';

export function getCurrentGitHubRepo(): Promise<string | null> {
    return new Promise((resolve, reject) => {
        exec('git remote get-url origin', { cwd: vscode.workspace.rootPath }, (error, stdout) => {
            if (error) {
                vscode.window.showErrorMessage('Failed to get repository information. Make sure you have a valid Git repository.');
                resolve(null);
                return;
            }
            const repoUrl = stdout.trim();
            if (repoUrl) {
                vscode.window.showInformationMessage(`Connected to repository: ${repoUrl}`);
                resolve(repoUrl);
            } else {
                vscode.window.showErrorMessage('No GitHub repository found.');
                resolve(null);
            }
        });
    });
}
