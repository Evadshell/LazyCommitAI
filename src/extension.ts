import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { generateCommitMessage } from "./aiHelper";
import { commitAndPushChanges } from "./gitHelper";
import { getCurrentGitHubRepo } from "./repoHelper";
import { getChangedFilesSummary } from "./fileChangesHelper";
import { showInfoMessage, showErrorMessage } from "./uiHelper";
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "lazycommitai" is now active!');
  let commitHelper = vscode.commands.registerCommand(
    "extension.commitAndPush",
    async () => {
      const repoUrl = await getCurrentGitHubRepo();

      if (repoUrl) {
        showInfoMessage(`Connected to repository: ${repoUrl}`);

        // Fetch the changes summary for the current workspace
        const changesSummary = await getChangedFilesSummary();

        const commitMessage = await generateCommitMessage(changesSummary);
        showInfoMessage(`Generated commit message: ${commitMessage}`);

        commitAndPushChanges(commitMessage);
      } else {
        showErrorMessage("Could not find the GitHub repository.");
      }
    }
  );

  const disposable = vscode.commands.registerCommand(
    "lazycommitai.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from LazyCommitAI!");
    }
  );

  context.subscriptions.push(disposable, commitHelper);
}

export function deactivate() {}
