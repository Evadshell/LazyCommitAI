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

  export function revertToCommit(commitHash: string){
    exec(`git revert ${commitHash}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error reverting commit: ${stderr}`);
            showToast('Failed to revert the commit', 'error'); // Show error message on failure
        } else {
            console.log(`Commit reverted successfully: ${stdout}`);
            showToast('Commit reverted successfully', 'success'); // Show success message on completion
        }
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