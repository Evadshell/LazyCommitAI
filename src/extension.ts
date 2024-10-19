import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as natural from 'natural';
import { indexWorkspace,loadFileIndex } from "./fileIndexer";
interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[]; // Only folders will have children
}
dotenv.config();
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
});
import { generateCommitMessage } from "./aiHelper";
import {
  commitAndPushChanges,
  getCommitHistory,
  revertToCommit,
} from "./gitHelper";
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

        // commitAndPushChanges(commitMessage);
        const userConfirmation = await vscode.window.showInformationMessage(
          `Generated commit message: ${commitMessage}. Do you want to proceed with this commit?`,
          { modal: true },
          "Yes",
          "No",
          "Change"
        );

        if (userConfirmation === "Yes") {
          commitAndPushChanges(commitMessage);
          showInfoMessage("Commit successful!");
        } else if (userConfirmation === "Change") {
          const userInput = await vscode.window.showInputBox({
            prompt: `Enter a new commit message:`,
            value: commitMessage,
            placeHolder: "Type your new commit message here",
          });

          if (userInput !== undefined) {
            const finalCommitMessage = userInput.trim() || commitMessage;
            commitAndPushChanges(finalCommitMessage);
            showInfoMessage("Commit successful!");
          } else {
            showInfoMessage("Commit canceled.");
          }
        } else {
          showInfoMessage("Commit canceled.");
        }
      } else {
        showErrorMessage("Could not find the GitHub repository.");
      }
    }
  );
  // Register command for the LazyCommit dashboard
  let indexWorkspaceCommand = vscode.commands.registerCommand(
    "extension.indexWorkspace",
    async () => {
      try {
        vscode.window.showInformationMessage("Indexing workspace...");
        await indexWorkspace();
        vscode.window.showInformationMessage("Workspace indexed successfully!");
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(`Error indexing workspace: ${error.message}`);
        } else {
          vscode.window.showErrorMessage(`Error indexing workspace: ${String(error)}`);
        }
      }
    }
  );
  let openDashboard = vscode.commands.registerCommand(
    "extension.openDashboard",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "lazycommitDashboard",
        "Lazycommit Dashboard",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(
              path.join(context.extensionPath, "webview", "dist")
            ),
          ],
        }
      );

      // Send the file structure to the webview
      const workspaceFolder =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
      const fileTree = buildFileTreeStructure(workspaceFolder);
      if (fileTree) {
        panel.webview.html = getWebviewContent(
          panel.webview,
          context.extensionPath,
          fileTree
        );
      } else {
        console.error("Failed to build file tree structure.");
      }

      // Handle messages from the webview
      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
          case "getFileSummary":
            const filePath = message.data;
            try {
              const fileContent = fs.readFileSync(filePath, "utf-8");
              const summary = await getFileSummary(fileContent);
              panel.webview.postMessage({
                command: "displayFileSummary",
                content: summary,
              });
            } catch (err) {
              console.error("Error reading file:", err);
              panel.webview.postMessage({
                command: "displayFileSummary",
                content: "Error reading file.",
              });
            }
            break;
          case "improveCode":
            const { code, instructions } = message.data;
            try {
              const improvedCode = await improveCode(code, instructions);
              panel.webview.postMessage({
                command: "displayImprovedCode",
                content: improvedCode,
              });
            } catch (err) {
              console.error("Error improving code:", err);
              panel.webview.postMessage({
                command: "displayImprovedCode",
                content: "Error improving code.",
              });
            }
            break;
          case "breakFile":
            const filePathToBreak = message.data;
            try {
              const fileContent = fs.readFileSync(filePathToBreak, "utf-8");
              const breakSuggestion = await getFileBreakSuggestion(fileContent);
              panel.webview.postMessage({
                command: "displayBreakSuggestion",
                content: breakSuggestion,
                filePath: filePathToBreak,
              });
            } catch (err) {
              console.error("Error breaking file:", err);
              panel.webview.postMessage({
                command: "displayBreakSuggestion",
                content: "Error breaking file.",
              });
            }
            break;
