import React, { useState, useEffect } from "react";
const App = () => {
  const [fileTree, setFileTree] = useState([]);
  const [selectedFileContent, setSelectedFileContent] = useState("");

  useEffect(() => {
    // Load the file structure passed from the extension
    setFileTree(window.filesAndFolders || []);

    // Listen for messages from the extension to get file content
    window.addEventListener("message", (event) => {
      const { command, content } = event.data;
      if (command === "showFileContent") {
        setSelectedFileContent(content);
      }
    });
  }, []);

  const handleFileClick = (filePath) => {
    // Send a message to the extension to fetch file content
    // eslint-disable-next-line no-undef
    vscode.postMessage({
      command: "fetchFileContent",
      filePath: filePath,
    });
  };

  return (
    <div className="dashboard-container">
      <div className="file-tree">
        <h3>File Explorer</h3>
        <ul>
          {fileTree.map((item, index) => (
            <li key={index} onClick={() => handleFileClick(item.path)}>
              {item.type === "folder" ? "📂 " : "📄 "}
              {item.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="file-content">
        <h3>File Content</h3>
        <pre>{selectedFileContent || "Select a file to view its content."}</pre>
      </div>
    </div>
  );
};
export default App;
//# sourceMappingURL=App.js.map
