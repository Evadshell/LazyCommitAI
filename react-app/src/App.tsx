import React, { useEffect, useState } from "react";
import FileTree from "./components/FileTree";
import CodeImprovement from "./components/CodeImprovement";

import Navbar from "./components/Navbar";
import FileBreaker from "./components/FileBreaker";
import CopilotPromptGenerator from "./components/CopilotPromptGenerator";
import "./App.css";
import CommitTree from "./components/CommitTree";

declare global {
  interface Window {
    fileTree: any;
    vscode: any;
  }
}

function App() {
  const [fileTree, setFileTree] = useState(null);
  const [fileSummary, setFileSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [improvedCode, setImprovedCode] = useState("");
  const [breakSuggestion, setBreakSuggestion] = useState("");
  const [activeTab, setActiveTab] = useState("fileSummary");

  useEffect(() => {
    if (window.fileTree) {
      setFileTree(window.fileTree);
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "displayFileSummary") {
        setFileSummary(message.content);
      } else if (message.command === "fileTree") {
        setFileTree(message.content);
      } else if (message.command === "displayImprovedCode") {
        setImprovedCode(message.content);
      } else if (message.command === "displayBreakSuggestion") {
        setBreakSuggestion(message.content);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath);
    window.vscode?.postMessage({ type: "getFileSummary", data: filePath });
  };

  const handleBreakFile = () => {
    window.vscode?.postMessage({ type: "breakFile", data: selectedFile });
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <div className="file-tree-container">
          <h2>Project Structure</h2>
          {fileTree ? (
            <FileTree
              fileStructure={fileTree}
              onFileClick={handleFileClick}
              selectedFile={selectedFile}
            />
          ) : (
            <p>Loading file structure...</p>
          )}
        </div>
        <div className="content-container">
          {activeTab === "fileSummary" && (
            <div className="file-summary-container">
              <h2>File Summary: {selectedFile}</h2>
              <pre>{fileSummary || "Select a file to view its summary."}</pre>
              <button onClick={handleBreakFile}>Suggest File Break</button>
            </div>
          )}
          {activeTab === "codeImprovement" && (
            <CodeImprovement setImprovedCode={setImprovedCode} />
          )}
          {activeTab === "copilotPrompt" && <CopilotPromptGenerator />}
          {activeTab === "improvedCode" && (
            <div className="improved-code-container">
              <h2>Improved Code</h2>
              <pre>{improvedCode || "Improved code will appear here."}</pre>
            </div>
          )}
          {activeTab === "fileBreaker" && (
            <FileBreaker breakSuggestion={breakSuggestion} />
          )}
          {activeTab === "commitHistory" && <CommitTree />}
        </div>
      </div>
    </div>
  );
}

export default App;