//TODO: see this breakdown function properly
          case "applyBreakdown":
            try {
              await handleFileBreakdownRequest(filePathToBreak, panel);
              
            } catch (err) {
              console.error("Error breaking file:", err);
              panel.webview.postMessage({
                command: "displayBreakSuggestion",
                content: "Error breaking file.",
              });
            }
            break;
          case "getCommitHistory":
            try {
              const commitHistory = await getCommitHistory();
              panel.webview.postMessage({
                command: "displayCommitHistory",
                content: commitHistory,
              });
            } catch (err) {
              console.error("Error fetching commit history:", err);
              panel.webview.postMessage({
                command: "displayCommitHistory",
                content: [],
              });
            }
            break;
          case "revertCommit":
            const commitHash = message.data;
            try {
              await revertToCommit(commitHash);
              panel.webview.postMessage({
                command: "revertSuccess",
                content: "Revert operation successful.",
              });
            } catch (err) {
              console.error("Error reverting commit:", err);
              panel.webview.postMessage({
                command: "revertError",
                content: "Error reverting commit.",
              });
            }
            break;
            case "globalSearch":
              console.log(message.data);
              await handleGlobalSearch(message.data, panel);
              break;
        }
      });
    }
  );
  const disposable = vscode.commands.registerCommand(
    "lazycommitai.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from LazyCommitAI!");
    }
  );

  context.subscriptions.push(disposable, commitHelper, openDashboard,indexWorkspaceCommand);
}
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();
// ... (other imports and code remain the same)
// Ensure this import is present
// import Fuse from 'fuse.js'; // Correct Fuse.js import
async function handleGlobalSearch(query: string, panel: vscode.WebviewPanel) {
  const Fuse = (await import('fuse.js')).default;  // Dynamic import of Fuse.js

  const fileIndex = loadFileIndex();
  console.log(`Performing global search for query: ${query}`);
  console.log(`Loaded file index: `, fileIndex);

  if (Object.keys(fileIndex).length === 0) {
    panel.webview.postMessage({
      command: "searchResults",
      results: [],
      error: "Workspace not indexed. Please run the 'Index Workspace' command first.",
    });
    return;
  }

  const searchData = Object.entries(fileIndex).map(([filePath, fileInfo]) => ({
    file: filePath,
    summary: fileInfo.summary,
    features: fileInfo.features.join(', '), // Join features as a string for better searching
  }));

  // Fuse.js search options
  const options = {
    includeScore: true,
    keys: ['summary', 'features'], // Search in both summary and features
    threshold: 0.5, // Adjust sensitivity of the search (lower is more strict, higher is more fuzzy)
  };
console.log(searchData);
  // Initialize Fuse.js
  const fuse = new Fuse(searchData, options);

  // Perform the search and log the raw results
  const searchResults = fuse.search(query);
  console.log("Raw Fuse.js search results:", searchResults);
  
  // Map Fuse.js results back to original structure
  const refinedResults = searchResults.map(result => result.item);
  console.log("Refined search results:", refinedResults);

  console.log("Sending search results:", refinedResults);
  panel.webview.postMessage({
    command: "searchResults",
    results: refinedResults,
  });
}



async function getFileSummary(fileContent: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that summarizes code files. Provide a brief overview of the file's contents and purpose.",
      },
      {
        role: "user",
        content: `Summarize the following code:\n\n${fileContent}`,
      },
    ],
    model: "llama3-8b-8192",
  });

  return (
    chatCompletion.choices[0]?.message?.content || "Unable to generate summary."
  );
}
async function handleFileBreakdownRequest(
  data: { filePath: string; suggestion: string },
  panel: vscode.WebviewPanel
) {
  try {
    const { filePath, suggestion } = data;
    const breakdowns = parseBreakdownSuggestion(suggestion);

    const confirmed = await vscode.window.showInformationMessage(
      "Do you want to apply this breakdown suggestion?",
      { modal: true },
      "Apply"
    );

    if (confirmed === "Apply") {
      applyFileBreakdown(breakdowns, filePath);
      vscode.window.showInformationMessage(
        "File breakdown applied successfully!"
      );

      // Refresh the file tree
      const workspaceFolder =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
      const updatedFileTree = buildFileTreeStructure(workspaceFolder);
      panel.webview.postMessage({
        command: "updateFileTree",
        content: updatedFileTree,
      });
    }
  } catch (err) {
    console.error("Error applying file breakdown:", err);
    vscode.window.showErrorMessage("Error applying file breakdown.");
  }
}

