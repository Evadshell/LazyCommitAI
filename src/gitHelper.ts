import { exec } from 'child_process';
import * as vscode from 'vscode';

export async function commitAndPushChanges(commitMessage: string): Promise<void> {
    const gitCommands = [
        `git add .`,
        `git commit -m "${commitMessage}"`,
        `git push ` // Make sure you are pushing to the correct branch
    ];

    try {
        for (const command of gitCommands) {
            await runGitCommand(command);
        }
        vscode.window.showInformationMessage('Changes successfully committed and pushed!');
    } catch (error) {
        vscode.window.showErrorMessage(`Git commit error: ${error}`);
    }
}

async function runGitCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
                return;
            }
            resolve();
        });
    });
}
