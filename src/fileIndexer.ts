import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
});

interface FileIndex {
  [filePath: string]: {
    name: string;
    summary: string;
    features: string[];
  };
}

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build','.next'];
const EXCLUDED_FILES = ['package-lock.json', 'yarn.lock','file-index.json'];
const INCLUDED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.md'];

export async function indexWorkspace(): Promise<FileIndex> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    throw new Error("No workspace folder open");
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const fileIndex: FileIndex = {};

  await indexDirectory(rootPath, fileIndex);

  // Save the file index
  const indexPath = path.join(rootPath,'file-index.json');
  try {
    fs.writeFileSync(indexPath, JSON.stringify(fileIndex, null, 2));
    console.log(`File index saved to ${indexPath}`);
  } catch (error) {
    console.error(`Error writing file index: ${error}`);
  }
  return fileIndex;
}

async function indexDirectory(dirPath: string, fileIndex: FileIndex): Promise<void> {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        await indexDirectory(fullPath, fileIndex);
      }
    } else if (entry.isFile()) {
      if (!EXCLUDED_FILES.includes(entry.name) && INCLUDED_EXTENSIONS.includes(path.extname(entry.name))) {
        const relativePath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        const summary = await getFileSummary(content);
        const features = extractFeatures(content);

        fileIndex[relativePath] = {
          name: entry.name,
          summary,
          features,
        };
      }
    }
  }
}

async function getFileSummary(fileContent: string): Promise<string> {
    const maxLength = 4000; // Adjust this value based on the model's context length
    const truncatedContent = fileContent.length > maxLength 
      ? fileContent.slice(0, maxLength) + "... (truncated)"
      : fileContent;
  
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that summarizes code files. Provide a brief overview of the file's contents and purpose.",
        },
        {
          role: "user",
          content:` Summarize the following code:\n\n${truncatedContent}`,
        },
      ],
      model: "llama3-8b-8192",
    });
  
    return chatCompletion.choices[0]?.message?.content || "Unable to generate summary.";
  }
function extractFeatures(fileContent: string): string[] {
  const features: string[] = [];
  
  const patterns = [
    /function\s+(\w+)/g,
    /const\s+(\w+)\s*=/g,
    /class\s+(\w+)/g,
    /interface\s+(\w+)/g,
    /type\s+(\w+)/g,
    /@(\w+)Decorator/g,
    /import.*from\s+['"](.+)['"]/g,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(fileContent)) !== null) {
      features.push(match[1]);
    }
  });

  return [...new Set(features)];
}

export function loadFileIndex(): FileIndex {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    throw new Error("No workspace folder open");
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const indexPath = path.join(rootPath,  'file-index.json');

  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    return JSON.parse(indexContent);
  }

  return {};
}