function parseBreakdownSuggestion(
  suggestion: string
): Array<{ fileName: string; fileContent: string }> {
  const files: Array<{ fileName: string; fileContent: string }> = [];
  const fileRegex = /File: (.+)\n([\s\S]+?)(?=\nFile: |\n$)/g;
  let match;

  while ((match = fileRegex.exec(suggestion)) !== null) {
    const [, fileName, fileContent] = match;
    files.push({ fileName: fileName.trim(), fileContent: fileContent.trim() });
  }

  return files;
}

function applyFileBreakdown(
  breakdowns: Array<{ fileName: string; fileContent: string }>,
  originalFilePath: string
) {
  const baseDir = path.dirname(originalFilePath);

  breakdowns.forEach(({ fileName, fileContent }) => {
    const newFilePath = path.join(baseDir, fileName);
    fs.writeFileSync(newFilePath, fileContent, "utf-8");
  });

  // Optionally, you can delete or rename the original file
  // fs.unlinkSync(originalFilePath);
}

async function getFileBreakSuggestion(fileContent: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that analyzes code files and suggests how to break them into smaller, more manageable files. Provide detailed suggestions on how to split the file, including new file names and their contents. Use the format 'File: [filename]' followed by the file content for each suggested file.",
      },
      {
        role: "user",
        content: `Analyze the following code and suggest how to break it into smaller files:\n\n${fileContent}`,
      },
    ],
    model: "mixtral-8x7b-32768",
  });

  return (
    chatCompletion.choices[0]?.message?.content ||
    "Unable to generate file break suggestion."
  );
}
async function improveCode(
  code: string,
  instructions: string
): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that improves code based on given instructions. Provide the improved code along with explanations of the changes made.",
      },
      {
        role: "user",
        content: `Improve the following code based on these instructions: ${instructions}\n\nCode:\n${code}`,
      },
    ],
    model: "llama3-8b-8192",
  });

  return (
    chatCompletion.choices[0]?.message?.content || "Unable to improve code."
  );
}
function buildFileTreeStructure(dirPath: string): FileNode | null {
  const ignoredFolders = ["node_modules", ".git", ".vscode", ".next"];
  const ignoredFiles = [
    ".DS_Store",
    "Thumbs.db",
    "package.json",
    "package-lock.json",
  ];

  try {
    const stats = fs.statSync(dirPath);
    const baseName = path.basename(dirPath);

    if (ignoredFolders.includes(baseName) || ignoredFiles.includes(baseName)) {
      return null;
    }

    if (stats.isDirectory()) {
      const children = fs
        .readdirSync(dirPath)
        .map((child) => buildFileTreeStructure(path.join(dirPath, child)))
        .filter((child) => child !== null);

      return {
        name: baseName,
        path: dirPath,
        type: "folder",
        children: children,
      };
    } else {
      return {
        name: baseName,
        path: dirPath,
        type: "file",
      };
    }
  } catch (error) {
    console.error(`Error reading directory or file at ${dirPath}:`, error);
    return null;
  }
}
// Function to generate webview content with the file structure
function getWebviewContent(
  webview: vscode.Webview,
  extensionPath: string,
  fileTree: FileNode
): string {
  const bundlePath = path.join(extensionPath, "webview", "dist", "bundle.js");
  let bundleJsContent = "";

  try {
    bundleJsContent = fs.readFileSync(bundlePath, "utf8");
    console.log("Successfully loaded bundle.js from path:", bundlePath);
  } catch (error) {
    console.error("Error loading bundle.js:", error);
    bundleJsContent = 'console.error("Failed to load bundle.js")';
  }
  console.log("File tree being passed to webview:", fileTree); // Log fileTree to debug
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
         <button id="indexWorkspace">Index Workspace</button>
    <div id="root"></div>          <script>
            window.fileTree = ${JSON.stringify(fileTree)};
            window.vscode = acquireVsCodeApi();
          </script>
          <div id="root"></div>
          <script>${bundleJsContent}</script>
        <script>
          document.getElementById('indexWorkspace').addEventListener('click', () => {
            window.vscode.postMessage({ type: 'indexWorkspace' });
          });
        </script>
      </body>
      </html>
  `;
}

export function deactivate() {}
