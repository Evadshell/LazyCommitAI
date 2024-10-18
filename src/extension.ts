import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[]; // Only folders will have children
}
dotenv.config();
import { generateCommitMessage } from "./aiHelper";
import { commitAndPushChanges } from "./gitHelper";
import { getCurrentGitHubRepo } from "./repoHelper";
import { getChangedFilesSummary } from "./fileChangesHelper";
import { showInfoMessage, showErrorMessage } from "./uiHelper";
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "lazycommitai" is now active!');
  console.log("Loaded environment variables:", process.env);

  let commitHelper = vscode.commands.registerCommand(
    "extension.commitAndPush",
    async () => {
      const repoUrl = await getCurrentGitHubRepo();

      if (repoUrl) {
        showInfoMessage(`Connected to repository: ${repoUrl}`);

        // Fetch the changes summary for the current workspace
        const changesSummary = await getChangedFilesSummary();
        console.log(changesSummary);

        const commitMessage = await generateCommitMessage(changesSummary);
        console.log(commitMessage);
        showInfoMessage(`Generated commit message: ${commitMessage}`);

        commitAndPushChanges(commitMessage);
      } else {
        showErrorMessage("Could not find the GitHub repository.");
      }
    }
  );
  // Register command for the LazyCommit dashboard

  let openDashboard = vscode.commands.registerCommand('extension.openDashboard', () => {
    const panel = vscode.window.createWebviewPanel(
      'lazycommitDashboard',
      'Lazycommit Dashboard',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))],
      }
    );

    // Send the file structure to the webview
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const fileTree = buildFileTreeStructure(workspaceFolder);
if (fileTree) {
  panel.webview.html = getWebviewContent(panel.webview, context.extensionPath, fileTree);
} else {
  console.error("Failed to build file tree structure.");
}

    // Handle messages from the webview
  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.type) {
        case 'getFileContent':
            const filePath = message.data;
            try {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                panel.webview.postMessage({ command: 'displayFileContent', content: fileContent });
            } catch (err) {
                console.error('Error reading file:', err);
                panel.webview.postMessage({ command: 'displayFileContent', content: 'Error reading file.' });
            }
            break;
    }
});
});
  const disposable = vscode.commands.registerCommand(
    "lazycommitai.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from LazyCommitAI!");
    }
  );

  context.subscriptions.push(disposable, commitHelper, openDashboard);
}
function buildFileTreeStructure(dirPath: string): FileNode | null {
  const ignoredFolders = ['node_modules', '.git', '.vscode' , '.next'];
  const ignoredFiles = ['.DS_Store', 'Thumbs.db','package.json','package-lock.json'];

  try {
    const stats = fs.statSync(dirPath);
    const baseName = path.basename(dirPath);

    if (ignoredFolders.includes(baseName) || ignoredFiles.includes(baseName)) {
      return null;
    }

    if (stats.isDirectory()) {
      const children = fs.readdirSync(dirPath)
        .map((child) => buildFileTreeStructure(path.join(dirPath, child)))
        .filter((child) => child !== null);

      return {
        name: baseName,
        path: dirPath,
        type: 'folder',
        children: children,
      };
    } else {
      return {
        name: baseName,
        path: dirPath,
        type: 'file',
      };
    }
  } catch (error) {
    console.error(`Error reading directory or file at ${dirPath}:`, error);
    return null;
  }
}
// Function to generate webview content with the file structure
function getWebviewContent(webview: vscode.Webview, extensionPath: string, fileTree: FileNode): string {
  const bundlePath = path.join(extensionPath, "webview", "dist", "bundle.js");
  let bundleJsContent = "";

  try {
    bundleJsContent = fs.readFileSync(bundlePath, "utf8");
    console.log("Successfully loaded bundle.js from path:", bundlePath);
  } catch (error) {
    console.error("Error loading bundle.js:", error);
    bundleJsContent = 'console.error("Failed to load bundle.js")';
  }
  console.log('File tree being passed to webview:', fileTree); // Log fileTree to debug
  // Convert the files and folders to a JSON string to pass to the React app
  // const filesAndFoldersJson = JSON.stringify(filesAndFolders);

  return `
       <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lazycommit Dashboard</title>
          <style>
                body { margin: 0; padding: 0; }
            </style>
      </head>
      <body>
          <div id="root"></div>
          <h1>hi</h1>
          <script>
            window.fileTree = ${JSON.stringify(fileTree)};
            window.vscode = acquireVsCodeApi();
          </script>
          <div id="root"></div>
          <script>${bundleJsContent}</script>
      </body>
      </html>
  `;
}

export function deactivate() {}
