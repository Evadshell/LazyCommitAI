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
export function getCommitHistory(): Promise<{ hash: string; message: string; date: string }[]> {
    return new Promise((resolve, reject) => {
      exec('git log --pretty=format:"%h|%s|%ad" --date=short', { cwd: vscode.workspace.rootPath }, (error, stdout) => {
        if (error) {
          reject(`Error fetching commit history: ${error.message}`);
        } else {
          const commitHistory = stdout
            .trim()
            .split("\n")
            .map(line => {
              const [hash, message, date] = line.split("|");
              return { hash, message, date };
            });
          resolve(commitHistory);
        }
      });
    });
  }
  // export function revertToCommit(commitHash: string): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     exec(`git reset --hard ${commitHash}`, { cwd: vscode.workspace.rootPath }, (error) => {
  //       if (error) {
  //         reject(`Error reverting to commit: ${error.message}`);
  //       } else {
  //         resolve();
  //       }
  //     });
  //   });
  // }
  export function revertToCommit(commitHash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(`git reset --hard ${commitHash}`, { cwd: vscode.workspace.rootPath }, (error) => {
        if (error) {
          reject(`Error reverting to commit: ${error.message}`);
          vscode.window.showErrorMessage(`Error reverting to commit: ${error.message}`);
        } else {
          resolve();
          vscode.window.showInformationMessage(`Successfully reverted to commit ${commitHash}`);
          vscode.commands.executeCommand('workbench.action.reloadWindow'); // Reloads the window after revert
        }
      });
    });
  }
  

// Function to show a toast message
function showToast(message: string, type: 'success' | 'error' | 'default') {
    // Assuming you're using a toast library like 'react-hot-toast' or similar in your UI
    const toast = require('react-hot-toast'); 

    if (type === 'success') {
        toast.success(message);
    } else if (type === 'error') {
        toast.error(message);
    } else {
        toast(message);
    }
}