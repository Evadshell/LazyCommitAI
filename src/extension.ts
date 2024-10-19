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
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: "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" });
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
        case 'getFileSummary':
            const filePath = message.data;
            try {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const summary = await getFileSummary(fileContent);
                panel.webview.postMessage({ command: 'displayFileSummary', content: summary });
            } catch (err) {
                console.error('Error reading file:', err);
                panel.webview.postMessage({ command: 'displayFileSummary', content: 'Error reading file.' });
            }
            break;
            case 'improveCode':
                const { code, instructions } = message.data;
                try {
                    const improvedCode = await improveCode(code, instructions);
                    panel.webview.postMessage({ command: 'displayImprovedCode', content: improvedCode });
                } catch (err) {
                    console.error('Error improving code:', err);
                    panel.webview.postMessage({ command: 'displayImprovedCode', content: 'Error improving code.' });
                }
                break;
            case 'breakFile':
                const filePathToBreak = message.data;
                try {
                    const fileContent = fs.readFileSync(filePathToBreak, 'utf-8');
                    const breakSuggestion = await getFileBreakSuggestion(fileContent);
                    panel.webview.postMessage({ command: 'displayBreakSuggestion', content: breakSuggestion });
                } catch (err) {
                    console.error('Error breaking file:', err);
                    panel.webview.postMessage({ command: 'displayBreakSuggestion', content: 'Error breaking file.' });
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
async function getFileSummary(fileContent: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
      messages: [
          {
              role: "system",
              content: "You are an AI assistant that summarizes code files. Provide a brief overview of the file's contents and purpose."
          },
          {
              role: "user",
              content: `Summarize the following code:\n\n${fileContent}`
          }
      ],
      model: "llama3-8b-8192",
  });

  return chatCompletion.choices[0]?.message?.content || "Unable to generate summary.";
}

async function improveCode(code: string, instructions: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
      messages: [
          {
              role: "system",
              content: "You are an AI assistant that improves code based on given instructions. Provide the improved code along with explanations of the changes made."
          },
          {
              role: "user",
              content: `Improve the following code based on these instructions: ${instructions}\n\nCode:\n${code}`
          }
      ],
      model: "llama3-8b-8192",
  });

  return chatCompletion.choices[0]?.message?.content || "Unable to improve code.";
}
async function getFileBreakSuggestion(fileContent: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
      messages: [
          {
              role: "system",
              content: "You are an AI assistant that analyzes code files and suggests how to break them into smaller, more manageable files. Provide detailed suggestions on how to split the file, including new file names and their contents."
          },
          {
              role: "user",
              content: `Analyze the following code and suggest how to break it into smaller files:\n\n${fileContent}`
          }
      ],
      model: "llama3-8b-8192",
  });

  return chatCompletion.choices[0]?.message?.content || "Unable to generate file break suggestion.";
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
