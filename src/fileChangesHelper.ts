import { exec } from 'child_process';
import * as vscode from 'vscode';

export async function getChangedFilesSummary(): Promise<string> {
    return new Promise((resolve, reject) => {
        // Get a list of modified files
        exec('git diff --name-only', { cwd: vscode.workspace.rootPath }, (error, stdout) => {
            if (error) {
                vscode.window.showErrorMessage('Failed to fetch changed files.');
                reject('Error fetching changed files');
                return;
            }

            const filesChanged = stdout.trim().split('\n');
            if (filesChanged.length === 0) {
                resolve('No changes detected.');
                return;
            }

            let changesSummary = `## Changed Files Summary\n\n`;
            changesSummary += `**List of changed files:**\n${filesChanged.join('\n')}\n\n`;

            // Get detailed diffs for each file
            exec('git diff --unified=3', { cwd: vscode.workspace.rootPath }, (diffError, diffOutput) => {
                if (diffError) {
                    vscode.window.showErrorMessage('Failed to fetch file changes.');
                    reject('Error fetching file changes');
                    return;
                }

                changesSummary += `## Detailed Changes:\n\n`;

                filesChanged.forEach((file) => {
                    const fileDiff = diffOutput
                        .split(`diff --git a/${file} b/${file}`)[1]
                        ?.split('diff --git ')[0]
                        ?.trim();

                    if (fileDiff) {
                        changesSummary += `### File: ${file}\n`;
                        changesSummary += '```diff\n' + fileDiff + '\n```\n\n';
                    }
                });

                resolve(changesSummary);
            });
        });
    });
}
