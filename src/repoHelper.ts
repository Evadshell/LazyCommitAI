import { exec } from 'child_process';
import * as vscode from 'vscode';

export function getCurrentGitHubRepo(): Promise<string | null> {
    return new Promise((resolve, reject) => {
        exec('git remote get-url origin', { cwd: vscode.workspace.rootPath }, (error, stdout) => {
            if (error) {
                vscode.window.showErrorMessage('Failed to fetch the repository URL. Make sure you are in a Git repository.');
                resolve(null);
            } else {
                const repoUrl = stdout.trim();
                resolve(repoUrl);
            }
        });
    });
}

